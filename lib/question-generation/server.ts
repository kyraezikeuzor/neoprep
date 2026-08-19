import { promises as fs } from "fs";
import path from "path";
import { createAdminClient } from "../supabase/admin.ts";
import {
  createEmptyTierCounts,
  getQuestionReferenceKind,
  getSkillReferenceNote,
  SKILL_DOMAIN_ORDER,
  type QuestionReferenceKind,
  type SkillCatalogEntry,
  type SkillCatalogRecord,
  type SkillCatalogSection,
} from "./metadata.ts";

const PROMPT_DIR = path.join(process.cwd(), "lib", "question-generation");
const ANTHROPIC_VERSION = "2023-06-01";

type PromptAssets = {
  skillGuide: string;
};

type AnthropicModel = {
  id?: string;
  display_name?: string;
  created_at?: string;
};

type RawGeneratedQuestion = {
  question_id?: unknown;
  source?: unknown;
  domain?: unknown;
  skill?: unknown;
  tier?: unknown;
  question_type?: unknown;
  stem?: unknown;
  blank_index?: unknown;
  choices?: unknown;
  correct_answer?: unknown;
  rationale?: unknown;
  graph_spec?: unknown;
};

type InsertableQuestion = {
  question_id: string;
  cb: boolean;
  verified: boolean;
  domain: string;
  skill: string;
  tier: 1 | 2 | 3;
  question_type: "multiple_choice" | "grid_in";
  stem: string;
  choices: Record<string, string> | null;
  correct_answer: string;
  rationale: string;
  graph_spec: Record<string, unknown> | null;
  pattern_id: number;
};

export type GeneratedQuestionResult = {
  questionIds: string[];
  addedCount: number;
  anthropicModel: string;
  referenceFile: "MATH.md" | "READING.md";
  existingStemCount: number;
  created: InsertableQuestion[];
};

type GenerateQuestionsParams = {
  domain: string;
  skill: string;
  tier: 1 | 2 | 3;
  count: number;
  persist?: boolean;
  patternId?: number;
};

const promptAssetsPromises = new Map<QuestionReferenceKind, Promise<PromptAssets>>();
let anthropicModelPromise: Promise<string> | null = null;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Keep generated explanations direct and human-readable before persisting. */
function normalizeRationale(value: string): string {
  return value
    .replace(/[—–]/g, ", ")
    .replace(/\bStep\s*(\d+)\s*[:,\-]*\s*/gi, "$1. ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }
  return apiKey;
}

async function readPromptFile(filename: string): Promise<string> {
  return fs.readFile(path.join(PROMPT_DIR, filename), "utf8");
}

export async function loadQuestionGenerationAssets(
  referenceKind: QuestionReferenceKind
): Promise<PromptAssets> {
  const existing = promptAssetsPromises.get(referenceKind);
  if (existing) return existing;

  const next = readPromptFile("SKILL.md").then((skillGuide) => ({ skillGuide }));
  promptAssetsPromises.set(referenceKind, next);
  return next;
}

export async function listSkillGenerationSections(): Promise<SkillCatalogSection[]> {
  const admin = createAdminClient();
  const [skillsResult, questionsResult] = await Promise.all([
    admin.from("skills").select("id, domain, skill").order("domain").order("skill"),
    admin.from("questions").select("domain, skill, tier, verified"),
  ]);

  if (skillsResult.error) {
    throw new Error(`Could not load skills: ${skillsResult.error.message}`);
  }
  if (questionsResult.error) {
    throw new Error(`Could not load question counts: ${questionsResult.error.message}`);
  }

  const entries = new Map<string, SkillCatalogEntry>();
  for (const row of (skillsResult.data ?? []) as SkillCatalogRecord[]) {
    entries.set(`${row.domain}::${row.skill}`, {
      ...row,
      tiers: createEmptyTierCounts(),
    });
  }

  for (const row of questionsResult.data ?? []) {
    const tier = row.tier == null ? null : Number(row.tier);
    if (tier !== 1 && tier !== 2 && tier !== 3) continue;

    const entry = entries.get(`${row.domain}::${row.skill}`);
    if (!entry) continue;

    entry.tiers[tier].total += 1;
    if (row.verified === true) {
      entry.tiers[tier].verified += 1;
    }
  }

  const domains = new Map<string, SkillCatalogEntry[]>();
  for (const entry of entries.values()) {
    if (!domains.has(entry.domain)) domains.set(entry.domain, []);
    domains.get(entry.domain)!.push(entry);
  }

  const orderedDomains = [
    ...SKILL_DOMAIN_ORDER.filter((domain) => domains.has(domain)),
    ...[...domains.keys()].filter(
      (domain) => !(SKILL_DOMAIN_ORDER as readonly string[]).includes(domain)
    ),
  ];

  return orderedDomains.map((domain) => ({
    domain,
    skills: (domains.get(domain) ?? []).sort((a, b) => a.skill.localeCompare(b.skill)),
  }));
}

async function assertSkillExists(domain: string, skill: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("skills")
    .select("id")
    .eq("domain", domain)
    .eq("skill", skill)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not validate skill: ${error.message}`);
  }
  if (!data) {
    throw new Error("That domain/skill pair does not exist in the live skills table.");
  }
}

async function listExistingStems(domain: string, skill: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .select("stem")
    .eq("domain", domain)
    .eq("skill", skill)
    .not("stem", "is", null)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(`Could not load existing stems: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => (typeof row.stem === "string" ? row.stem.trim() : ""))
    .filter(Boolean);
}

function buildSystemPrompt(referenceKind: QuestionReferenceKind, assets: PromptAssets): {
  system: string;
  referenceFile: "MATH.md" | "READING.md";
} {
  const referenceFile = referenceKind === "math" ? "MATH.md" : "READING.md";

  return {
    referenceFile,
    system: [
      "You are ArcPrep's SAT question generation engine.",
      "Follow the exact instructions in the embedded source documents below.",
      "For this API request, Stage 1 is skipped because no source material is being analyzed.",
      "Perform Stage 2 only and return strict JSON with no prose outside the JSON payload.",
      "",
      "=== SKILL.md ===",
      assets.skillGuide,
      "",
      "Use only the selected skill context and selected pattern guidance supplied in the user request.",
    ].join("\n"),
  };
}

function buildUserPrompt(params: {
  domain: string;
  skill: string;
  tier: 1 | 2 | 3;
  count: number;
  referenceKind: QuestionReferenceKind;
  existingStems: string[];
  patternGuidance?: string;
  skillContext?: string;
}) {
  const { domain, skill, tier, count, referenceKind, existingStems, patternGuidance, skillContext } = params;
  const skillNote = getSkillReferenceNote(domain, skill);
  const questionTypeNote =
    referenceKind === "math"
      ? [
          "Each object must include question_type.",
          "Allowed math question_type values are \"multiple_choice\" and \"grid_in\".",
          "For grid_in questions, choices must be null and correct_answer must be a numeric string.",
        ].join(" ")
      : [
          "Each object must include question_type.",
          "All Reading & Writing questions in this batch must use question_type \"multiple_choice\".",
        ].join(" ");

  const stemsBlock =
    existingStems.length === 0
      ? "(No prior stems were found for this skill.)"
      : existingStems.map((stem, index) => `${index + 1}. ${stem}`).join("\n");

  return [
    `Generate ${count} brand-new original ArcPrep SAT questions.`,
    `Use domain "${domain}" exactly.`,
    `Use skill "${skill}" exactly.`,
    `Set tier to ${tier} on every object.`,
    skillContext ? `Selected skill context: ${skillContext}` : "",
    patternGuidance ? `Follow this selected question pattern guidance: ${patternGuidance}` : "",
    questionTypeNote,
    "Return JSON only: a single JSON array and nothing else.",
    "Do not wrap the JSON in markdown fences.",
    "Do not output a blueprint table.",
    "Do not copy or closely paraphrase existing stems.",
    "Avoid duplicating the topic, scenario, passage setup, chart setup, numbers, or phrasing of any existing stem below.",
    "Keep the exact College Board stem wording required by the reference instructions for this skill.",
    "Every distractor must be built from a named error pattern from the reference instructions, and the rationale must explain the correct answer plus why each distractor is wrong.",
    "Format each rationale as 2 to 4 short paragraphs or numbered steps written exactly as \"1. ...\". Keep prose outside LaTex delimiters; use \\(...\\) only for mathematical expressions, with spaces before and after each inline expression.",
    "Never put phrases such as 'of the form', 'where', or 'because' inside math delimiters. Use valid variable notation (for example, v_0 and h_0), never malformed text such as 'formh(t)' or 'v0*'.",
    "Do not use em dashes or en dashes anywhere. Use periods, commas, or parentheses instead.",
    "Use only neutral, classroom-appropriate fictional settings: science, literature, history, weather, ecology, engineering, manufacturing, retail, finance, transportation, education, sports, museums, and non-sensitive surveys. Never use disease, medicine, drugs, weapons, violence, crime, gambling, alcohol, tobacco, explicit content, partisan politics, or personal sensitive-trait claims.",
    "For data_table graph_spec: the stem must explicitly refer to the table (for example, 'The table shows...'). Do not also list the table's values in the stem. If the values are written directly in the stem, set graph_spec to null.",
    skillNote ? `Mapping note: ${skillNote}` : "",
    "",
    "Output schema for each array item:",
    JSON.stringify(
      {
        question_id: "short random id",
        source: "ArcPrep",
        domain,
        skill,
        tier,
        question_type:
          referenceKind === "math" ? "multiple_choice or grid_in" : "multiple_choice",
        stem: "full stem text",
        choices: { A: "choice A", B: "choice B", C: "choice C", D: "choice D" },
        correct_answer: "A",
        rationale: "full explanation",
        graph_spec: null,
      },
      null,
      2
    ),
    "",
    "Existing stems to avoid duplicating:",
    stemsBlock,
  ]
    .filter(Boolean)
    .join("\n");
}

type ClaudeResponse = {
  content?: Array<{ type?: string; text?: string }>;
};

function extractTextFromClaudeResponse(payload: ClaudeResponse): string {
  return (payload.content ?? [])
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/**
 * Extract one complete JSON object or array, even if a model appends a short
 * sentence after it. This tracks strings and escaped quotes so brackets inside
 * a stem or rationale cannot terminate the JSON early.
 */
function extractBalancedJsonValue(text: string): string | null {
  const start = text.search(/[\[{]/);
  if (start < 0) return null;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? "}" : "]");
    } else if (char === "}" || char === "]") {
      if (stack.pop() !== char) return null;
      if (stack.length === 0) return text.slice(start, index + 1);
    }
  }

  return null;
}

function tryParseJsonCandidate(text: string): unknown {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const sources = [fencedMatch?.[1]?.trim(), trimmed].filter(
    (value): value is string => Boolean(value)
  );
  const candidatePool = sources.flatMap((source) => [
    source,
    extractBalancedJsonValue(source),
  ]).filter((value): value is string => Boolean(value));

  let lastError: Error | null = null;
  for (const candidate of candidatePool) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Invalid JSON");
    }
  }

  throw lastError ?? new Error("Claude returned invalid JSON.");
}

function modelFamilyPriority(modelId: string): number {
  if (modelId.startsWith("claude-opus")) return 0;
  if (modelId.startsWith("claude-sonnet")) return 1;
  if (modelId.startsWith("claude-fable")) return 2;
  if (modelId.startsWith("claude-haiku")) return 3;
  return 9;
}

async function resolveAnthropicModel(): Promise<string> {
  if (!anthropicModelPromise) {
    anthropicModelPromise = (async () => {
      const apiKey = assertAnthropicApiKey();
      const response = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Could not load Anthropic models (${response.status}): ${errorText.slice(0, 500)}`
        );
      }

      const payload = (await response.json()) as { data?: AnthropicModel[] };
      const models = (payload.data ?? [])
        .filter((model): model is AnthropicModel & { id: string; created_at: string } =>
          typeof model.id === "string" && typeof model.created_at === "string"
        )
        .sort((a, b) => {
          const familyDiff = modelFamilyPriority(a.id) - modelFamilyPriority(b.id);
          if (familyDiff !== 0) return familyDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      const preferred = models.find((model) => model.id.startsWith("claude-opus"));
      const fallback = models[0];
      const resolved = preferred?.id ?? fallback?.id;

      if (!resolved) {
        throw new Error("Anthropic returned no usable models for this API key.");
      }

      return resolved;
    })();
  }

  return anthropicModelPromise;
}

async function callAnthropic(
  system: string,
  userPrompt: string
): Promise<{ text: string; model: string }> {
  const apiKey = assertAnthropicApiKey();
  const model = await resolveAnthropicModel();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 6400,
      system,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Claude API request failed (${response.status}): ${errorText.slice(0, 500)}`
    );
  }

  const payload = (await response.json()) as ClaudeResponse;
  const text = extractTextFromClaudeResponse(payload);
  if (!text) {
    throw new Error("Claude returned an empty response.");
  }
  return { text, model };
}

function normalizeChoices(raw: unknown): Record<string, string> | null {
  if (!isObjectRecord(raw)) return null;

  const normalizedEntries = Object.entries(raw).map(([choiceKey, choiceValue]) => [
    choiceKey.trim().toUpperCase(),
    typeof choiceValue === "string" ? choiceValue.trim() : "",
  ]);

  const choices = Object.fromEntries(normalizedEntries);
  const orderedKeys = Object.keys(choices).sort();
  const expectedKeys = ["A", "B", "C", "D"];
  const keysMatch =
    orderedKeys.length === expectedKeys.length &&
    orderedKeys.every((key, index) => key === expectedKeys[index]);

  if (!keysMatch) return null;
  if (expectedKeys.some((key) => !choices[key])) return null;

  return {
    A: choices.A,
    B: choices.B,
    C: choices.C,
    D: choices.D,
  };
}

function normalizeQuestionType(raw: unknown): "multiple_choice" | "grid_in" | null {
  if (!isNonEmptyString(raw)) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "multiple_choice") return "multiple_choice";
  if (normalized === "grid_in" || normalized === "spr") return "grid_in";
  return null;
}

function createQuestionId(): string {
  return `arc_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function isLikelyGridInAnswer(value: string): boolean {
  return /^-?\d+(?:\.\d+)?(?:\/\d+)?$/.test(value.trim());
}

function validateGeneratedQuestions(params: {
  raw: unknown;
  domain: string;
  skill: string;
  tier: 1 | 2 | 3;
  existingStems: string[];
  patternId: number;
}): InsertableQuestion[] {
  const { raw, domain, skill, tier, existingStems, patternId } = params;
  const questions = Array.isArray(raw) ? raw : [raw];

  if (questions.length === 0) {
    throw new Error("Claude returned an empty JSON payload.");
  }

  const normalizedExisting = new Set(existingStems.map(normalizeText));
  const seenBatchStems = new Set<string>();
  const referenceKind = getQuestionReferenceKind(domain);

  return questions.map((candidate, index) => {
    if (!isObjectRecord(candidate)) {
      throw new Error(`Question ${index + 1} is not a JSON object.`);
    }

    const question = candidate as RawGeneratedQuestion;

    if (!isNonEmptyString(question.domain) || normalizeText(question.domain) !== normalizeText(domain)) {
      throw new Error(`Question ${index + 1} has a domain that does not match "${domain}".`);
    }
    if (!isNonEmptyString(question.skill) || normalizeText(question.skill) !== normalizeText(skill)) {
      throw new Error(`Question ${index + 1} has a skill that does not match "${skill}".`);
    }

    const nextTier = Number(question.tier);
    if (nextTier !== tier || ![1, 2, 3].includes(nextTier)) {
      throw new Error(`Question ${index + 1} must use tier ${tier}.`);
    }

    const questionType = normalizeQuestionType(question.question_type);
    if (!questionType) {
      throw new Error(
        `Question ${index + 1} must include a recognized question_type.`
      );
    }
    if (referenceKind !== "math" && questionType !== "multiple_choice") {
      throw new Error(
        `Question ${index + 1} must use question_type "multiple_choice" for Reading & Writing.`
      );
    }

    if (!isNonEmptyString(question.stem)) {
      throw new Error(`Question ${index + 1} is missing a non-empty stem.`);
    }
    if (!isNonEmptyString(question.rationale)) {
      throw new Error(`Question ${index + 1} is missing a non-empty rationale.`);
    }

    const normalizedStem = normalizeText(question.stem);
    if (normalizedExisting.has(normalizedStem)) {
      throw new Error(
        `Question ${index + 1} duplicates an existing stem for this skill.`
      );
    }
    if (seenBatchStems.has(normalizedStem)) {
      throw new Error(`Question ${index + 1} duplicates another stem in the same batch.`);
    }
    seenBatchStems.add(normalizedStem);

    let choices: Record<string, string> | null = null;
    let correctAnswer = "";

    if (questionType === "multiple_choice") {
      choices = normalizeChoices(question.choices);
      if (!choices) {
        throw new Error(
          `Question ${index + 1} must have exactly four multiple-choice options labeled A-D.`
        );
      }
      if (!isNonEmptyString(question.correct_answer)) {
        throw new Error(`Question ${index + 1} is missing a correct_answer.`);
      }

      const normalizedAnswer = question.correct_answer.trim().toUpperCase();
      if (!Object.prototype.hasOwnProperty.call(choices, normalizedAnswer)) {
        throw new Error(
          `Question ${index + 1} must have a correct_answer that matches one of A-D.`
        );
      }
      correctAnswer = normalizedAnswer;
    } else {
      if (question.choices != null) {
        throw new Error(`Question ${index + 1} must use choices=null for grid_in.`);
      }
      if (!isNonEmptyString(question.correct_answer)) {
        throw new Error(`Question ${index + 1} must include a grid-in correct_answer.`);
      }
      choices = null;
      correctAnswer = question.correct_answer.trim();
      if (!isLikelyGridInAnswer(correctAnswer)) {
        throw new Error(
          `Question ${index + 1} must use a numeric-string correct_answer for grid_in.`
        );
      }
    }

    let graphSpec: Record<string, unknown> | null = null;
    if (question.graph_spec != null) {
      if (!isObjectRecord(question.graph_spec)) {
        throw new Error(`Question ${index + 1} has an invalid graph_spec payload.`);
      }
      graphSpec = question.graph_spec;
    }

    // A table that is not referenced by the stem is a confusing duplicate of
    // the question data. Keep only tables the student is explicitly told to use.
    if (graphSpec?.type === "data_table") {
      const referencesTable = /\b(?:the\s+)?table\s+(?:above|below|shows|lists|provides|contains)\b/i.test(question.stem);
      const listsValuesInStem = /:\s*(?:-?\d+(?:\.\d+)?\s*,\s*){2,}-?\d+(?:\.\d+)?/.test(question.stem);
      if (!referencesTable || listsValuesInStem) graphSpec = null;
    }

    return {
      question_id: createQuestionId(),
      cb: false,
      verified: false,
      domain,
      skill,
      tier,
      question_type: questionType,
      stem: question.stem.trim(),
      choices,
      correct_answer: correctAnswer,
      rationale: normalizeRationale(question.rationale),
      graph_spec: graphSpec,
      pattern_id: patternId,
    };
  });
}

async function insertGeneratedQuestions(
  questions: InsertableQuestion[]
): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .insert(questions)
    .select("question_id");

  if (error) {
    throw new Error(`Could not save generated questions: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => (typeof row.question_id === "string" ? row.question_id : ""))
    .filter(Boolean);
}

export async function generateQuestionsForSkill(
  params: GenerateQuestionsParams,
  onProgress?: (message: string) => void
): Promise<GeneratedQuestionResult> {
  const tier = Number(params.tier);
  const count = Number(params.count);
  if (tier !== 1 && tier !== 2 && tier !== 3) {
    throw new Error("Tier must be 1, 2, or 3.");
  }
  if (!Number.isFinite(count) || count < 1 || count > 10) {
    throw new Error("Batch count must be between 1 and 10.");
  }

  onProgress?.("Checking the selected skill and question inventory.");
  await assertSkillExists(params.domain, params.skill);
  const admin = createAdminClient();
  const { data: skillContextRow } = await admin
    .from("skills")
    .select("generation_context")
    .eq("domain", params.domain)
    .eq("skill", params.skill)
    .maybeSingle();
  const { data: pattern, error: patternError } = await admin
    .from("patterns")
    .select("id, name, prompt_guidance")
    .eq("id", params.patternId ?? -1)
    .eq("active", true)
    .maybeSingle();
  if (patternError || !pattern) throw new Error("The selected pattern is unavailable.");

  const referenceKind = getQuestionReferenceKind(params.domain);
  onProgress?.("Preparing SAT reference material and duplicate checks.");
  const [assets, existingStems] = await Promise.all([
    loadQuestionGenerationAssets(referenceKind),
    listExistingStems(params.domain, params.skill),
  ]);
  const { system, referenceFile } = buildSystemPrompt(referenceKind, assets);
  const userPrompt = buildUserPrompt({
    domain: params.domain,
    skill: params.skill,
    tier,
    count,
    referenceKind,
    existingStems,
    skillContext:
      skillContextRow?.generation_context ||
      `Use standard SAT conventions for ${params.domain}: ${params.skill}.`,
    patternGuidance: `${pattern.name}. ${pattern.prompt_guidance ?? ""}`.trim(),
  });

  onProgress?.("Claude is drafting the questions.");
  const anthropicResult = await callAnthropic(system, userPrompt);
  onProgress?.("Validating the generated questions.");
  const parsed = tryParseJsonCandidate(anthropicResult.text);
  const validated = validateGeneratedQuestions({
    raw: parsed,
    domain: params.domain,
    skill: params.skill,
    tier,
    existingStems,
    patternId: Number(pattern.id),
  });

  if (validated.length !== count) {
    throw new Error(
      `Claude returned ${validated.length} question(s), but ${count} were requested. Nothing was inserted.`
    );
  }

  onProgress?.("Saving the validated questions to Staging.");
  const questionIds =
    params.persist === false ? validated.map((question) => question.question_id) : await insertGeneratedQuestions(validated);

  return {
    questionIds,
    addedCount: validated.length,
    anthropicModel: anthropicResult.model,
    referenceFile,
    existingStemCount: existingStems.length,
    created: validated,
  };
}

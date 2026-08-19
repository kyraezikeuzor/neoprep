import { MATH_DOMAINS } from "../subjects.ts";

export const SKILL_DOMAIN_ORDER = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
  "Algebra",
  "Advanced Math",
  "Problem-Solving and Data Analysis",
  "Geometry and Trigonometry",
] as const;

export type QuestionReferenceKind = "math" | "reading_writing";

export type SkillCatalogRecord = {
  id: number;
  domain: string;
  skill: string;
};

export type SkillTierCount = {
  tier: 1 | 2 | 3;
  total: number;
  verified: number;
};

export type SkillCatalogEntry = SkillCatalogRecord & {
  tiers: Record<1 | 2 | 3, SkillTierCount>;
};

export type SkillCatalogSection = {
  domain: string;
  skills: SkillCatalogEntry[];
};

function key(domain: string, skill: string) {
  return `${domain}::${skill}`;
}

const SKILL_REFERENCE_NOTES = new Map<string, string>([
  [
    key("Information and Ideas", "Command of Evidence"),
    [
      "This exact ArcPrep skill covers the two reference variants named",
      "\"Command of Evidence (textual)\" and \"Command of Evidence (quantitative)\".",
      "Use one of those stem patterns, but set the persisted skill field to exactly",
      "\"Command of Evidence\".",
    ].join(" "),
  ],
  [
    key(
      "Problem-Solving and Data Analysis",
      "Evaluating statistical claims: Observational studies and experiments"
    ),
    [
      "Map this skill to the reference entry \"Evaluating statistical claims\".",
      "The scenario should specifically test observational-study or experiment reasoning,",
      "but the persisted skill field must stay exactly",
      "\"Evaluating statistical claims: Observational studies and experiments\".",
    ].join(" "),
  ],
  [
    key(
      "Problem-Solving and Data Analysis",
      "One-variable data: Distributions and measures of center and spread"
    ),
    [
      "Map this skill to the reference entry",
      "\"One-variable data: distributions and measures of center and spread\".",
      "Only the capitalization differs; keep the persisted skill text exactly as requested.",
    ].join(" "),
  ],
  [
    key(
      "Problem-Solving and Data Analysis",
      "Two-variable data: Models and scatterplots"
    ),
    [
      "Map this skill to the reference entry",
      "\"Two-variable data: models and scatterplots\".",
      "Only the capitalization differs; keep the persisted skill text exactly as requested.",
    ].join(" "),
  ],
]);

export function getQuestionReferenceKind(domain: string): QuestionReferenceKind {
  return (MATH_DOMAINS as readonly string[]).includes(domain) ? "math" : "reading_writing";
}

export function getSkillReferenceNote(domain: string, skill: string): string | null {
  return SKILL_REFERENCE_NOTES.get(key(domain, skill)) ?? null;
}

export function createEmptyTierCounts(): Record<1 | 2 | 3, SkillTierCount> {
  return {
    1: { tier: 1, total: 0, verified: 0 },
    2: { tier: 2, total: 0, verified: 0 },
    3: { tier: 3, total: 0, verified: 0 },
  };
}

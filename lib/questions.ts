export type Question = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
  stem: string;
  choices: Record<string, string> | null;
  correct_answer: string;
  rationale: string | null;
  image_urls?: Record<string, string> | null;
  graph_spec: Record<string, unknown> | null;
};

export const QUESTION_SELECT =
  "question_id, domain, skill, tier, stem, choices, correct_answer, rationale, graph_spec";

/** Normalize choices whether stored as JSON object or a Python-ish string dict. */
export function normalizeChoices(
  raw: unknown
): Record<string, string> | null {
  if (!raw) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  if (typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // fall through — some rows may use single-quoted Python dict literals
  }

  try {
    const asJson = raw.replace(/'/g, '"');
    const parsed = JSON.parse(asJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeQuestion(row: Record<string, unknown>): Question {
  return {
    ...(row as unknown as Question),
    choices: normalizeChoices(row.choices),
    tier: row.tier == null ? null : Number(row.tier),
  };
}

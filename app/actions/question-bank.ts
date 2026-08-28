import { createClient } from "@/lib/supabase/server";
import {
  MATH_DOMAINS,
  READING_DOMAINS,
  type SubjectFilter,
  type TierFilter,
} from "@/lib/subjects";
import {
  normalizeQuestion,
  QUESTION_SELECT,
  type Question,
} from "@/lib/questions";
import { getQuestionAccessForUser } from "@/lib/question-access.server";

export type { Question } from "@/lib/questions";

export type GetRandomQuestionOptions = {
  excludeId?: string;
  excludeIds?: string[];
  /** 1 Easy / 2 Medium / 3 Hard — omit or "all" for no tier filter */
  tier?: TierFilter;
  subject?: SubjectFilter;
};

/** Grabs one random question from the bank. Postgres doesn't have a cheap
 * built-in "random row" for large tables, but at ManyPrep's current scale
 * (thousands, not millions, of rows) ordering by a random() call server-side
 * is simple and fast enough - revisit if the bank gets much bigger.
 *
 * Prefer questions the signed-in user has never attempted. */
export async function getRandomQuestion(
  excludeIdOrOptions?: string | GetRandomQuestionOptions
): Promise<Question | null> {
  const options: GetRandomQuestionOptions =
    typeof excludeIdOrOptions === "string"
      ? { excludeId: excludeIdOrOptions }
      : excludeIdOrOptions ?? {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const skipIds = new Set<string>();
  if (options.excludeId) skipIds.add(options.excludeId);
  for (const questionId of options.excludeIds ?? []) skipIds.add(questionId);

  if (user) {
    const { data: attempts, error: attemptsError } = await supabase
      .from("attempts")
      .select("question_id")
      .eq("user_id", user.id);

    if (attemptsError) {
      console.error("getRandomQuestion attempts error:", attemptsError);
    } else {
      const attemptedIds = new Set<string>();
      for (const row of attempts ?? []) {
        if (row.question_id) {
          const questionId = String(row.question_id);
          attemptedIds.add(questionId);
          skipIds.add(questionId);
        }
      }
      const access = await getQuestionAccessForUser(user.id, attemptedIds);
      if (!access.canAccessNewQuestion) {
        return null;
      }
    }
  }

  // Reassigning PostgrestFilterBuilder with many `.eq`/`.in`/`.not` calls
  // makes TS "type instantiation excessively deep". Keep the builder untyped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .not("correct_answer", "is", null)
    .not("stem", "is", null);

  if (options.tier && options.tier !== "all") {
    query = query.eq("tier", options.tier);
  }

  if (options.subject === "math") {
    query = query.in("domain", [...MATH_DOMAINS]);
  } else if (options.subject === "reading_writing") {
    query = query.in("domain", [...READING_DOMAINS]);
  }

  if (skipIds.size === 1) {
    query = query.neq("question_id", [...skipIds][0]);
  } else if (skipIds.size > 1) {
    const list = [...skipIds].map((id) => `"${id}"`).join(",");
    query = query.not("question_id", "in", `(${list})`);
  }

  const { data, error } = await query.limit(50);

  if (error || !data || data.length === 0) {
    console.error("getRandomQuestion error:", error);
    return null;
  }

  return normalizeQuestion(
    data[Math.floor(Math.random() * data.length)] as Record<string, unknown>
  );
}

export type QuestionSearchHit = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
  stem: string;
};

function sanitizeSearchQuery(raw: string) {
  return raw
    .trim()
    .replace(/[,()%\\]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export async function searchQuestions(
  rawQuery: string,
  limit = 8
): Promise<QuestionSearchHit[]> {
  const query = sanitizeSearchQuery(rawQuery);
  if (query.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pattern = `%${query}%`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let builder: any = supabase
    .from("questions")
    .select("question_id, domain, skill, tier, stem")
    .not("correct_answer", "is", null)
    .not("stem", "is", null)
    .or(
      `question_id.ilike.${pattern},skill.ilike.${pattern},domain.ilike.${pattern},stem.ilike.${pattern}`
    );

  if (user) {
    const access = await getQuestionAccessForUser(user.id);
    if (!access.canAccessNewQuestion && !access.isPro) {
      const { data: attempts } = await supabase
        .from("attempts")
        .select("question_id")
        .eq("user_id", user.id);
      const attemptedIds = [
        ...new Set(
          (attempts ?? [])
            .map((row) => row.question_id && String(row.question_id))
            .filter((id): id is string => Boolean(id))
        ),
      ];
      if (attemptedIds.length === 0) return [];
      builder = builder.in("question_id", attemptedIds);
    }
  }

  const { data, error } = await builder.limit(
    Math.min(Math.max(limit, 1), 40)
  );

  if (error) {
    console.error("searchQuestions error:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    question_id: String(row.question_id ?? ""),
    domain: (row.domain as string | null) ?? null,
    skill: (row.skill as string | null) ?? null,
    tier: row.tier == null ? null : Number(row.tier),
    stem: String(row.stem ?? ""),
  }));
}

export async function getQuestionById(
  questionId: string
): Promise<Question | null> {
  const id = questionId.trim().toLowerCase();
  if (!id) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: priorAttempt } = await supabase
      .from("attempts")
      .select("question_id")
      .eq("user_id", user.id)
      .eq("question_id", id)
      .limit(1)
      .maybeSingle();
    if (!priorAttempt) {
      const access = await getQuestionAccessForUser(user.id);
      if (!access.canAccessNewQuestion) return null;
    }
  }

  const { data, error } = await supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .eq("question_id", id)
    .maybeSingle();

  if (error) {
    console.error("getQuestionById error:", error);
    return null;
  }
  if (data) return normalizeQuestion(data as Record<string, unknown>);

  const { data: prefixMatches, error: prefixError } = await supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .ilike("question_id", `${id}%`)
    .limit(2);

  if (prefixError) {
    console.error("getQuestionById prefix error:", prefixError);
    return null;
  }
  if (prefixMatches?.length === 1) {
    return normalizeQuestion(prefixMatches[0] as Record<string, unknown>);
  }

  return null;
}

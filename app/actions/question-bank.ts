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

export type { Question } from "@/lib/questions";

export type GetRandomQuestionOptions = {
  excludeId?: string;
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

  if (user) {
    const { data: attempts, error: attemptsError } = await supabase
      .from("attempts")
      .select("question_id")
      .eq("user_id", user.id);

    if (attemptsError) {
      console.error("getRandomQuestion attempts error:", attemptsError);
    } else {
      for (const row of attempts ?? []) {
        if (row.question_id) skipIds.add(row.question_id as string);
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

export async function getQuestionById(
  questionId: string
): Promise<Question | null> {
  const id = questionId.trim().toLowerCase();
  if (!id) return null;

  const supabase = await createClient();

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

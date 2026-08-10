"use server";

import { createClient } from "@/lib/supabase/server";
import { MATH_DOMAINS, READING_DOMAINS, type SubjectFilter, type TierFilter } from "@/lib/subjects";
import { revalidatePath } from "next/cache";

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
  has_math: boolean | null;
  graph_spec: Record<string, unknown> | null;
};

const QUESTION_SELECT =
  "question_id, domain, skill, tier, stem, choices, correct_answer, rationale, has_math, graph_spec";

/** Normalize choices whether stored as JSON object or a Python-ish string dict. */
function normalizeChoices(raw: unknown): Record<string, string> | null {
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

function normalizeQuestion(row: Record<string, unknown>): Question {
  return {
    ...(row as unknown as Question),
    choices: normalizeChoices(row.choices),
    tier: row.tier == null ? null : Number(row.tier),
  };
}

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

  let query = supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .not("correct_answer", "is", null)
    .not("stem", "is", null);

  // Hard filters first (tier / subject), then skip current + already attempted
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

  // random ordering via a Postgres function exposed as an RPC would be more
  // efficient at scale; for now, pull a small random-ish page and pick one
  const { data, error } = await query.limit(50);

  if (error || !data || data.length === 0) {
    console.error("getRandomQuestion error:", error);
    return null;
  }

  return normalizeQuestion(data[Math.floor(Math.random() * data.length)] as Record<string, unknown>);
}

export async function getQuestionById(questionId: string): Promise<Question | null> {
  const id = questionId.trim().toLowerCase();
  if (!id) return null;

  const supabase = await createClient();

  // Exact match — supports both short hex ids and full UUIDs
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

  // Prefix fallback if the student pasted a partial id
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

export type RecentError = {
  attempt_id: string;
  question_id: string;
  attempted_at: string;
  selected_answer: string | null;
  domain: string | null;
  skill: string | null;
  stem: string;
};

/** Sunday 00:00:00 → Saturday 23:59:59.999 in the runtime local timezone. */
function getThisWeekBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0 Sun … 6 Sat
  start.setDate(start.getDate() - day);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatWeekDay(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type WeeklyAttemptStats = {
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  /** e.g. "Aug 3 – Aug 9" */
  rangeLabel: string;
  weekStartIso: string;
  weekEndIso: string;
};

export async function getWeeklyAttemptStats(): Promise<WeeklyAttemptStats> {
  const { start, end } = getThisWeekBounds();
  const rangeLabel = `${formatWeekDay(start)} – ${formatWeekDay(end)}`;
  const empty: WeeklyAttemptStats = {
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    rangeLabel,
    weekStartIso: start.toISOString(),
    weekEndIso: end.toISOString(),
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return empty;

  const { data, error } = await supabase
    .from("attempts")
    .select("is_correct")
    .eq("user_id", user.id)
    .gte("attempted_at", start.toISOString())
    .lte("attempted_at", end.toISOString());

  if (error) {
    console.error("getWeeklyAttemptStats error:", error);
    return empty;
  }

  const rows = data ?? [];
  const correctCount = rows.filter((r) => r.is_correct === true).length;
  const incorrectCount = rows.filter((r) => r.is_correct === false).length;

  return {
    attemptCount: rows.length,
    correctCount,
    incorrectCount,
    rangeLabel,
    weekStartIso: start.toISOString(),
    weekEndIso: end.toISOString(),
  };
}

export async function getRecentErrors(): Promise<RecentError[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("attempts")
    .select("id, question_id, attempted_at, selected_answer, questions(stem, domain, skill)")
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .order("attempted_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getRecentErrors error:", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const q = row.questions as
      | { stem: string | null; domain: string | null; skill: string | null }
      | { stem: string | null; domain: string | null; skill: string | null }[]
      | null;
    const question = Array.isArray(q) ? q[0] : q;
    if (!question?.stem) return [];
    return [
      {
        attempt_id: row.id as string,
        question_id: row.question_id as string,
        attempted_at: row.attempted_at as string,
        selected_answer: (row.selected_answer as string | null) ?? null,
        domain: question.domain,
        skill: question.skill,
        stem: question.stem,
      },
    ];
  });
}

/** All-time count of incorrect attempts for the signed-in user. */
export async function getMistakeCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_correct", false);

  if (error) {
    console.error("getMistakeCount error:", error);
    return 0;
  }

  return count ?? 0;
}

/** All-time count of attempts (questions answered) for the signed-in user. */
export async function getAttemptCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("getAttemptCount error:", error);
    return 0;
  }

  return count ?? 0;
}

export type TopicProgress = {
  topic: string;
  /** Unique questions the user has attempted in this topic */
  completed: number;
  /** Total questions available in this topic */
  total: number;
  /** Correct attempts ÷ all attempts (0–100) */
  accuracy: number;
};

const ALL_TOPICS = [...MATH_DOMAINS, ...READING_DOMAINS];

export async function getTopicProgress(): Promise<TopicProgress[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const totals = new Map<string, number>();
  for (const topic of ALL_TOPICS) totals.set(topic, 0);

  const { data: questionRows, error: questionError } = await supabase
    .from("questions")
    .select("domain");

  if (questionError) {
    console.error("getTopicProgress questions error:", questionError);
  } else {
    for (const row of questionRows ?? []) {
      const domain = row.domain as string | null;
      if (!domain) continue;
      totals.set(domain, (totals.get(domain) ?? 0) + 1);
    }
  }

  const attempted = new Map<string, Set<string>>();
  const correctCounts = new Map<string, number>();
  const attemptCounts = new Map<string, number>();

  if (user) {
    const { data: attemptRows, error: attemptError } = await supabase
      .from("attempts")
      .select("question_id, is_correct, questions(domain)")
      .eq("user_id", user.id);

    if (attemptError) {
      console.error("getTopicProgress attempts error:", attemptError);
    } else {
      for (const row of attemptRows ?? []) {
        const q = row.questions as
          | { domain: string | null }
          | { domain: string | null }[]
          | null;
        const question = Array.isArray(q) ? q[0] : q;
        const domain = question?.domain;
        if (!domain) continue;

        if (!attempted.has(domain)) attempted.set(domain, new Set());
        attempted.get(domain)!.add(row.question_id as string);

        attemptCounts.set(domain, (attemptCounts.get(domain) ?? 0) + 1);
        if (row.is_correct === true) {
          correctCounts.set(domain, (correctCounts.get(domain) ?? 0) + 1);
        }
      }
    }
  }

  const known = new Set<string>(ALL_TOPICS);
  const extras = [...totals.keys()].filter((t) => !known.has(t));
  const topics = [...ALL_TOPICS, ...extras.sort()];

  return topics.map((topic) => {
    const total = totals.get(topic) ?? 0;
    const completed = attempted.get(topic)?.size ?? 0;
    const attempts = attemptCounts.get(topic) ?? 0;
    const correct = correctCounts.get(topic) ?? 0;
    return {
      topic,
      completed,
      total,
      accuracy: attempts === 0 ? 0 : Math.round((correct / attempts) * 100),
    };
  });
}

export async function submitAttempt(params: {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpentSec: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in");
  }

  const { error } = await supabase.from("attempts").insert({
    user_id: user.id,
    question_id: params.questionId,
    selected_answer: params.selectedAnswer,
    is_correct: params.isCorrect,
    time_spent_sec: params.timeSpentSec,
  });

  if (error) {
    console.error("submitAttempt error:", error);
    throw new Error("Could not save attempt");
  }

  revalidatePath("/question-bank");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recent-errors");
  revalidatePath("/", "layout");
}

export type QuestionReportIssueType =
  | "issue_with_explanation"
  | "wrong_answer_marked_correct"
  | "explanation_incorrect"
  | "formatting_display_issue"
  | "other";

export async function submitQuestionReport(params: {
  questionId: string;
  issueType: QuestionReportIssueType;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to report an issue." };
  }

  const notes = params.notes?.trim() ? params.notes.trim() : null;

  const { error } = await supabase.from("question_reports").insert({
    question_id: params.questionId,
    user_id: user.id,
    issue_type: params.issueType,
    notes,
  });

  if (error) {
    console.error("submitQuestionReport error:", error);
    return {
      ok: false,
      error: error.message || "Could not submit report. Please try again.",
    };
  }

  return { ok: true };
}

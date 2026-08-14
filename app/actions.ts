"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Reassigning PostgrestFilterBuilder with many `.eq`/`.in`/`.not` calls
  // makes TS "type instantiation excessively deep". Keep the builder untyped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
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

export type DashboardStats = {
  goalScore: number | null;
  predictedScore: number | null;
  mathScore: number | null;
  rwScore: number | null;
  totalAttempts: number;
  todayAttempts: number;
  correctAttempts: number;
  /** 0–100; null when there are no attempts */
  accuracyPercent: number | null;
  streak: number;
};

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftLocalDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + deltaDays);
  return toLocalDateKey(dt);
}

function computeStreak(dateKeys: Set<string>): number {
  if (dateKeys.size === 0) return 0;
  const today = toLocalDateKey(new Date());
  const yesterday = shiftLocalDateKey(today, -1);
  let cursor: string;
  if (dateKeys.has(today)) cursor = today;
  else if (dateKeys.has(yesterday)) cursor = yesterday;
  else return 0;

  let streak = 0;
  while (dateKeys.has(cursor)) {
    streak += 1;
    cursor = shiftLocalDateKey(cursor, -1);
  }
  return streak;
}

/** Aggregate attempt + profile stats for the student dashboard cards. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const empty: DashboardStats = {
    goalScore: null,
    predictedScore: null,
    mathScore: null,
    rwScore: null,
    totalAttempts: 0,
    todayAttempts: 0,
    correctAttempts: 0,
    accuracyPercent: null,
    streak: 0,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  // Goal score comes from students.target_score.
  // Prediction / section sub-scores are not implemented yet.
  let goalScore: number | null = null;
  {
    const admin = createAdminClient();
    const { data: student, error: studentError } = await admin
      .from("students")
      .select("target_score")
      .eq("id", user.id)
      .maybeSingle();
    if (
      !studentError &&
      student?.target_score != null &&
      Number.isFinite(Number(student.target_score))
    ) {
      goalScore = Number(student.target_score);
    }
  }

  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("is_correct, attempted_at")
    .eq("user_id", user.id);

  if (error) {
    console.error("getDashboardStats attempts error:", error);
    return { ...empty, goalScore };
  }

  const rows = attempts ?? [];
  const todayKey = toLocalDateKey(new Date());
  let todayAttempts = 0;
  let correctAttempts = 0;
  const dateKeys = new Set<string>();

  for (const row of rows) {
    if (row.is_correct === true) correctAttempts += 1;
    const raw = row.attempted_at as string | null;
    if (!raw) continue;
    const key = toLocalDateKey(new Date(raw));
    dateKeys.add(key);
    if (key === todayKey) todayAttempts += 1;
  }

  const totalAttempts = rows.length;
  return {
    goalScore,
    predictedScore: null,
    mathScore: null,
    rwScore: null,
    totalAttempts,
    todayAttempts,
    correctAttempts,
    accuracyPercent:
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : null,
    streak: computeStreak(dateKeys),
  };
}

export async function getGoalScore(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .select("target_score")
    .eq("id", user.id)
    .maybeSingle();

  if (error || data?.target_score == null) return null;
  const n = Number(data.target_score);
  return Number.isFinite(n) ? n : null;
}

export async function updateGoalScore(
  score: number | null
): Promise<
  { ok: true; goalScore: number | null } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  let goalScore: number | null = null;
  if (score != null && !Number.isNaN(score)) {
    const rounded = Math.round(score);
    if (rounded < 400 || rounded > 1600) {
      return { ok: false, error: "Enter a score between 400 and 1600." };
    }
    goalScore = rounded;
  }

  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("students")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("updateGoalScore lookup error:", lookupError);
    return { ok: false, error: "Could not save goal score. Try again." };
  }

  if (existing) {
    const { error } = await admin
      .from("students")
      .update({ target_score: goalScore })
      .eq("id", user.id);
    if (error) {
      console.error("updateGoalScore update error:", error);
      return { ok: false, error: "Could not save goal score. Try again." };
    }
  } else {
    const { error } = await admin.from("students").insert({
      id: user.id,
      target_score: goalScore,
    });
    if (error) {
      console.error("updateGoalScore insert error:", error);
      return { ok: false, error: "Could not save goal score. Try again." };
    }
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, goalScore };
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

export type SkillProgress = {
  skill: string;
  domain: string | null;
  /** Unique questions the user has attempted in this skill */
  completed: number;
  /** Total questions available in this skill */
  total: number;
};

export type BankOverview = {
  /** Unique questions the user has attempted */
  completed: number;
  /** Total questions in the bank */
  total: number;
  /** Correct attempts ÷ all attempts (0–100) */
  accuracy: number;
};

const ALL_TOPICS = [...MATH_DOMAINS, ...READING_DOMAINS];

export async function getBankOverview(): Promise<BankOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: totalCount, error: totalError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    console.error("getBankOverview total error:", totalError);
  }

  let completed = 0;
  let attempts = 0;
  let correct = 0;

  if (user) {
    const { data: attemptRows, error: attemptError } = await supabase
      .from("attempts")
      .select("question_id, is_correct")
      .eq("user_id", user.id);

    if (attemptError) {
      console.error("getBankOverview attempts error:", attemptError);
    } else {
      const unique = new Set<string>();
      for (const row of attemptRows ?? []) {
        if (row.question_id) unique.add(row.question_id as string);
        attempts += 1;
        if (row.is_correct === true) correct += 1;
      }
      completed = unique.size;
    }
  }

  return {
    completed,
    total: totalCount ?? 0,
    accuracy: attempts === 0 ? 0 : Math.round((correct / attempts) * 100),
  };
}

/** Per-skill completion from questions.skill + user attempts (same attempt tracking as overall stats). */
export async function getSkillProgress(): Promise<SkillProgress[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: questionRows, error: questionError } = await supabase
    .from("questions")
    .select("question_id, skill, domain");

  if (questionError) {
    console.error("getSkillProgress questions error:", questionError);
    return [];
  }

  type Agg = { domain: string | null; total: number; ids: Set<string> };
  const bySkill = new Map<string, Agg>();

  for (const row of questionRows ?? []) {
    const skill = ((row.skill as string | null) ?? "").trim() || "Uncategorized";
    const domain = (row.domain as string | null) ?? null;
    if (!bySkill.has(skill)) {
      bySkill.set(skill, { domain, total: 0, ids: new Set() });
    }
    const agg = bySkill.get(skill)!;
    agg.total += 1;
    if (!agg.domain && domain) agg.domain = domain;
  }

  if (user) {
    const { data: attemptRows, error: attemptError } = await supabase
      .from("attempts")
      .select("question_id, questions(skill)")
      .eq("user_id", user.id);

    if (attemptError) {
      console.error("getSkillProgress attempts error:", attemptError);
    } else {
      for (const row of attemptRows ?? []) {
        const q = row.questions as
          | { skill: string | null }
          | { skill: string | null }[]
          | null;
        const question = Array.isArray(q) ? q[0] : q;
        const skill = (question?.skill ?? "").trim() || "Uncategorized";
        if (!bySkill.has(skill)) continue;
        if (row.question_id) {
          bySkill.get(skill)!.ids.add(row.question_id as string);
        }
      }
    }
  }

  const domainOrder = new Map(ALL_TOPICS.map((d, i) => [d, i]));

  return [...bySkill.entries()]
    .map(([skill, agg]) => ({
      skill,
      domain: agg.domain,
      completed: agg.ids.size,
      total: agg.total,
    }))
    .sort((a, b) => {
      const da = a.domain ? (domainOrder.get(a.domain as (typeof ALL_TOPICS)[number]) ?? 99) : 99;
      const db = b.domain ? (domainOrder.get(b.domain as (typeof ALL_TOPICS)[number]) ?? 99) : 99;
      if (da !== db) return da - db;
      return a.skill.localeCompare(b.skill);
    });
}

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
  /** When set, marks this attempt as belonging to a bootcamp assignment. */
  assignmentId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in");
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    question_id: params.questionId,
    selected_answer: params.selectedAnswer,
    is_correct: params.isCorrect,
    time_spent_sec: params.timeSpentSec,
  };
  if (params.assignmentId) {
    payload.assignment_id = params.assignmentId;
  }

  // Assignment-linked rows use the service role so RLS on assignment_id
  // cannot block progress saves for bootcamp students.
  const writer = params.assignmentId ? createAdminClient() : supabase;
  const { error } = await writer.from("attempts").insert(payload);

  if (error) {
    console.error("submitAttempt error:", error);
    throw new Error("Could not save attempt");
  }

  revalidatePath("/question-bank");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recent-errors");
  revalidatePath("/", "layout");
  if (params.assignmentId) {
    revalidatePath("/assignments");
    revalidatePath(`/assignments/${params.assignmentId}`);
  }
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

  const { error } = await supabase.from("feedback").insert({
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

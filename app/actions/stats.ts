import { revalidatePath } from "next/cache";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthedUser } from "@/app/actions/bootcamp/auth";
import { computeAttemptXp, formatLeaderboardName } from "@/lib/xp";

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

  const { supabase, user } = await getAuthedUser();

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
  const { supabase, user } = await getAuthedUser();

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
  const { supabase, user } = await getAuthedUser();

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
  const { supabase, user } = await getAuthedUser();

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

/**
 * Live XP total for a student — recomputed from attempts ⨝ questions.
 * `studentId` defaults to the signed-in user (attempts.user_id = students.id).
 */
export async function getStudentXp(studentId?: string): Promise<number> {
  const { supabase, user } = await getAuthedUser();

  const id = studentId ?? user?.id;
  if (!id) return 0;

  const client = user && id === user.id ? supabase : createAdminClient();

  const { data: attempts, error } = await client
    .from("attempts")
    .select("is_correct, question_id")
    .eq("user_id", id);

  if (error) {
    console.error("getStudentXp error:", error);
    return 0;
  }

  if (!attempts?.length) return 0;

  const questionIds = [
    ...new Set(
      attempts
        .map((a) => a.question_id as string | null)
        .filter((qid): qid is string => Boolean(qid))
    ),
  ];

  const tierByQuestion = new Map<string, number | null>();
  if (questionIds.length > 0) {
    const { data: questions, error: qError } = await client
      .from("questions")
      .select("question_id, tier")
      .in("question_id", questionIds);

    if (qError) {
      console.error("getStudentXp questions error:", qError);
    } else {
      for (const q of questions ?? []) {
        tierByQuestion.set(
          q.question_id as string,
          q.tier == null ? null : Number(q.tier)
        );
      }
    }
  }

  let total = 0;
  for (const row of attempts) {
    const qid = row.question_id as string | null;
    total += computeAttemptXp(
      row.is_correct as boolean | null,
      qid ? tierByQuestion.get(qid) ?? null : null
    );
  }

  return total;
}

export type LeaderboardEntry = {
  student_id: string;
  display_name: string;
  xp: number;
  rank: number;
};

/** All students ranked by live XP (descending). Never stored — always recomputed. */
export async function getXpLeaderboard(): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient();

  const { data: attempts, error } = await admin
    .from("attempts")
    .select("user_id, is_correct, question_id");

  if (error) {
    console.error("getXpLeaderboard attempts error:", error);
    return [];
  }

  if (!attempts?.length) return [];

  const questionIds = [
    ...new Set(
      attempts
        .map((a) => a.question_id as string | null)
        .filter((qid): qid is string => Boolean(qid))
    ),
  ];

  const tierByQuestion = new Map<string, number | null>();
  if (questionIds.length > 0) {
    const { data: questions, error: qError } = await admin
      .from("questions")
      .select("question_id, tier")
      .in("question_id", questionIds);

    if (qError) {
      console.error("getXpLeaderboard questions error:", qError);
    } else {
      for (const q of questions ?? []) {
        tierByQuestion.set(
          q.question_id as string,
          q.tier == null ? null : Number(q.tier)
        );
      }
    }
  }

  const xpByStudent = new Map<string, number>();
  for (const row of attempts) {
    const studentId = row.user_id as string | null;
    if (!studentId) continue;

    const qid = row.question_id as string | null;
    const xp = computeAttemptXp(
      row.is_correct as boolean | null,
      qid ? tierByQuestion.get(qid) ?? null : null
    );
    xpByStudent.set(studentId, (xpByStudent.get(studentId) ?? 0) + xp);
  }

  if (xpByStudent.size === 0) return [];

  const ids = [...xpByStudent.keys()];
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);

  if (profileError) {
    console.error("getXpLeaderboard profiles error:", profileError);
  }

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        full_name: (p.full_name as string | null) ?? null,
        email: (p.email as string | null) ?? null,
      },
    ])
  );

  const ranked = [...xpByStudent.entries()]
    .map(([student_id, xp]) => {
      const profile = profileById.get(student_id);
      return {
        student_id,
        display_name: formatLeaderboardName(profile?.full_name, profile?.email),
        xp,
      };
    })
    .sort((a, b) => b.xp - a.xp || a.display_name.localeCompare(b.display_name));

  return ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
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

export type DashboardShellStats = {
  xpTotal: number;
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

/** The only live attempt data needed by the persistent dashboard shell. */
export const getDashboardShellStats = cache(async (): Promise<DashboardShellStats> => {
  const { supabase, user } = await getAuthedUser();
  if (!user) return { xpTotal: 0, streak: 0 };

  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("is_correct, question_id, attempted_at")
    .eq("user_id", user.id);

  if (error) {
    console.error("getDashboardShellStats attempts error:", error);
    return { xpTotal: 0, streak: 0 };
  }

  const rows = attempts ?? [];
  const questionIds = [
    ...new Set(
      rows
        .map((row) => row.question_id as string | null)
        .filter((questionId): questionId is string => Boolean(questionId))
    ),
  ];
  const tierByQuestion = new Map<string, number | null>();

  if (questionIds.length > 0) {
    const { data: questions, error: questionError } = await supabase
      .from("questions")
      .select("question_id, tier")
      .in("question_id", questionIds);

    if (questionError) {
      console.error("getDashboardShellStats questions error:", questionError);
    } else {
      for (const question of questions ?? []) {
        tierByQuestion.set(
          question.question_id as string,
          question.tier == null ? null : Number(question.tier)
        );
      }
    }
  }

  const dateKeys = new Set<string>();
  let xpTotal = 0;
  for (const row of rows) {
    const questionId = row.question_id as string | null;
    xpTotal += computeAttemptXp(
      row.is_correct as boolean | null,
      questionId ? tierByQuestion.get(questionId) ?? null : null
    );

    const attemptedAt = row.attempted_at as string | null;
    if (attemptedAt) dateKeys.add(toLocalDateKey(new Date(attemptedAt)));
  }

  return { xpTotal, streak: computeStreak(dateKeys) };
});

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

  const { supabase, user } = await getAuthedUser();
  if (!user) return empty;

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
  const { user } = await getAuthedUser();
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
  const { user } = await getAuthedUser();
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

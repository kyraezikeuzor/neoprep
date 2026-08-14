"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MATH_DOMAINS,
  READING_DOMAINS,
  type SubjectFilter,
  type TierFilter,
} from "@/lib/subjects";
import { revalidatePath } from "next/cache";
import type { Question } from "@/app/actions";

const QUESTION_SELECT =
  "question_id, domain, skill, tier, stem, choices, correct_answer, rationale, has_math, graph_spec";

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
    // fall through
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

export type ProfileRole = "student" | "parent" | "admin";

export type BootcampSummary = {
  id: number;
  name: string;
  join_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
};

export type AssignmentListItem = {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string | null;
  start_date: string | null;
  question_count: number;
  completed_count: number;
};

export type AssignmentDetail = {
  id: string;
  title: string;
  due_date: string | null;
  bootcamp_id: number;
  questions: Question[];
  /** Existing progress for the current student (empty if none). */
  progress: AssignmentProgressEntry[];
};

export type AssignmentProgressEntry = {
  question_id: string;
  is_correct: boolean;
  selected_answer: string | null;
};

export type AdminRosterRow = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  progress: { assignment_id: string; title: string; completed: number; total: number }[];
};

export type AdminStudentIncorrectQuestion = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  stem: string;
  choices: Record<string, string> | null;
  correct_answer: string;
  selected_answer: string | null;
};

export type AdminStudentAssignmentDetail = {
  assignment_id: string;
  title: string;
  due_date: string | null;
  total: number;
  completed: number;
  correct: number;
  attempted: number;
  /** correct / attempted; null when nothing attempted */
  accuracy: number | null;
  incorrect: AdminStudentIncorrectQuestion[];
};

export type AdminStudentBootcampDetail = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  bootcamp_id: number;
  bootcamp_name: string;
  assignments: AdminStudentAssignmentDetail[];
};

function generateJoinCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getProfileRole(): Promise<ProfileRole | null> {
  const { user } = await getAuthedUser();
  if (!user) return null;
  // Use service role: profiles RLS can call is_admin(), which authenticated
  // users often cannot EXECUTE — blocking even "read own role".
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("getProfileRole error:", error);
    return null;
  }
  const role = data?.role;
  if (role === "student" || role === "parent" || role === "admin") return role;
  return "student";
}

export async function requireAdmin(): Promise<{ userId: string }> {
  const { user } = await getAuthedUser();
  if (!user) throw new Error("Not signed in");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error || data?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return { userId: user.id };
}

export async function getStudentBootcamp(): Promise<{
  bootcampId: number;
  name: string;
} | null> {
  const { user } = await getAuthedUser();
  if (!user) return null;

  // Service role: students/bootcamps RLS often blocks the user client from
  // reading their own membership (or joining bootcamps for the name).
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .select("bootcamp_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getStudentBootcamp error:", error);
    return null;
  }
  if (!data?.bootcamp_id) return null;

  const bootcampId = Number(data.bootcamp_id);
  if (!Number.isFinite(bootcampId)) return null;

  const { data: bootcamp, error: bootcampError } = await admin
    .from("bootcamps")
    .select("id, name")
    .eq("id", bootcampId)
    .maybeSingle();

  if (bootcampError || !bootcamp?.name) {
    console.error("getStudentBootcamp bootcamp error:", bootcampError);
    return null;
  }

  return { bootcampId, name: bootcamp.name as string };
}

export async function getBootcampByJoinCode(code: string): Promise<{
  id: number;
  name: string;
  join_code: string;
} | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  // Public invite lookup — use service role so guests can see the bootcamp name.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bootcamps")
    .select("id, name, join_code")
    .ilike("join_code", normalized)
    .maybeSingle();

  if (error) {
    console.error("getBootcampByJoinCode error:", error);
    return null;
  }
  if (!data) return null;
  return {
    id: Number(data.id),
    name: data.name as string,
    join_code: data.join_code as string,
  };
}

export async function joinBootcamp(
  bootcampId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await getAuthedUser();
  if (!user) return { ok: false, error: "You must sign in first." };

  // Service role: bootcamps/students RLS can block the user client.
  const admin = createAdminClient();
  const { data: bootcamp, error: bootcampError } = await admin
    .from("bootcamps")
    .select("id")
    .eq("id", bootcampId)
    .maybeSingle();

  if (bootcampError || !bootcamp) {
    return { ok: false, error: "Invalid or expired invite link." };
  }

  const { data: existing, error: existingError } = await admin
    .from("students")
    .select("id, bootcamp_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("joinBootcamp lookup error:", existingError);
    return { ok: false, error: "Could not join bootcamp. Try again." };
  }

  if (existing) {
    if (Number(existing.bootcamp_id) === bootcampId) {
      revalidatePath("/", "layout");
      revalidatePath("/dashboard");
      revalidatePath("/assignments");
      return { ok: true };
    }
    const { error: updateError } = await admin
      .from("students")
      .update({ bootcamp_id: bootcampId })
      .eq("id", user.id);
    if (updateError) {
      console.error("joinBootcamp update error:", updateError);
      return { ok: false, error: "Could not join bootcamp. Try again." };
    }
  } else {
    const { error: insertError } = await admin.from("students").insert({
      id: user.id,
      bootcamp_id: bootcampId,
    });
    if (insertError) {
      console.error("joinBootcamp insert error:", insertError);
      return { ok: false, error: "Could not join bootcamp. Try again." };
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/assignments");
  return { ok: true };
}

export async function listStudentAssignments(): Promise<AssignmentListItem[]> {
  const membership = await getStudentBootcamp();
  if (!membership) return [];

  const { user } = await getAuthedUser();
  if (!user) return [];

  const admin = createAdminClient();
  // Prefer start_date when present; fall back without it if the column is missing.
  let rows: {
    id: string;
    title: string;
    due_date: string | null;
    created_at: string | null;
    start_date?: string | null;
  }[] = [];

  const withStart = await admin
    .from("assignments")
    .select("id, title, due_date, created_at, start_date")
    .eq("bootcamp_id", membership.bootcampId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (withStart.error) {
    const withoutStart = await admin
      .from("assignments")
      .select("id, title, due_date, created_at")
      .eq("bootcamp_id", membership.bootcampId)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (withoutStart.error) {
      console.error("listStudentAssignments error:", withoutStart.error);
      return [];
    }
    rows = (withoutStart.data ?? []) as typeof rows;
  } else {
    rows = (withStart.data ?? []) as typeof rows;
  }

  if (rows.length === 0) return [];

  // assignments.id is uuid — do not coerce with Number() (that becomes NaN)
  const ids = rows.map((a) => String(a.id));

  const { data: aq, error: aqError } = await admin
    .from("assignment_questions")
    .select("assignment_id, question_id")
    .in("assignment_id", ids);

  if (aqError) {
    console.error("listStudentAssignments questions error:", aqError);
  }

  const { data: progress } = await admin
    .from("assignment_progress")
    .select("assignment_id, question_id")
    .eq("student_id", user.id)
    .in("assignment_id", ids);

  const countByAssignment = new Map<string, Set<string>>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    if (!countByAssignment.has(aid)) countByAssignment.set(aid, new Set());
    countByAssignment.get(aid)!.add(String(row.question_id));
  }

  const completedByAssignment = new Map<string, Set<string>>();
  for (const row of progress ?? []) {
    const aid = String(row.assignment_id);
    if (!completedByAssignment.has(aid)) completedByAssignment.set(aid, new Set());
    completedByAssignment.get(aid)!.add(String(row.question_id));
  }

  return rows.map((a) => {
    const id = String(a.id);
    const questionIds = countByAssignment.get(id) ?? new Set();
    const completedIds = completedByAssignment.get(id) ?? new Set();
    let completed = 0;
    for (const qid of completedIds) {
      if (questionIds.has(qid)) completed += 1;
    }
    const startDate =
      (a.start_date as string | null | undefined) ??
      (a.created_at as string | null) ??
      null;
    return {
      id,
      title: a.title as string,
      due_date: (a.due_date as string | null) ?? null,
      created_at: (a.created_at as string | null) ?? null,
      start_date: startDate,
      question_count: questionIds.size,
      completed_count: completed,
    };
  });
}

export async function getAssignmentForPractice(
  assignmentId: string
): Promise<AssignmentDetail | null> {
  const membership = await getStudentBootcamp();
  if (!membership) return null;

  const { user } = await getAuthedUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: assignment, error } = await admin
    .from("assignments")
    .select("id, title, due_date, bootcamp_id")
    .eq("id", assignmentId)
    .eq("bootcamp_id", membership.bootcampId)
    .maybeSingle();

  if (error || !assignment) {
    console.error("getAssignmentForPractice error:", error);
    return null;
  }

  const { data: links, error: linkError } = await admin
    .from("assignment_questions")
    .select("question_id")
    .eq("assignment_id", assignmentId);

  if (linkError) {
    console.error("getAssignmentForPractice links error:", linkError);
    return null;
  }

  const questionIds = (links ?? [])
    .map((r) => r.question_id as string)
    .filter(Boolean);
  if (questionIds.length === 0) {
    return {
      id: String(assignment.id),
      title: assignment.title as string,
      due_date: (assignment.due_date as string | null) ?? null,
      bootcamp_id: Number(assignment.bootcamp_id),
      questions: [],
      progress: [],
    };
  }

  const { data: questions, error: qError } = await admin
    .from("questions")
    .select(QUESTION_SELECT)
    .in("question_id", questionIds);

  if (qError) {
    console.error("getAssignmentForPractice questions error:", qError);
    return null;
  }

  const byId = new Map(
    (questions ?? []).map((q) => [
      q.question_id as string,
      normalizeQuestion(q as Record<string, unknown>),
    ])
  );
  const ordered = questionIds
    .map((id) => byId.get(id))
    .filter((q): q is Question => Boolean(q));

  // Restore prior progress for this student on this assignment
  type ProgressRow = {
    question_id: string;
    is_correct: boolean | null;
    selected_answer?: string | null;
  };
  let progressRows: ProgressRow[] = [];
  const withSelected = await admin
    .from("assignment_progress")
    .select("question_id, is_correct, selected_answer")
    .eq("assignment_id", assignmentId)
    .eq("student_id", user.id);

  if (withSelected.error) {
    const withoutSelected = await admin
      .from("assignment_progress")
      .select("question_id, is_correct")
      .eq("assignment_id", assignmentId)
      .eq("student_id", user.id);
    if (withoutSelected.error) {
      console.error(
        "getAssignmentForPractice progress error:",
        withoutSelected.error
      );
    } else {
      progressRows = (withoutSelected.data ?? []) as ProgressRow[];
    }
  } else {
    progressRows = (withSelected.data ?? []) as ProgressRow[];
  }

  const selectedByQuestion = new Map<string, string | null>();
  for (const row of progressRows) {
    if (row.selected_answer != null && row.selected_answer !== "") {
      selectedByQuestion.set(row.question_id, row.selected_answer);
    }
  }

  const missingSelected = progressRows
    .map((r) => r.question_id)
    .filter((id) => !selectedByQuestion.has(id));

  if (missingSelected.length) {
    const { data: attempts } = await admin
      .from("attempts")
      .select("question_id, selected_answer, attempted_at")
      .eq("user_id", user.id)
      .in("question_id", missingSelected)
      .order("attempted_at", { ascending: false });

    for (const attempt of attempts ?? []) {
      const qid = attempt.question_id as string;
      if (selectedByQuestion.has(qid)) continue;
      selectedByQuestion.set(
        qid,
        (attempt.selected_answer as string | null) ?? null
      );
    }
  }

  const progress: AssignmentProgressEntry[] = progressRows
    .filter((row) => row.is_correct === true || row.is_correct === false)
    .map((row) => ({
      question_id: row.question_id,
      is_correct: Boolean(row.is_correct),
      selected_answer: selectedByQuestion.get(row.question_id) ?? null,
    }));

  return {
    id: String(assignment.id),
    title: assignment.title as string,
    due_date: (assignment.due_date as string | null) ?? null,
    bootcamp_id: Number(assignment.bootcamp_id),
    questions: ordered,
    progress,
  };
}

export async function submitAssignmentProgress(params: {
  assignmentId: string;
  questionId: string;
  isCorrect: boolean;
  selectedAnswer?: string;
}): Promise<void> {
  const { supabase, user } = await getAuthedUser();
  if (!user) throw new Error("Not signed in");

  const membership = await getStudentBootcamp();
  if (!membership) throw new Error("Not in a bootcamp");

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", params.assignmentId)
    .eq("bootcamp_id", membership.bootcampId)
    .maybeSingle();

  if (!assignment) throw new Error("Assignment not found");

  const { data: existing } = await supabase
    .from("assignment_progress")
    .select("id")
    .eq("assignment_id", params.assignmentId)
    .eq("student_id", user.id)
    .eq("question_id", params.questionId)
    .maybeSingle();

  const answeredAt = new Date().toISOString();
  const basePayload: Record<string, unknown> = {
    is_correct: params.isCorrect,
    answered_at: answeredAt,
  };
  if (params.selectedAnswer != null) {
    basePayload.selected_answer = params.selectedAnswer;
  }

  if (existing?.id) {
    let { error } = await supabase
      .from("assignment_progress")
      .update(basePayload)
      .eq("id", existing.id);
    // selected_answer column may not exist yet — retry without it
    if (error && params.selectedAnswer != null) {
      const { error: retryError } = await supabase
        .from("assignment_progress")
        .update({
          is_correct: params.isCorrect,
          answered_at: answeredAt,
        })
        .eq("id", existing.id);
      error = retryError;
    }
    if (error) {
      console.error("submitAssignmentProgress update error:", error);
      throw new Error("Could not save assignment progress");
    }
  } else {
    const insertPayload: Record<string, unknown> = {
      assignment_id: params.assignmentId,
      student_id: user.id,
      question_id: params.questionId,
      is_correct: params.isCorrect,
      answered_at: answeredAt,
    };
    if (params.selectedAnswer != null) {
      insertPayload.selected_answer = params.selectedAnswer;
    }
    let { error } = await supabase.from("assignment_progress").insert(insertPayload);
    if (error && params.selectedAnswer != null) {
      const { error: retryError } = await supabase.from("assignment_progress").insert({
        assignment_id: params.assignmentId,
        student_id: user.id,
        question_id: params.questionId,
        is_correct: params.isCorrect,
        answered_at: answeredAt,
      });
      error = retryError;
    }
    if (error) {
      console.error("submitAssignmentProgress insert error:", error);
      throw new Error("Could not save assignment progress");
    }
  }

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${params.assignmentId}`);
}

async function ensureTutorForAdmin(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("tutors")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { error } = await admin.from("tutors").insert({ id: userId });
  if (error) {
    console.error("ensureTutorForAdmin error:", error);
    throw new Error("Could not create tutor profile");
  }
  return userId;
}

export async function listAdminBootcamps(): Promise<BootcampSummary[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bootcamps")
    .select("id, name, join_code, start_date, end_date, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAdminBootcamps error:", error);
    return [];
  }

  return (data ?? []).map((b) => ({
    id: Number(b.id),
    name: b.name as string,
    join_code: b.join_code as string,
    start_date: (b.start_date as string | null) ?? null,
    end_date: (b.end_date as string | null) ?? null,
    created_at: (b.created_at as string | null) ?? null,
  }));
}

export async function createBootcamp(params: {
  name: string;
  startDate: string;
  endDate: string;
}): Promise<{ ok: true; bootcamp: BootcampSummary } | { ok: false; error: string }> {
  try {
    const { userId } = await requireAdmin();
    const name = params.name.trim();
    if (!name) return { ok: false, error: "Name is required." };
    if (!params.startDate || !params.endDate) {
      return { ok: false, error: "Start and end dates are required." };
    }

    const tutorId = await ensureTutorForAdmin(userId);
    const joinCode = generateJoinCode();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("bootcamps")
      .insert({
        name,
        tutor_id: tutorId,
        start_date: params.startDate,
        end_date: params.endDate,
        join_code: joinCode,
      })
      .select("id, name, join_code, start_date, end_date, created_at")
      .single();

    if (error || !data) {
      console.error("createBootcamp error:", error);
      return { ok: false, error: error?.message || "Could not create bootcamp." };
    }

    revalidatePath("/admin");
    return {
      ok: true,
      bootcamp: {
        id: Number(data.id),
        name: data.name as string,
        join_code: data.join_code as string,
        start_date: (data.start_date as string | null) ?? null,
        end_date: (data.end_date as string | null) ?? null,
        created_at: (data.created_at as string | null) ?? null,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Forbidden" };
  }
}

export async function getAdminBootcamp(bootcampId: number): Promise<BootcampSummary | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bootcamps")
    .select("id, name, join_code, start_date, end_date, created_at")
    .eq("id", bootcampId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: Number(data.id),
    name: data.name as string,
    join_code: data.join_code as string,
    start_date: (data.start_date as string | null) ?? null,
    end_date: (data.end_date as string | null) ?? null,
    created_at: (data.created_at as string | null) ?? null,
  };
}

export async function listAdminAssignments(
  bootcampId: number
): Promise<AssignmentListItem[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: assignments, error } = await admin
    .from("assignments")
    .select("id, title, due_date, created_at")
    .eq("bootcamp_id", bootcampId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAdminAssignments error:", error);
    return [];
  }

  const rows = assignments ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map((a) => String(a.id));

  const { data: aq } = await admin
    .from("assignment_questions")
    .select("assignment_id, question_id")
    .in("assignment_id", ids);

  const countByAssignment = new Map<string, number>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    countByAssignment.set(aid, (countByAssignment.get(aid) ?? 0) + 1);
  }

  return rows.map((a) => {
    const id = String(a.id);
    return {
      id,
      title: a.title as string,
      due_date: (a.due_date as string | null) ?? null,
      created_at: (a.created_at as string | null) ?? null,
      start_date: (a.created_at as string | null) ?? null,
      question_count: countByAssignment.get(id) ?? 0,
      completed_count: 0,
    };
  });
}

export async function createAssignment(params: {
  bootcampId: number;
  title: string;
  dueDate: string;
  questionIds: string[];
}): Promise<{ ok: true; assignmentId: string } | { ok: false; error: string }> {
  try {
    const { userId } = await requireAdmin();
    const title = params.title.trim();
    if (!title) return { ok: false, error: "Title is required." };
    if (!params.dueDate) return { ok: false, error: "Due date is required." };
    if (!params.questionIds.length) {
      return { ok: false, error: "Select at least one question." };
    }

    const admin = createAdminClient();
    const { data: bootcamp } = await admin
      .from("bootcamps")
      .select("id")
      .eq("id", params.bootcampId)
      .maybeSingle();
    if (!bootcamp) return { ok: false, error: "Bootcamp not found." };

    const { data: assignment, error } = await admin
      .from("assignments")
      .insert({
        title,
        bootcamp_id: params.bootcampId,
        created_by: userId,
        due_date: params.dueDate,
      })
      .select("id")
      .single();

    if (error || !assignment) {
      console.error("createAssignment error:", error);
      return { ok: false, error: error?.message || "Could not create assignment." };
    }

    const assignmentId = String(assignment.id);
    const uniqueIds = [...new Set(params.questionIds.map((id) => id.trim()).filter(Boolean))];
    const { error: linkError } = await admin.from("assignment_questions").insert(
      uniqueIds.map((question_id) => ({
        assignment_id: assignmentId,
        question_id,
      }))
    );

    if (linkError) {
      console.error("createAssignment questions error:", linkError);
      return { ok: false, error: "Assignment created but questions failed to save." };
    }

    revalidatePath(`/admin/bootcamps/${params.bootcampId}`);
    revalidatePath("/assignments");
    return { ok: true, assignmentId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Forbidden" };
  }
}

export type BankQuestionOption = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
  stem: string;
};

export async function listQuestionsForPicker(params: {
  subject?: SubjectFilter;
  tier?: TierFilter;
  limit?: number;
}): Promise<BankQuestionOption[]> {
  await requireAdmin();
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("questions")
    .select("question_id, domain, skill, tier, stem")
    .not("correct_answer", "is", null)
    .not("stem", "is", null);

  if (params.tier && params.tier !== "all") {
    query = query.eq("tier", params.tier);
  }
  if (params.subject === "math") {
    query = query.in("domain", [...MATH_DOMAINS]);
  } else if (params.subject === "reading_writing") {
    query = query.in("domain", [...READING_DOMAINS]);
  }

  const { data, error } = await query.limit(params.limit ?? 80);
  if (error) {
    console.error("listQuestionsForPicker error:", error);
    return [];
  }

  return (data ?? []).map((q: Record<string, unknown>) => ({
    question_id: q.question_id as string,
    domain: (q.domain as string | null) ?? null,
    skill: (q.skill as string | null) ?? null,
    tier: q.tier == null ? null : Number(q.tier),
    stem: (q.stem as string) ?? "",
  }));
}

export async function getBootcampRoster(
  bootcampId: number
): Promise<AdminRosterRow[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: students, error } = await admin
    .from("students")
    .select("id, profiles(full_name, email)")
    .eq("bootcamp_id", bootcampId);

  if (error) {
    console.error("getBootcampRoster students error:", error);
    return [];
  }

  const { data: assignments } = await admin
    .from("assignments")
    .select("id, title")
    .eq("bootcamp_id", bootcampId)
    .order("created_at", { ascending: true });

  const assignmentRows = assignments ?? [];
  const assignmentIds = assignmentRows.map((a) => String(a.id));

  const { data: aq } = assignmentIds.length
    ? await admin
        .from("assignment_questions")
        .select("assignment_id, question_id")
        .in("assignment_id", assignmentIds)
    : { data: [] as { assignment_id: string; question_id: string }[] };

  const totals = new Map<string, Set<string>>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    if (!totals.has(aid)) totals.set(aid, new Set());
    totals.get(aid)!.add(row.question_id as string);
  }

  const studentIds = (students ?? []).map((s) => s.id as string);
  const { data: progress } =
    studentIds.length && assignmentIds.length
      ? await admin
          .from("assignment_progress")
          .select("assignment_id, student_id, question_id")
          .in("assignment_id", assignmentIds)
          .in("student_id", studentIds)
      : { data: [] as { assignment_id: string; student_id: string; question_id: string }[] };

  const completed = new Map<string, Set<string>>();
  for (const row of progress ?? []) {
    const key = `${row.student_id}:${row.assignment_id}`;
    if (!completed.has(key)) completed.set(key, new Set());
    completed.get(key)!.add(row.question_id as string);
  }

  return (students ?? []).map((s) => {
    const profile = s.profiles as
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
    const p = Array.isArray(profile) ? profile[0] : profile;
    const studentId = s.id as string;

    return {
      student_id: studentId,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
      progress: assignmentRows.map((a) => {
        const aid = String(a.id);
        const totalSet = totals.get(aid) ?? new Set();
        const doneSet = completed.get(`${studentId}:${aid}`) ?? new Set();
        let done = 0;
        for (const qid of doneSet) {
          if (totalSet.has(qid)) done += 1;
        }
        return {
          assignment_id: aid,
          title: a.title as string,
          completed: done,
          total: totalSet.size,
        };
      }),
    };
  });
}

export async function getAdminStudentBootcampDetail(
  bootcampId: number,
  studentId: string
): Promise<AdminStudentBootcampDetail | null> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: bootcamp, error: bootcampError } = await admin
    .from("bootcamps")
    .select("id, name")
    .eq("id", bootcampId)
    .maybeSingle();

  if (bootcampError || !bootcamp) {
    console.error("getAdminStudentBootcampDetail bootcamp error:", bootcampError);
    return null;
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, profiles(full_name, email)")
    .eq("id", studentId)
    .eq("bootcamp_id", bootcampId)
    .maybeSingle();

  if (studentError || !student) {
    console.error("getAdminStudentBootcampDetail student error:", studentError);
    return null;
  }

  const profile = student.profiles as
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[]
    | null;
  const p = Array.isArray(profile) ? profile[0] : profile;

  const { data: assignments } = await admin
    .from("assignments")
    .select("id, title, due_date")
    .eq("bootcamp_id", bootcampId)
    .order("created_at", { ascending: true });

  const assignmentRows = assignments ?? [];
  const assignmentIds = assignmentRows.map((a) => String(a.id));

  const { data: aq } = assignmentIds.length
    ? await admin
        .from("assignment_questions")
        .select("assignment_id, question_id")
        .in("assignment_id", assignmentIds)
    : { data: [] as { assignment_id: string; question_id: string }[] };

  const questionsByAssignment = new Map<string, Set<string>>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    const qid = row.question_id as string;
    if (!questionsByAssignment.has(aid)) questionsByAssignment.set(aid, new Set());
    questionsByAssignment.get(aid)!.add(qid);
  }

  type ProgressRow = {
    assignment_id: string;
    question_id: string;
    is_correct: boolean | null;
    selected_answer?: string | null;
  };

  let progress: ProgressRow[] = [];
  if (assignmentIds.length) {
    const withSelected = await admin
      .from("assignment_progress")
      .select("assignment_id, question_id, is_correct, selected_answer")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds);

    if (withSelected.error) {
      const withoutSelected = await admin
        .from("assignment_progress")
        .select("assignment_id, question_id, is_correct")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds);
      if (withoutSelected.error) {
        console.error(
          "getAdminStudentBootcampDetail progress error:",
          withoutSelected.error
        );
      } else {
        progress = (withoutSelected.data ?? []).map((row) => ({
          assignment_id: String(row.assignment_id),
          question_id: row.question_id as string,
          is_correct: row.is_correct as boolean | null,
        }));
      }
    } else {
      progress = (withSelected.data ?? []).map((row) => ({
        assignment_id: String(row.assignment_id),
        question_id: row.question_id as string,
        is_correct: row.is_correct as boolean | null,
        selected_answer: (row.selected_answer as string | null) ?? null,
      }));
    }
  }

  const incorrectIds = [
    ...new Set(
      progress
        .filter((row) => row.is_correct === false)
        .map((row) => row.question_id as string)
    ),
  ];

  const questionMap = new Map<
    string,
    {
      question_id: string;
      domain: string | null;
      skill: string | null;
      stem: string;
      choices: Record<string, string> | null;
      correct_answer: string;
    }
  >();

  if (incorrectIds.length) {
    const { data: qRows, error: qError } = await admin
      .from("questions")
      .select("question_id, domain, skill, stem, choices, correct_answer")
      .in("question_id", incorrectIds);
    if (qError) {
      console.error("getAdminStudentBootcampDetail questions error:", qError);
    } else {
      for (const q of qRows ?? []) {
        const row = q as Record<string, unknown>;
        questionMap.set(row.question_id as string, {
          question_id: row.question_id as string,
          domain: (row.domain as string | null) ?? null,
          skill: (row.skill as string | null) ?? null,
          stem: (row.stem as string) ?? "",
          choices: normalizeChoices(row.choices),
          correct_answer: (row.correct_answer as string) ?? "",
        });
      }
    }
  }

  // Prefer assignment_progress.selected_answer; fall back to latest attempt
  const selectedByQuestion = new Map<string, string | null>();
  for (const row of progress) {
    if (row.selected_answer != null && row.selected_answer !== "") {
      selectedByQuestion.set(row.question_id, row.selected_answer);
    }
  }

  const missingSelected = incorrectIds.filter((id) => !selectedByQuestion.has(id));
  if (missingSelected.length) {
    const { data: attempts } = await admin
      .from("attempts")
      .select("question_id, selected_answer, attempted_at")
      .eq("user_id", studentId)
      .in("question_id", missingSelected)
      .order("attempted_at", { ascending: false });

    for (const attempt of attempts ?? []) {
      const qid = attempt.question_id as string;
      if (selectedByQuestion.has(qid)) continue;
      selectedByQuestion.set(
        qid,
        (attempt.selected_answer as string | null) ?? null
      );
    }
  }

  const progressByAssignment = new Map<
    string,
    Map<string, { is_correct: boolean | null; selected_answer: string | null }>
  >();
  for (const row of progress) {
    const aid = String(row.assignment_id);
    if (!progressByAssignment.has(aid)) progressByAssignment.set(aid, new Map());
    progressByAssignment.get(aid)!.set(row.question_id as string, {
      is_correct: row.is_correct,
      selected_answer:
        (row.selected_answer as string | null) ??
        selectedByQuestion.get(row.question_id as string) ??
        null,
    });
  }

  const assignmentDetails: AdminStudentAssignmentDetail[] = assignmentRows.map(
    (a) => {
      const aid = String(a.id);
      const qids = questionsByAssignment.get(aid) ?? new Set<string>();
      const prog = progressByAssignment.get(aid) ?? new Map();

      let completed = 0;
      let correct = 0;
      const incorrect: AdminStudentIncorrectQuestion[] = [];

      for (const qid of qids) {
        const entry = prog.get(qid);
        if (!entry) continue;
        completed += 1;
        if (entry.is_correct === true) {
          correct += 1;
        } else if (entry.is_correct === false) {
          const q = questionMap.get(qid);
          incorrect.push({
            question_id: qid,
            domain: q?.domain ?? null,
            skill: q?.skill ?? null,
            stem: q?.stem ?? "",
            choices: q?.choices ?? null,
            correct_answer: q?.correct_answer ?? "",
            selected_answer:
              entry.selected_answer ?? selectedByQuestion.get(qid) ?? null,
          });
        }
      }

      return {
        assignment_id: aid,
        title: a.title as string,
        due_date: (a.due_date as string | null) ?? null,
        total: qids.size,
        completed,
        correct,
        attempted: completed,
        accuracy: completed > 0 ? correct / completed : null,
        incorrect,
      };
    }
  );

  return {
    student_id: studentId,
    full_name: p?.full_name ?? null,
    email: p?.email ?? null,
    bootcamp_id: Number(bootcamp.id),
    bootcamp_name: bootcamp.name as string,
    assignments: assignmentDetails,
  };
}

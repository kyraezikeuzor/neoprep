import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeChoices, normalizeQuestion, QUESTION_SELECT } from "@/lib/questions";
import { getSatSectionScore } from "@/lib/satScore";
import {
  MATH_DOMAINS,
  READING_DOMAINS,
  type SubjectFilter,
  type TierFilter,
} from "@/lib/subjects";
import { requireAdmin } from "@/app/actions/bootcamp/auth";
import type {
  AdminActiveSubscription,
  AdminMetrics,
  AdminRosterRow,
  AdminStudentAssignmentDetail,
  AdminStudentBootcampDetail,
  AdminStudentIncorrectQuestion,
  AdminPracticeTestRunDetail,
  AdminPracticeTestRunSummary,
  AssignmentListItem,
  BankQuestionOption,
  BootcampSummary,
} from "@/app/actions/bootcamp/types";
import { createAdaptiveAssignmentForStudent } from "@/app/actions/bootcamp/adaptive";

export type RoadmapAdminStudent = { student_id: string; full_name: string | null; email: string | null; active_assignment: string | null; completed: number; total: number };
export type RoadmapAdminClass = { id: string; title: string; starts_at: string; duration_minutes: number; timezone: string; meeting_url: string | null };

export async function listAdminRoadmapStudents(): Promise<RoadmapAdminStudent[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id, full_name, email").eq("role", "student").order("full_name");
  const { data: assignments } = await admin.from("assignments").select("id, student_id, title, created_at").not("student_id", "is", null).order("created_at", { ascending: false });
  const ids = (assignments ?? []).map((a) => String(a.id));
  const [{ data: problems }, { data: attempts }] = ids.length ? await Promise.all([admin.from("problems").select("assignment_id, question_id").in("assignment_id", ids), admin.from("attempts").select("assignment_id, question_id").in("assignment_id", ids)]) : [{ data: [] }, { data: [] }];
  return (profiles ?? []).map((profile) => {
    const assignment = (assignments ?? []).find((row) => row.student_id === profile.id);
    const questionIds = new Set((problems ?? []).filter((row) => String(row.assignment_id) === String(assignment?.id)).map((row) => String(row.question_id)));
    const done = new Set((attempts ?? []).filter((row) => String(row.assignment_id) === String(assignment?.id) && questionIds.has(String(row.question_id))).map((row) => String(row.question_id)));
    return { student_id: String(profile.id), full_name: profile.full_name as string | null, email: profile.email as string | null, active_assignment: assignment?.title as string ?? null, completed: done.size, total: questionIds.size };
  });
}

export async function generateAdminRoadmapAssignment(studentId: string) {
  try { const { userId } = await requireAdmin(); const result = await createAdaptiveAssignmentForStudent({ studentId, createdBy: userId }); revalidatePath("/admin/students"); revalidatePath("/assignments"); return { ok: true as const, ...result }; }
  catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Could not create Question Set." }; }
}

export async function listAdminLiveClasses(): Promise<RoadmapAdminClass[]> {
  await requireAdmin(); const admin = createAdminClient();
  const { data, error } = await admin.from("sessions").select("id, title, starts_at, duration_minutes, timezone, meeting_url").not("starts_at", "is", null).order("starts_at");
  if (error) { console.error("listAdminLiveClasses", error); return []; }
  return (data ?? []).map((row) => ({ id: String(row.id), title: String(row.title || "Live class"), starts_at: String(row.starts_at), duration_minutes: Number(row.duration_minutes || 60), timezone: String(row.timezone || "America/Chicago"), meeting_url: row.meeting_url as string | null }));
}

export async function createAdminLiveClass(params: { title: string; startsAt: string; durationMinutes: number; timezone: string; meetingUrl?: string }) {
  try { await requireAdmin(); const title = params.title.trim(); if (!title || !params.startsAt) return { ok: false as const, error: "Title and start time are required." }; const admin = createAdminClient(); const { error } = await admin.from("sessions").insert({ title, starts_at: new Date(params.startsAt).toISOString(), duration_minutes: Math.max(15, Math.min(480, params.durationMinutes || 60)), timezone: params.timezone || "America/Chicago", meeting_url: params.meetingUrl?.trim() || null, bootcamp_id: null, session_date: null }); if (error) return { ok: false as const, error: error.message }; revalidatePath("/admin/classes"); revalidatePath("/sessions"); revalidatePath("/assignments"); return { ok: true as const }; }
  catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Could not create class." }; }
}

function generateJoinCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
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

  return (data ?? []).map((bootcamp) => ({
    id: Number(bootcamp.id),
    name: bootcamp.name as string,
    join_code: bootcamp.join_code as string,
    start_date: (bootcamp.start_date as string | null) ?? null,
    end_date: (bootcamp.end_date as string | null) ?? null,
    created_at: (bootcamp.created_at as string | null) ?? null,
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
    revalidatePath("/admin/bootcamps");
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
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Forbidden",
    };
  }
}

export async function getAdminBootcamp(
  bootcampId: number
): Promise<BootcampSummary | null> {
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
  const ids = rows.map((assignment) => String(assignment.id));

  const { data: aq, error: aqError } = await admin
    .from("problems")
    .select("assignment_id, question_id")
    .in("assignment_id", ids);

  if (aqError) {
    console.error("listAdminAssignments questions error:", aqError);
    throw new Error(
      `Could not load assignment questions: ${aqError.message || "unknown error"}`
    );
  }

  const countByAssignment = new Map<string, number>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    countByAssignment.set(aid, (countByAssignment.get(aid) ?? 0) + 1);
  }

  return rows.map((assignment) => {
    const id = String(assignment.id);
    return {
      id,
      title: assignment.title as string,
      due_date: (assignment.due_date as string | null) ?? null,
      created_at: (assignment.created_at as string | null) ?? null,
      start_date: (assignment.created_at as string | null) ?? null,
      question_count: countByAssignment.get(id) ?? 0,
      completed_count: 0,
      source: "bootcamp" as const,
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
    const uniqueIds = [
      ...new Set(params.questionIds.map((id) => id.trim()).filter(Boolean)),
    ];
    const { error: linkError } = await admin.from("problems").insert(
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
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Forbidden",
    };
  }
}

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

  return (data ?? []).map((question: Record<string, unknown>) => ({
    question_id: question.question_id as string,
    domain: (question.domain as string | null) ?? null,
    skill: (question.skill as string | null) ?? null,
    tier: question.tier == null ? null : Number(question.tier),
    stem: (question.stem as string) ?? "",
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
  const assignmentIds = assignmentRows.map((assignment) => String(assignment.id));

  const { data: aq } = assignmentIds.length
    ? await admin
        .from("problems")
        .select("assignment_id, question_id")
        .in("assignment_id", assignmentIds)
    : { data: [] as { assignment_id: string; question_id: string }[] };

  const totals = new Map<string, Set<string>>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    if (!totals.has(aid)) totals.set(aid, new Set());
    totals.get(aid)!.add(row.question_id as string);
  }

  const studentIds = (students ?? []).map((student) => student.id as string);
  const { data: progress } =
    studentIds.length && assignmentIds.length
      ? await admin
          .from("attempts")
          .select("assignment_id, user_id, question_id")
          .in("assignment_id", assignmentIds)
          .in("user_id", studentIds)
      : { data: [] as { assignment_id: string; user_id: string; question_id: string }[] };

  const completed = new Map<string, Set<string>>();
  for (const row of progress ?? []) {
    const key = `${row.user_id}:${row.assignment_id}`;
    if (!completed.has(key)) completed.set(key, new Set());
    completed.get(key)!.add(row.question_id as string);
  }

  return (students ?? []).map((student) => {
    const profile = student.profiles as
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
    const p = Array.isArray(profile) ? profile[0] : profile;
    const studentId = student.id as string;

    return {
      student_id: studentId,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
      progress: assignmentRows.map((assignment) => {
        const aid = String(assignment.id);
        const totalSet = totals.get(aid) ?? new Set();
        const doneSet = completed.get(`${studentId}:${aid}`) ?? new Set();
        let done = 0;

        for (const qid of doneSet) {
          if (totalSet.has(qid)) done += 1;
        }

        return {
          assignment_id: aid,
          title: assignment.title as string,
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
  const assignmentIds = assignmentRows.map((assignment) => String(assignment.id));

  const { data: aq } = assignmentIds.length
    ? await admin
        .from("problems")
        .select("assignment_id, question_id")
        .in("assignment_id", assignmentIds)
    : { data: [] as { assignment_id: string; question_id: string }[] };

  const questionsByAssignment = new Map<string, Set<string>>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    const qid = row.question_id as string;
    if (!questionsByAssignment.has(aid)) {
      questionsByAssignment.set(aid, new Set());
    }
    questionsByAssignment.get(aid)!.add(qid);
  }

  type ProgressRow = {
    assignment_id: string;
    question_id: string;
    is_correct: boolean | null;
    selected_answer?: string | null;
    attempted_at?: string | null;
  };

  let progress: ProgressRow[] = [];
  if (assignmentIds.length) {
    const { data: attemptRows, error: progressError } = await admin
      .from("attempts")
      .select("assignment_id, question_id, is_correct, selected_answer, attempted_at")
      .eq("user_id", studentId)
      .in("assignment_id", assignmentIds)
      .order("attempted_at", { ascending: false });

    if (progressError) {
      console.error(
        "getAdminStudentBootcampDetail progress error:",
        progressError
      );
    } else {
      const seen = new Set<string>();
      for (const row of attemptRows ?? []) {
        const aid = String(row.assignment_id);
        const qid = row.question_id as string;
        const key = `${aid}:${qid}`;
        if (seen.has(key)) continue;
        seen.add(key);
        progress.push({
          assignment_id: aid,
          question_id: qid,
          is_correct: row.is_correct as boolean | null,
          selected_answer: (row.selected_answer as string | null) ?? null,
          attempted_at: (row.attempted_at as string | null) ?? null,
        });
      }
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

  const selectedByQuestion = new Map<string, string | null>();
  for (const row of progress) {
    if (row.selected_answer != null && row.selected_answer !== "") {
      selectedByQuestion.set(row.question_id, row.selected_answer);
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
    (assignment) => {
      const aid = String(assignment.id);
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
          const question = questionMap.get(qid);
          incorrect.push({
            question_id: qid,
            domain: question?.domain ?? null,
            skill: question?.skill ?? null,
            stem: question?.stem ?? "",
            choices: question?.choices ?? null,
            correct_answer: question?.correct_answer ?? "",
            selected_answer:
              entry.selected_answer ?? selectedByQuestion.get(qid) ?? null,
          });
        }
      }

      return {
        assignment_id: aid,
        title: assignment.title as string,
        due_date: (assignment.due_date as string | null) ?? null,
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

/** Student detail entry point for the admin Students directory. */
export async function getAdminStudentDetail(
  studentId: string
): Promise<AdminStudentBootcampDetail | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .select("bootcamp_id")
    .eq("id", studentId)
    .maybeSingle();

  if (error || data?.bootcamp_id == null) return null;
  return getAdminStudentBootcampDetail(Number(data.bootcamp_id), studentId);
}

function testSection(module: string): "reading_writing" | "math" {
  return module.startsWith("math") ? "math" : "reading_writing";
}

function testModuleOrder(module: string) {
  return ["reading_writing_1", "reading_writing_2", "math_1", "math_2"].indexOf(module);
}

function answersMatch(selected: string | null | undefined, correct: string) {
  if (!selected) return false;
  const a = selected.trim().toLowerCase();
  const b = correct.trim().toLowerCase();
  if (a === b) return true;
  const an = Number(a);
  const bn = Number(b);
  return !Number.isNaN(an) && !Number.isNaN(bn) && an === bn;
}

/** Lists the dedicated Practice Test 1 runs for an admin's student view. */
export async function getAdminStudentPracticeTests(
  studentId: string
): Promise<AdminPracticeTestRunSummary[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: test } = await admin
    .from("tests")
    .select("id,title")
    .eq("title", "Practice Test 1")
    .maybeSingle();
  if (!test) return [];

  const [{ data: runs }, { data: links }] = await Promise.all([
    admin
      .from("test_runs")
      .select("id,status,started_at,completed_at")
      .eq("test_id", test.id)
      .eq("user_id", studentId)
      .order("started_at", { ascending: false }),
    admin.from("test_questions").select("question_id").eq("test_id", test.id),
  ]);
  const runRows = runs ?? [];
  const questionIds = (links ?? []).map((row) => String(row.question_id));
  if (!runRows.length) return [];
  const runIds = runRows.map((row) => String(row.id));
  const [{ data: attempts }, { data: feedback }] = await Promise.all([
    admin.from("test_attempts").select("run_id,question_id").in("run_id", runIds),
    questionIds.length
      ? admin.from("feedback").select("question_id").eq("user_id", studentId).in("question_id", questionIds)
      : Promise.resolve({ data: [] }),
  ]);
  const answeredByRun = new Map<string, Set<string>>();
  for (const attempt of attempts ?? []) {
    const id = String(attempt.run_id);
    if (!answeredByRun.has(id)) answeredByRun.set(id, new Set());
    answeredByRun.get(id)!.add(String(attempt.question_id));
  }
  const reportedQuestions = new Set((feedback ?? []).map((row) => String(row.question_id)));
  return runRows.map((run) => ({
    run_id: String(run.id), test_id: String(test.id), title: String(test.title),
    status: run.status === "completed" ? "completed" : "in_progress",
    started_at: String(run.started_at), completed_at: run.completed_at ? String(run.completed_at) : null,
    answered: answeredByRun.get(String(run.id))?.size ?? 0,
    total: questionIds.length, reported_questions: reportedQuestions.size,
  }));
}

/** Detailed run review. A student-reported test item receives score credit. */
export async function getAdminPracticeTestRunDetail(
  studentId: string,
  runId: string
): Promise<AdminPracticeTestRunDetail | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: run } = await admin
    .from("test_runs")
    .select("id,test_id,status,started_at,completed_at")
    .eq("id", runId)
    .eq("user_id", studentId)
    .maybeSingle();
  if (!run) return null;
  const { data: test } = await admin.from("tests").select("id,title").eq("id", run.test_id).eq("title", "Practice Test 1").maybeSingle();
  if (!test) return null;
  const { data: links } = await admin
    .from("test_questions")
    .select("question_id,module,position")
    .eq("test_id", test.id);
  const orderedLinks = [...(links ?? [])].sort((a, b) =>
    testModuleOrder(String(a.module)) - testModuleOrder(String(b.module)) || Number(a.position) - Number(b.position)
  );
  const questionIds = orderedLinks.map((row) => String(row.question_id));
  const [{ data: questionRows }, { data: attempts }, { data: feedback }] = await Promise.all([
    questionIds.length ? admin.from("questions").select(QUESTION_SELECT).in("question_id", questionIds) : Promise.resolve({ data: [] }),
    admin.from("test_attempts").select("question_id,selected_answer").eq("run_id", runId),
    questionIds.length ? admin.from("feedback").select("question_id,issue_type,notes,created_at").eq("user_id", studentId).in("question_id", questionIds) : Promise.resolve({ data: [] }),
  ]);
  const questions = new Map((questionRows ?? []).map((row) => [String(row.question_id), normalizeQuestion(row as Record<string, unknown>)]));
  const answers = new Map((attempts ?? []).map((row) => [String(row.question_id), row.selected_answer ? String(row.selected_answer) : null]));
  const reports = new Map<string, { issue_type: string; notes: string | null; created_at: string | null }[]>();
  for (const report of feedback ?? []) {
    const id = String(report.question_id);
    const entries = reports.get(id) ?? [];
    entries.push({ issue_type: String(report.issue_type), notes: report.notes ? String(report.notes) : null, created_at: report.created_at ? String(report.created_at) : null });
    reports.set(id, entries);
  }
  let rawReading = 0, rawMath = 0, adjustedReading = 0, adjustedMath = 0;
  const questionDetails = orderedLinks.flatMap((link) => {
    const question = questions.get(String(link.question_id));
    if (!question) return [];
    const section = testSection(String(link.module));
    const selected = answers.get(question.question_id) ?? null;
    const correct = answersMatch(selected, question.correct_answer);
    const questionReports = reports.get(question.question_id) ?? [];
    const credited = questionReports.length > 0;
    if (correct) section === "math" ? rawMath++ : rawReading++;
    if (correct || credited) section === "math" ? adjustedMath++ : adjustedReading++;
    return [{ question_id: question.question_id, module: String(link.module), position: Number(link.position), section, domain: question.domain, skill: question.skill, stem: question.stem, choices: question.choices, correct_answer: question.correct_answer, selected_answer: selected, answered_correctly: correct, credited_for_report: credited, reports: questionReports }];
  });
  const rawReadingScore = getSatSectionScore("reading_writing", rawReading);
  const rawMathScore = getSatSectionScore("math", rawMath);
  const adjustedReadingScore = getSatSectionScore("reading_writing", adjustedReading);
  const adjustedMathScore = getSatSectionScore("math", adjustedMath);
  const runSummary: AdminPracticeTestRunSummary = {
    run_id: String(run.id), test_id: String(test.id), title: String(test.title), status: run.status === "completed" ? "completed" : "in_progress", started_at: String(run.started_at), completed_at: run.completed_at ? String(run.completed_at) : null,
    answered: answers.size, total: questionIds.length, reported_questions: reports.size,
  };
  return {
    run: runSummary,
    raw: { reading_writing: rawReading, math: rawMath, total: rawReadingScore.score + rawMathScore.score, total_lower: rawReadingScore.lower + rawMathScore.lower, total_upper: rawReadingScore.upper + rawMathScore.upper },
    adjusted: { reading_writing: adjustedReading, math: adjustedMath, total: adjustedReadingScore.score + adjustedMathScore.score, total_lower: adjustedReadingScore.lower + adjustedMathScore.lower, total_upper: adjustedReadingScore.upper + adjustedMathScore.upper },
    questions: questionDetails,
  };
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfNextUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

/** Monday 00:00 UTC of the week containing `d`. */
function startOfUtcWeek(d: Date): Date {
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const daysFromMonday = (day + 6) % 7;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysFromMonday)
  );
}

function endOfUtcWeek(d: Date): Date {
  const start = startOfUtcWeek(d);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  await requireAdmin();
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = startOfUtcMonth(now).toISOString();
  const monthEnd = startOfNextUtcMonth(now).toISOString();
  const weekStart = startOfUtcWeek(now).toISOString();
  const weekEnd = endOfUtcWeek(now).toISOString();
  const last7Days = daysAgoIso(7);

  const [
    activeSubsResult,
    newSubsResult,
    canceledSubsResult,
    weekAttemptsResult,
    bootcampStudentsResult,
  ] = await Promise.all([
    admin
      .from("subscriptions")
      .select("id, plan, monthly_price, started_at, status, student_id")
      .eq("status", "active")
      .eq("plan", "bootcamp")
      .order("started_at", { ascending: false }),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan", "bootcamp")
      .gte("started_at", monthStart)
      .lt("started_at", monthEnd),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan", "bootcamp")
      .gte("canceled_at", monthStart)
      .lt("canceled_at", monthEnd),
    admin
      .from("attempts")
      .select("user_id, is_correct")
      .gte("attempted_at", last7Days),
    admin.from("students").select("id, bootcamp_id").not("bootcamp_id", "is", null),
  ]);

  if (activeSubsResult.error) {
    console.error("getAdminMetrics active subs error:", activeSubsResult.error);
  }
  if (newSubsResult.error) {
    console.error("getAdminMetrics new subs error:", newSubsResult.error);
  }
  if (canceledSubsResult.error) {
    console.error("getAdminMetrics canceled subs error:", canceledSubsResult.error);
  }
  if (weekAttemptsResult.error) {
    console.error("getAdminMetrics attempts error:", weekAttemptsResult.error);
  }
  if (bootcampStudentsResult.error) {
    console.error("getAdminMetrics students error:", bootcampStudentsResult.error);
  }

  const activeRows = activeSubsResult.data ?? [];

  const studentIdsForProfiles = [
    ...new Set(
      activeRows
        .map((row) => row.student_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const profileByStudent = new Map<
    string,
    { full_name: string | null; email: string | null }
  >();
  if (studentIdsForProfiles.length) {
    const { data: profileRows, error: profileError } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIdsForProfiles);
    if (profileError) {
      console.error("getAdminMetrics profiles error:", profileError);
    } else {
      for (const profile of profileRows ?? []) {
        profileByStudent.set(profile.id as string, {
          full_name: (profile.full_name as string | null) ?? null,
          email: (profile.email as string | null) ?? null,
        });
      }
    }
  }

  let mrr = 0;
  const activeSubscriptions: AdminActiveSubscription[] = activeRows.map((row) => {
    const price = Number(row.monthly_price ?? 0);
    if (Number.isFinite(price)) mrr += price;
    const profile = profileByStudent.get(row.student_id as string);
    return {
      id: String(row.id),
      student_name: profile?.full_name ?? null,
      student_email: profile?.email ?? null,
      plan: String(row.plan ?? "bootcamp"),
      monthly_price: Number.isFinite(price) ? price : 0,
      started_at: (row.started_at as string | null) ?? null,
    };
  });

  const weekAttempts = weekAttemptsResult.data ?? [];
  const questionsAnsweredThisWeek = weekAttempts.length;
  let correctCount = 0;
  const activeUserIds = new Set<string>();
  for (const attempt of weekAttempts) {
    if (attempt.is_correct) correctCount += 1;
    if (attempt.user_id) activeUserIds.add(attempt.user_id as string);
  }

  const bootcampStudents = bootcampStudentsResult.data ?? [];
  const bootcampIds = [
    ...new Set(
      bootcampStudents
        .map((student) => Number(student.bootcamp_id))
        .filter((id) => Number.isFinite(id))
    ),
  ] as number[];

  let assignmentCompletionRatePercent: number | null = null;

  if (bootcampIds.length && bootcampStudents.length) {
    const { data: weekAssignments, error: weekAssignError } = await admin
      .from("assignments")
      .select("id, bootcamp_id, due_date, created_at")
      .in("bootcamp_id", bootcampIds);

    if (weekAssignError) {
      console.error("getAdminMetrics week assignments error:", weekAssignError);
    } else {
      const inWeek = (iso: string | null) => {
        if (!iso) return false;
        return iso >= weekStart && iso < weekEnd;
      };

      const thisWeekAssignments = (weekAssignments ?? []).filter(
        (assignment) =>
          inWeek((assignment.due_date as string | null) ?? null) ||
          inWeek((assignment.created_at as string | null) ?? null)
      );

      const weekAssignmentIds = thisWeekAssignments.map((assignment) =>
        String(assignment.id)
      );
      const assignmentsByBootcamp = new Map<number, string[]>();
      for (const assignment of thisWeekAssignments) {
        const bid = Number(assignment.bootcamp_id);
        const aid = String(assignment.id);
        if (!assignmentsByBootcamp.has(bid)) assignmentsByBootcamp.set(bid, []);
        assignmentsByBootcamp.get(bid)!.push(aid);
      }

      if (weekAssignmentIds.length) {
        const { data: aq } = await admin
          .from("problems")
          .select("assignment_id, question_id")
          .in("assignment_id", weekAssignmentIds);

        const questionsByAssignment = new Map<string, Set<string>>();
        for (const row of aq ?? []) {
          const aid = String(row.assignment_id);
          if (!questionsByAssignment.has(aid)) {
            questionsByAssignment.set(aid, new Set());
          }
          questionsByAssignment.get(aid)!.add(row.question_id as string);
        }

        const studentIds = bootcampStudents.map((student) => student.id as string);
        const { data: progress } = await admin
          .from("attempts")
          .select("assignment_id, user_id, question_id")
          .in("assignment_id", weekAssignmentIds)
          .in("user_id", studentIds);

        const answered = new Map<string, Set<string>>();
        for (const row of progress ?? []) {
          const key = `${row.user_id}:${row.assignment_id}`;
          if (!answered.has(key)) answered.set(key, new Set());
          answered.get(key)!.add(row.question_id as string);
        }

        const rates: number[] = [];
        for (const student of bootcampStudents) {
          const sid = student.id as string;
          const bid = Number(student.bootcamp_id);
          const aids = assignmentsByBootcamp.get(bid) ?? [];
          let assigned = 0;
          let done = 0;

          for (const aid of aids) {
            const qids = questionsByAssignment.get(aid) ?? new Set();
            assigned += qids.size;
            const doneSet = answered.get(`${sid}:${aid}`) ?? new Set();
            for (const qid of doneSet) {
              if (qids.has(qid)) done += 1;
            }
          }

          if (assigned > 0) rates.push(done / assigned);
        }

        if (rates.length) {
          const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
          assignmentCompletionRatePercent = Math.round(avg * 100);
        }
      }
    }
  }

  return {
    business: {
      activeSubscribers: activeSubscriptions.length,
      mrr,
      newThisMonth: newSubsResult.count ?? 0,
      canceledThisMonth: canceledSubsResult.count ?? 0,
      activeSubscriptions,
    },
    engagement: {
      questionsAnsweredThisWeek,
      accuracyThisWeekPercent:
        questionsAnsweredThisWeek === 0
          ? null
          : Math.round((correctCount / questionsAnsweredThisWeek) * 100),
      activeStudentsThisWeek: activeUserIds.size,
      assignmentCompletionRatePercent,
    },
  };
}

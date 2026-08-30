import { createAdminClient } from "@/lib/supabase/admin";

type Candidate = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
};

function questionScore(question: Candidate, weakSignals: Map<string, number>) {
  const skillKey = question.skill?.trim().toLowerCase() ?? "";
  const domainKey = question.domain?.trim().toLowerCase() ?? "";
  const weakness = (weakSignals.get(skillKey) ?? 0) * 3 + (weakSignals.get(domainKey) ?? 0) * 2;
  const difficulty = question.tier === 3 ? 3 : question.tier === 2 ? 2 : 1;
  return weakness * 10 + difficulty;
}

/** Shared by the student button, completion flow, and a future scheduled job. */
export async function createAdaptiveAssignmentForStudent(params: {
  studentId: string;
  createdBy: string;
  questionCount?: number;
}) {
  const admin = createAdminClient();
  const questionCount = Math.max(5, Math.min(params.questionCount ?? 12, 30));

  const { data: directAssignments, error: assignmentError } = await admin
    .from("assignments")
    .select("id, title, sequence_number, created_at")
    .eq("student_id", params.studentId)
    .order("created_at", { ascending: false });

  if (assignmentError) throw new Error(`Could not load Roadmap assignments: ${assignmentError.message}`);

  const assignmentIds = (directAssignments ?? []).map((row) => String(row.id));
  if (assignmentIds.length > 0) {
    const [{ data: links }, { data: attempts }] = await Promise.all([
      admin.from("problems").select("assignment_id, question_id").in("assignment_id", assignmentIds),
      admin.from("attempts").select("assignment_id, question_id").eq("user_id", params.studentId).in("assignment_id", assignmentIds),
    ]);
    const totals = new Map<string, Set<string>>();
    const completed = new Map<string, Set<string>>();
    for (const row of links ?? []) {
      const id = String(row.assignment_id);
      if (!totals.has(id)) totals.set(id, new Set());
      totals.get(id)!.add(String(row.question_id));
    }
    for (const row of attempts ?? []) {
      const id = String(row.assignment_id);
      if (!completed.has(id)) completed.set(id, new Set());
      completed.get(id)!.add(String(row.question_id));
    }
    const unfinished = (directAssignments ?? []).find((row) => {
      const total = totals.get(String(row.id))?.size ?? 0;
      return total > 0 && (completed.get(String(row.id))?.size ?? 0) < total;
    });
    if (unfinished) return { assignmentId: String(unfinished.id), created: false };
  }

  const { data: attemptRows, error: attemptsError } = await admin
    .from("attempts")
    .select("question_id, is_correct, attempted_at")
    .eq("user_id", params.studentId)
    .order("attempted_at", { ascending: false });
  if (attemptsError) throw new Error(`Could not read practice history: ${attemptsError.message}`);

  const attemptedIds = new Set((attemptRows ?? []).map((row) => String(row.question_id)));
  const wrongIds = [...new Set((attemptRows ?? []).filter((row) => row.is_correct === false).map((row) => String(row.question_id)))].slice(0, 80);
  const weakSignals = new Map<string, number>();
  if (wrongIds.length > 0) {
    const { data: wrongQuestions } = await admin.from("questions").select("question_id, domain, skill").in("question_id", wrongIds);
    for (const row of wrongQuestions ?? []) {
      for (const value of [row.skill, row.domain]) {
        const key = String(value ?? "").trim().toLowerCase();
        if (key) weakSignals.set(key, (weakSignals.get(key) ?? 0) + 1);
      }
    }
  }

  const { data: candidateRows, error: questionError } = await admin
    .from("questions")
    .select("question_id, domain, skill, tier")
    .eq("verified", true)
    .eq("cb", false)
    .order("tier", { ascending: false })
    .limit(1200);
  if (questionError) throw new Error(`Could not build the next Question Set: ${questionError.message}`);

  const candidates = ((candidateRows ?? []) as Candidate[])
    .filter((question) => !attemptedIds.has(String(question.question_id)))
    .sort((a, b) => questionScore(b, weakSignals) - questionScore(a, weakSignals) || a.question_id.localeCompare(b.question_id));

  const math: Candidate[] = [];
  const reading: Candidate[] = [];
  for (const question of candidates) {
    const haystack = `${question.domain ?? ""} ${question.skill ?? ""}`.toLowerCase();
    if (/algebra|math|geometry|trigonometry|data analysis|problem-solving/.test(haystack)) math.push(question);
    else reading.push(question);
  }
  const selected: Candidate[] = [];
  const half = Math.floor(questionCount / 2);
  selected.push(...math.slice(0, half), ...reading.slice(0, questionCount - half));
  for (const question of candidates) {
    if (selected.length >= questionCount) break;
    if (!selected.some((row) => row.question_id === question.question_id)) selected.push(question);
  }
  if (selected.length < 5) throw new Error("There are not enough unattempted verified questions to create another Question Set.");

  const nextSequence = Math.max(0, ...(directAssignments ?? []).map((row) => Number(row.sequence_number) || 0)) + 1;
  const primarySkill = selected.find((row) => row.skill)?.skill ?? selected.find((row) => row.domain)?.domain ?? "Mixed SAT Practice";
  const { data: created, error: createError } = await admin.from("assignments").insert({
    title: `Question Set ${nextSequence}: ${primarySkill}`,
    student_id: params.studentId,
    bootcamp_id: null,
    source: "adaptive",
    sequence_number: nextSequence,
    created_by: params.createdBy,
    due_date: null,
    start_date: new Date().toISOString(),
  }).select("id").single();
  if (createError || !created) throw new Error(`Could not create the Question Set: ${createError?.message ?? "unknown error"}`);

  const { error: linkError } = await admin.from("problems").insert(selected.map((question) => ({
    assignment_id: created.id,
    question_id: question.question_id,
  })));
  if (linkError) {
    await admin.from("assignments").delete().eq("id", created.id);
    throw new Error(`Could not attach questions to the Question Set: ${linkError.message}`);
  }
  return { assignmentId: String(created.id), created: true };
}

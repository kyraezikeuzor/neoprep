"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthedUser } from "@/app/actions/bootcamp/auth";
import { normalizeQuestion, QUESTION_SELECT, type Question } from "@/lib/questions";

export type TestModuleKey = "reading_writing_1" | "reading_writing_2" | "math_1" | "math_2";
export type PracticeTestModule = { key: TestModuleKey; title: string; section: "reading_writing" | "math"; minutes: number; questions: Question[] };
export type TestRunSummary = { id: string; status: "in_progress" | "completed"; startedAt: string; completedAt: string | null };
export type PracticeTest = { id: string; title: string; description: string | null; readingMinutes: number; mathMinutes: number; readingCount: number; mathCount: number; activeRunId: string | null; attempts: TestRunSummary[] };
export type PracticeTestPlayer = PracticeTest & { runId: string; runStatus: "in_progress" | "completed"; modules: PracticeTestModule[]; answers: Record<string, string> };

const MODULES: Array<Omit<PracticeTestModule, "questions" | "minutes">> = [
  { key: "reading_writing_1", title: "Reading and Writing Module 1", section: "reading_writing" },
  { key: "reading_writing_2", title: "Reading and Writing Module 2", section: "reading_writing" },
  { key: "math_1", title: "Math Module 1", section: "math" },
  { key: "math_2", title: "Math Module 2", section: "math" },
];

function normalizeModule(value: string): TestModuleKey {
  if (value === "reading_writing" || value === "reading_writing_1") return "reading_writing_1";
  if (value === "math" || value === "math_1") return "math_1";
  return value === "reading_writing_2" || value === "math_2" ? value : "reading_writing_1";
}

function summarizeRuns(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => ({ id: String(row.id), status: row.status === "completed" ? "completed" as const : "in_progress" as const, startedAt: String(row.started_at), completedAt: row.completed_at ? String(row.completed_at) : null }));
}

export async function listPracticeTests(): Promise<PracticeTest[]> {
  const { user } = await getAuthedUser();
  const admin = createAdminClient();
  const { data, error } = await admin.from("tests").select("id,title,description,reading_minutes,math_minutes,test_questions(module)").order("created_at");
  if (error) return [];
  const testIds = (data ?? []).map((row) => String(row.id));
  const { data: runRows } = user && testIds.length
    ? await admin.from("test_runs").select("id,test_id,status,started_at,completed_at").eq("user_id", user.id).in("test_id", testIds).order("started_at", { ascending: false })
    : { data: [] };
  return (data ?? []).map((row) => {
    const questions = (row.test_questions ?? []) as { module: string }[];
    const attempts = summarizeRuns((runRows ?? []).filter((run) => String(run.test_id) === String(row.id)) as Array<Record<string, unknown>>);
    return { id: String(row.id), title: String(row.title), description: row.description as string | null, readingMinutes: Number(row.reading_minutes), mathMinutes: Number(row.math_minutes), readingCount: questions.filter((item) => normalizeModule(item.module).startsWith("reading_writing")).length, mathCount: questions.filter((item) => normalizeModule(item.module).startsWith("math")).length, activeRunId: attempts.find((run) => run.status === "in_progress")?.id ?? null, attempts };
  });
}

export async function getPracticeTest(testId: string, options?: { runId?: string; newAttempt?: boolean }): Promise<PracticeTestPlayer | null> {
  const { user } = await getAuthedUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: test, error } = await admin.from("tests").select("id,title,description,reading_minutes,math_minutes").eq("id", testId).maybeSingle();
  if (error || !test) return null;
  let run: Record<string, unknown> | null = null;
  if (options?.runId) {
    const { data } = await admin.from("test_runs").select("id,status,started_at,completed_at").eq("id", options.runId).eq("test_id", testId).eq("user_id", user.id).maybeSingle();
    run = data as Record<string, unknown> | null;
  } else if (!options?.newAttempt) {
    const { data } = await admin.from("test_runs").select("id,status,started_at,completed_at").eq("test_id", testId).eq("user_id", user.id).eq("status", "in_progress").order("started_at", { ascending: false }).limit(1).maybeSingle();
    run = data as Record<string, unknown> | null;
  }
  if (!run) {
    const { data, error: runError } = await admin.from("test_runs").insert({ test_id: testId, user_id: user.id }).select("id,status,started_at,completed_at").single();
    if (runError || !data) return null;
    run = data as Record<string, unknown>;
  }
  const { data: links } = await admin.from("test_questions").select("question_id,module,position").eq("test_id", testId).order("position");
  const ids = (links ?? []).map((link) => String(link.question_id));
  const { data: rows } = ids.length ? await admin.from("questions").select(QUESTION_SELECT).in("question_id", ids) : { data: [] };
  const byId = new Map((rows ?? []).map((row) => [String(row.question_id), normalizeQuestion(row as Record<string, unknown>)]));
  const grouped = new Map<TestModuleKey, Question[]>(MODULES.map((module) => [module.key, []]));
  for (const link of links ?? []) { const question = byId.get(String(link.question_id)); if (question) grouped.get(normalizeModule(String(link.module)))?.push(question); }
  const modules = MODULES.map((module) => ({ ...module, minutes: module.section === "reading_writing" ? Number(test.reading_minutes) : Number(test.math_minutes), questions: grouped.get(module.key) ?? [] })).filter((module) => module.questions.length > 0);
  const { data: attempts } = await admin.from("test_attempts").select("question_id,selected_answer").eq("run_id", String(run.id));
  const allRuns = await admin.from("test_runs").select("id,status,started_at,completed_at").eq("test_id", testId).eq("user_id", user.id).order("started_at", { ascending: false });
  const readingCount = modules.filter((module) => module.section === "reading_writing").reduce((total, module) => total + module.questions.length, 0);
  const mathCount = modules.filter((module) => module.section === "math").reduce((total, module) => total + module.questions.length, 0);
  return { id: String(test.id), title: String(test.title), description: test.description as string | null, readingMinutes: Number(test.reading_minutes), mathMinutes: Number(test.math_minutes), readingCount, mathCount, activeRunId: null, attempts: summarizeRuns((allRuns.data ?? []) as Array<Record<string, unknown>>), runId: String(run.id), runStatus: run.status === "completed" ? "completed" : "in_progress", modules, answers: Object.fromEntries((attempts ?? []).filter((item) => item.selected_answer).map((item) => [String(item.question_id), String(item.selected_answer)])) };
}

export async function savePracticeTestAnswer(params: { testId: string; runId: string; questionId: string; selectedAnswer: string }) {
  const { user } = await getAuthedUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await createAdminClient().from("test_attempts").upsert({ test_id: params.testId, user_id: user.id, run_id: params.runId, question_id: params.questionId, selected_answer: params.selectedAnswer, updated_at: new Date().toISOString() });
  if (error) throw new Error("Could not save your answer");
}

export async function completePracticeTestRun(runId: string) {
  const { user } = await getAuthedUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await createAdminClient().from("test_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", runId).eq("user_id", user.id);
  if (error) throw new Error("Could not complete this test run");
}

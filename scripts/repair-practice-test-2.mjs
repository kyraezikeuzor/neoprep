import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TEST_TITLE = "Practice Test 2";
const REPLACEMENTS = [
  ["105ea6de", "17bf10de", "reading_writing_1", 26],
  ["145da981", "0e3b4967", "reading_writing_1", 6],
  ["73d457b6", "0c622cfb", "reading_writing_1", 11],
  ["7edfb2c5", "0d81b7d9", "reading_writing_1", 16],
  ["9b01bcf4", "22a41819", "reading_writing_2", 26],
  ["a15b3219", "0dccbf17", "reading_writing_1", 24],
  ["a2b0fc3b", "11a9f635", "reading_writing_2", 18],
  ["e1546fd6", "11c68ded", "reading_writing_2", 10],
  ["e4e2aeb3", "34d7bb25", "reading_writing_2", 22],
  ["f452410b", "1d0b5bf4", "reading_writing_2", 5],
  ["faee8ec7", "12d81fc1", "reading_writing_1", 18],
].map(([oldId, newId, module, position]) => ({ oldId, newId, module, position }));

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const unsupportedPrompt = /\b(table|graph|chart|diagram)\b|underlin/i;

loadEnv();
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apply = process.argv.includes("--apply");

const { data: tests, error: testsError } = await db
  .from("tests")
  .select("id,title")
  .in("title", ["Practice Test 1", TEST_TITLE]);
if (testsError) throw testsError;
const testIds = Object.fromEntries((tests ?? []).map((test) => [test.title, test.id]));
if (!testIds["Practice Test 1"] || !testIds[TEST_TITLE]) throw new Error("Practice Test 1 or 2 was not found.");

const [{ data: testLinks, error: linksError }, { data: questions, error: questionsError }, { count: runCount, error: runsError }] = await Promise.all([
  db.from("test_questions").select("test_id,question_id,module,position").in("test_id", Object.values(testIds)),
  db.from("questions").select("question_id,domain,tier,stem,choices,correct_answer,cb,graph_spec").in("question_id", REPLACEMENTS.flatMap(({ oldId, newId }) => [oldId, newId])),
  db.from("test_runs").select("*", { count: "exact", head: true }).eq("test_id", testIds[TEST_TITLE]),
]);
if (linksError || questionsError || runsError) throw linksError || questionsError || runsError;
if (runCount) throw new Error("Practice Test 2 has student runs; refusing to replace its questions.");

const test1QuestionIds = new Set((testLinks ?? []).filter((link) => link.test_id === testIds["Practice Test 1"]).map((link) => link.question_id));
const test2Links = (testLinks ?? []).filter((link) => link.test_id === testIds[TEST_TITLE]);
const byId = new Map((questions ?? []).map((question) => [question.question_id, question]));

for (const replacement of REPLACEMENTS) {
  const oldQuestion = byId.get(replacement.oldId);
  const newQuestion = byId.get(replacement.newId);
  const oldLink = test2Links.find((link) => link.question_id === replacement.oldId);
  if (!oldQuestion || !newQuestion || !oldLink) throw new Error(`Could not validate replacement ${replacement.oldId}.`);
  if (oldLink.module !== replacement.module || oldLink.position !== replacement.position) throw new Error(`Unexpected placement for ${replacement.oldId}.`);
  if (oldQuestion.domain !== newQuestion.domain || Number(oldQuestion.tier) !== Number(newQuestion.tier)) throw new Error(`Blueprint mismatch for ${replacement.newId}.`);
  if (newQuestion.cb !== true || newQuestion.graph_spec || unsupportedPrompt.test(newQuestion.stem ?? "")) throw new Error(`Unsafe replacement ${replacement.newId}.`);
  if (!newQuestion.stem?.trim().endsWith("?") || !newQuestion.choices || typeof newQuestion.choices !== "object" || Object.keys(newQuestion.choices).length !== 4 || !Object.hasOwn(newQuestion.choices, newQuestion.correct_answer)) throw new Error(`Malformed replacement ${replacement.newId}.`);
  if (test1QuestionIds.has(replacement.newId) || test2Links.some((link) => link.question_id === replacement.newId)) throw new Error(`Replacement ${replacement.newId} overlaps an assigned test.`);
}

console.log(`Validated ${REPLACEMENTS.length} replacements for ${TEST_TITLE}; no student runs and no Practice Test 1 overlap.`);
if (!apply) {
  console.log("Dry run only. Re-run with --apply to repair Practice Test 2.");
  process.exit(0);
}

const { error: deleteError } = await db
  .from("test_questions")
  .delete()
  .eq("test_id", testIds[TEST_TITLE])
  .in("question_id", REPLACEMENTS.map(({ oldId }) => oldId));
if (deleteError) throw deleteError;

const { error: insertError } = await db.from("test_questions").insert(
  REPLACEMENTS.map(({ newId, module, position }) => ({ test_id: testIds[TEST_TITLE], question_id: newId, module, position }))
);
if (insertError) throw insertError;
console.log(`Replaced ${REPLACEMENTS.length} broken questions in ${TEST_TITLE}.`);

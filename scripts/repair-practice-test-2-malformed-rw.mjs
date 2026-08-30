import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const REPLACEMENTS = [
  ["5f6adeee", "1e85caa9", "reading_writing_1", 1],
  ["6de02dfa", "0c13dea9", "reading_writing_1", 17],
  ["9df6da04", "0fa289a7", "reading_writing_2", 27],
  ["a4f50d30", "0d402146", "reading_writing_2", 7],
].map(([oldId, newId, module, position]) => ({ oldId, newId, module, position }));

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadEnv();
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apply = process.argv.includes("--apply");
const { data: tests, error: testsError } = await db.from("tests").select("id,title").in("title", ["Practice Test 1", "Practice Test 2"]);
if (testsError) throw testsError;
const testIds = Object.fromEntries((tests ?? []).map((test) => [test.title, test.id]));
if (!testIds["Practice Test 1"] || !testIds["Practice Test 2"]) throw new Error("Practice Test 1 or 2 was not found.");

const [{ data: links, error: linksError }, { data: questions, error: questionsError }, { count: runCount, error: runsError }] = await Promise.all([
  db.from("test_questions").select("test_id,question_id,module,position").in("test_id", Object.values(testIds)),
  db.from("questions").select("question_id,domain,tier,stem,choices,correct_answer,cb,graph_spec").in("question_id", REPLACEMENTS.flatMap(({ oldId, newId }) => [oldId, newId])),
  db.from("test_runs").select("*", { count: "exact", head: true }).eq("test_id", testIds["Practice Test 2"]),
]);
if (linksError || questionsError || runsError) throw linksError || questionsError || runsError;
if (runCount) throw new Error("Practice Test 2 has student runs; refusing to replace its questions.");

const test1Ids = new Set((links ?? []).filter((link) => link.test_id === testIds["Practice Test 1"]).map((link) => link.question_id));
const test2Links = (links ?? []).filter((link) => link.test_id === testIds["Practice Test 2"]);
const questionsById = new Map((questions ?? []).map((question) => [question.question_id, question]));
for (const replacement of REPLACEMENTS) {
  const oldQuestion = questionsById.get(replacement.oldId);
  const newQuestion = questionsById.get(replacement.newId);
  const oldLink = test2Links.find((link) => link.question_id === replacement.oldId);
  if (!oldQuestion || !newQuestion || !oldLink) throw new Error(`Could not validate replacement ${replacement.oldId}.`);
  if (oldLink.module !== replacement.module || oldLink.position !== replacement.position) throw new Error(`Unexpected placement for ${replacement.oldId}.`);
  if (oldQuestion.domain !== newQuestion.domain || Number(oldQuestion.tier) !== Number(newQuestion.tier)) throw new Error(`Blueprint mismatch for ${replacement.newId}.`);
  if (newQuestion.cb !== true || newQuestion.graph_spec || !newQuestion.stem?.trim().endsWith("?") || !newQuestion.choices || typeof newQuestion.choices !== "object" || Object.keys(newQuestion.choices).length !== 4 || !Object.hasOwn(newQuestion.choices, newQuestion.correct_answer)) throw new Error(`Malformed replacement ${replacement.newId}.`);
  if (test1Ids.has(replacement.newId) || test2Links.some((link) => link.question_id === replacement.newId)) throw new Error(`Replacement ${replacement.newId} overlaps an assigned test.`);
}

console.log(`Validated ${REPLACEMENTS.length} Reading & Writing replacements; no student runs and no Practice Test 1 overlap.`);
if (!apply) process.exit(0);
const { error: deleteError } = await db.from("test_questions").delete().eq("test_id", testIds["Practice Test 2"]).in("question_id", REPLACEMENTS.map(({ oldId }) => oldId));
if (deleteError) throw deleteError;
const { error: insertError } = await db.from("test_questions").insert(REPLACEMENTS.map(({ newId, module, position }) => ({ test_id: testIds["Practice Test 2"], question_id: newId, module, position })));
if (insertError) throw insertError;
console.log(`Replaced ${REPLACEMENTS.length} malformed Reading & Writing questions in Practice Test 2.`);

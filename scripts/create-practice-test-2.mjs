import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MATH_DOMAINS = new Set([
  "Algebra",
  "Advanced Math",
  "Problem-Solving and Data Analysis",
  "Geometry and Trigonometry",
]);

// A fixed-form approximation of the Digital SAT's mixed-difficulty modules.
// Module 2 has a slightly greater share of Tier 3 questions, while the full
// test stays 30% Tier 1, 48% Tier 2, and 22% Tier 3.
const BLUEPRINT = {
  reading_writing: {
    modules: [
      { key: "reading_writing_1", tiers: { 1: 9, 2: 13, 3: 5 } },
      { key: "reading_writing_2", tiers: { 1: 7, 2: 13, 3: 7 } },
    ],
    domainTiers: {
      "Information and Ideas": { 1: 4, 2: 6, 3: 3 },
      "Craft and Structure": { 1: 4, 2: 7, 3: 3 },
      "Expression of Ideas": { 1: 4, 2: 6, 3: 2 },
      "Standard English Conventions": { 1: 4, 2: 7, 3: 4 },
    },
  },
  math: {
    modules: [
      { key: "math_1", tiers: { 1: 7, 2: 10, 3: 5 } },
      { key: "math_2", tiers: { 1: 5, 2: 10, 3: 7 } },
    ],
    domainTiers: {
      Algebra: { 1: 5, 2: 7, 3: 3 },
      "Advanced Math": { 1: 2, 2: 6, 3: 7 },
      // The available bank has only one Tier 3 PSDA item, so this preserves
      // College Board's domain coverage without incorrectly calling easy
      // questions hard.
      "Problem-Solving and Data Analysis": { 1: 4, 2: 2, 3: 1 },
      "Geometry and Trigonometry": { 1: 1, 2: 5, 3: 1 },
    },
  },
};

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function stableRank(value) {
  let hash = 2166136261;
  for (const char of `practice-test-2:${value}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeSlots(section) {
  return BLUEPRINT[section].modules.flatMap((module) =>
    [1, 2, 3].flatMap((tier) =>
      Array.from({ length: module.tiers[tier] }, () => ({ module: module.key, tier }))
    )
  );
}

function chooseQuestions(section, candidates) {
  const remaining = Object.fromEntries(
    Object.entries(BLUEPRINT[section].domainTiers).map(([domain, tiers]) => [domain, { ...tiers }])
  );
  const selected = [];
  const used = new Set();
  for (const slot of makeSlots(section)) {
    const options = candidates
      .filter((question) => !used.has(question.question_id) && Number(question.tier) === slot.tier && remaining[question.domain]?.[slot.tier] > 0)
      .sort((a, b) => {
        const aNeed = remaining[a.domain][slot.tier] / BLUEPRINT[section].domainTiers[a.domain][slot.tier];
        const bNeed = remaining[b.domain][slot.tier] / BLUEPRINT[section].domainTiers[b.domain][slot.tier];
        return bNeed - aNeed || stableRank(a.question_id) - stableRank(b.question_id);
      });
    const question = options[0];
    if (!question) throw new Error(`Insufficient Tier ${slot.tier} ${section} inventory for the requested domain balance.`);
    used.add(question.question_id);
    remaining[question.domain][slot.tier] -= 1;
    selected.push({ ...slot, question_id: question.question_id, domain: question.domain });
  }
  if (Object.values(remaining).some((tiers) => Object.values(tiers).some((count) => count !== 0))) {
    throw new Error(`Could not satisfy the ${section} domain blueprint: ${JSON.stringify(remaining)}`);
  }
  return selected;
}

function summarize(selected) {
  return Object.fromEntries(
    Object.entries(BLUEPRINT).map(([section, blueprint]) => {
      const rows = selected[section];
      return [section, {
        total: rows.length,
        tiers: Object.fromEntries([1, 2, 3].map((tier) => [tier, rows.filter((row) => row.tier === tier).length])),
        domains: Object.fromEntries(Object.keys(blueprint.domainTiers).map((domain) => [domain, rows.filter((row) => row.domain === domain).length])),
      }];
    })
  );
}

loadEnv();
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apply = process.argv.includes("--apply");

const { data: existing, error: existingError } = await db.from("tests").select("id,title").eq("title", "Practice Test 2").maybeSingle();
if (existingError) throw existingError;
if (existing) throw new Error("Practice Test 2 already exists; refusing to create a duplicate.");

const [{ data: test1, error: test1Error }, { data: allQuestions, error: questionError }] = await Promise.all([
  db.from("tests").select("id").eq("title", "Practice Test 1").single(),
  db.from("questions").select("question_id,domain,tier,cb,correct_answer").not("correct_answer", "is", null),
]);
if (test1Error || questionError) throw test1Error || questionError;
const { data: test1Links, error: linksError } = await db.from("test_questions").select("question_id").eq("test_id", test1.id);
if (linksError) throw linksError;
const test1Ids = new Set((test1Links ?? []).map((row) => String(row.question_id)));

const readingCandidates = (allQuestions ?? []).filter((question) => !test1Ids.has(String(question.question_id)) && !MATH_DOMAINS.has(String(question.domain)) && question.cb === true);
const mathCandidates = (allQuestions ?? []).filter((question) => !test1Ids.has(String(question.question_id)) && MATH_DOMAINS.has(String(question.domain)));
const selected = {
  reading_writing: chooseQuestions("reading_writing", readingCandidates),
  math: chooseQuestions("math", mathCandidates),
};
console.log(JSON.stringify(summarize(selected), null, 2));

if (!apply) {
  console.log("Dry run only. Re-run with --apply to create Practice Test 2.");
  process.exit(0);
}

const { data: created, error: createError } = await db
  .from("tests")
  .insert({ title: "Practice Test 2", description: "Balanced timed Digital SAT practice: 54 Reading & Writing questions and 44 Math questions." })
  .select("id")
  .single();
if (createError || !created) throw createError || new Error("Could not create Practice Test 2.");

const links = [...selected.reading_writing, ...selected.math].map((row) => ({
  test_id: created.id,
  question_id: row.question_id,
  module: row.module,
  position: selected[row.module.startsWith("math") ? "math" : "reading_writing"].filter((item) => item.module === row.module).indexOf(row) + 1,
}));
const { error: insertError } = await db.from("test_questions").insert(links);
if (insertError) throw insertError;
console.log(`Created Practice Test 2 (${created.id}).`);

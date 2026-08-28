import { createClient } from "@/lib/supabase/server";
import { buildMasteryOverview, type MasteryEvidence, type MasteryOverview } from "@/lib/mastery";
import { MATH_DOMAINS, READING_DOMAINS } from "@/lib/subjects";

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

export async function getMasteryOverview(): Promise<MasteryOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return buildMasteryOverview([]);

  const { data, error } = await supabase
    .from("attempts")
    .select("question_id, is_correct, attempted_at, questions(domain, skill, tier)")
    .eq("user_id", user.id)
    .order("attempted_at", { ascending: false });

  if (error) {
    console.error("getMasteryOverview error:", error);
    return buildMasteryOverview([]);
  }

  const evidence = (data ?? []).flatMap((row): MasteryEvidence[] => {
    const relation = row.questions as
      | { domain: string | null; skill: string | null; tier: number | null }
      | { domain: string | null; skill: string | null; tier: number | null }[]
      | null;
    const question = Array.isArray(relation) ? relation[0] : relation;
    if (!row.question_id || !row.attempted_at || !question) return [];

    return [{
      questionId: row.question_id as string,
      isCorrect: row.is_correct === true,
      attemptedAt: row.attempted_at as string,
      domain: question.domain,
      skill: question.skill,
      tier: question.tier == null ? null : Number(question.tier),
    }];
  });

  return buildMasteryOverview(evidence);
}

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

  const domainOrder = new Map<string, number>(
    ALL_TOPICS.map((domain, index) => [domain, index])
  );

  return [...bySkill.entries()]
    .map(([skill, agg]) => ({
      skill,
      domain: agg.domain,
      completed: agg.ids.size,
      total: agg.total,
    }))
    .sort((a, b) => {
      const da = a.domain ? (domainOrder.get(a.domain) ?? 99) : 99;
      const db = b.domain ? (domainOrder.get(b.domain) ?? 99) : 99;
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
  const extras = [...totals.keys()].filter((topic) => !known.has(topic));
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

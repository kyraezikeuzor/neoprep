import { MATH_DOMAINS, READING_DOMAINS } from "@/lib/subjects";

export const MASTERY_FORMULA_VERSION = "v1" as const;
export const MASTERY_TARGET_POINTS = 20;

export type MasterySubject = "math" | "reading_writing";

export type MasteryEvidence = {
  questionId: string;
  isCorrect: boolean;
  attemptedAt: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
};

export type MasteryMetric = {
  score: number;
  questionCount: number;
  attemptedPoints: number;
  correctPoints: number;
  status: "not_started" | "building" | "developing" | "strong" | "mastered";
  statusLabel: string;
  evidenceLabel: string;
};

export type SkillMastery = MasteryMetric & {
  skill: string;
};

export type DomainMastery = MasteryMetric & {
  domain: string;
  subject: MasterySubject;
  skills: SkillMastery[];
};

export type MasteryOverview = {
  formulaVersion: typeof MASTERY_FORMULA_VERSION;
  domains: DomainMastery[];
};

/** Tier 1 / 2 / 3 questions contribute 1 / 2 / 3 points of evidence. */
export function masteryTierWeight(tier: number | null): number {
  if (tier === 3) return 3;
  if (tier === 2) return 2;
  return 1;
}

function masteryStatus(score: number, questionCount: number): Pick<MasteryMetric, "status" | "statusLabel"> {
  if (questionCount === 0) return { status: "not_started", statusLabel: "Not started" };
  if (score >= 90) return { status: "mastered", statusLabel: "Mastered" };
  if (score >= 75) return { status: "strong", statusLabel: "Strong" };
  if (score >= 50) return { status: "developing", statusLabel: "Developing" };
  return { status: "building", statusLabel: "Building" };
}

function calculateMetric(evidence: MasteryEvidence[]): MasteryMetric {
  let attemptedPoints = 0;
  let correctPoints = 0;

  for (const item of evidence) {
    const weight = masteryTierWeight(item.tier);
    attemptedPoints += weight;
    if (item.isCorrect) correctPoints += weight;
  }

  // Before 20 weighted points, the score grows with correct evidence. Once the
  // evidence target is reached, it becomes the student's weighted accuracy.
  const evidenceScale = Math.max(MASTERY_TARGET_POINTS, attemptedPoints);
  const score = evidence.length === 0 ? 0 : Math.round((correctPoints / evidenceScale) * 100);
  const status = masteryStatus(score, evidence.length);

  return {
    score: Math.max(0, Math.min(100, score)),
    questionCount: evidence.length,
    attemptedPoints,
    correctPoints,
    ...status,
    evidenceLabel:
      evidence.length === 0
        ? "Practice this domain to begin"
        : `${evidence.length} unique question${evidence.length === 1 ? "" : "s"} of evidence`,
  };
}

function subjectForDomain(domain: string): MasterySubject {
  return (READING_DOMAINS as readonly string[]).includes(domain) ? "reading_writing" : "math";
}

/**
 * Builds domain and skill mastery from the latest attempt on every unique
 * question. Older attempts on the same question are intentionally ignored.
 */
export function buildMasteryOverview(evidence: MasteryEvidence[]): MasteryOverview {
  const latestByQuestion = new Map<string, MasteryEvidence>();

  for (const item of evidence) {
    if (!item.questionId) continue;
    const current = latestByQuestion.get(item.questionId);
    if (!current || new Date(item.attemptedAt).getTime() > new Date(current.attemptedAt).getTime()) {
      latestByQuestion.set(item.questionId, item);
    }
  }

  const latest = [...latestByQuestion.values()];
  const knownDomains = [...MATH_DOMAINS, ...READING_DOMAINS] as string[];
  const extraDomains = [...new Set(latest.map((item) => item.domain).filter((domain): domain is string => Boolean(domain)))]
    .filter((domain) => !knownDomains.includes(domain))
    .sort();

  const domains = [...knownDomains, ...extraDomains].map((domain): DomainMastery => {
    const domainEvidence = latest.filter((item) => item.domain === domain);
    const skillNames = [...new Set(domainEvidence.map((item) => item.skill?.trim()).filter((skill): skill is string => Boolean(skill)))].sort();
    const skills = skillNames
      .map((skill): SkillMastery => ({
        skill,
        ...calculateMetric(domainEvidence.filter((item) => item.skill?.trim() === skill)),
      }))
      .sort((a, b) => b.score - a.score || b.questionCount - a.questionCount || a.skill.localeCompare(b.skill));

    return {
      domain,
      subject: subjectForDomain(domain),
      ...calculateMetric(domainEvidence),
      skills,
    };
  });

  return { formulaVersion: MASTERY_FORMULA_VERSION, domains };
}

export function previewMasteryOverview(): MasteryOverview {
  const now = new Date().toISOString();
  const samples: Array<[string, string, number, boolean]> = [
    ["Algebra", "Linear equations in one variable", 3, true],
    ["Algebra", "Linear equations in one variable", 2, true],
    ["Algebra", "Systems of two linear equations", 3, true],
    ["Algebra", "Systems of two linear equations", 2, false],
    ["Advanced Math", "Equivalent expressions", 3, true],
    ["Advanced Math", "Equivalent expressions", 2, true],
    ["Advanced Math", "Nonlinear equations", 3, false],
    ["Information and Ideas", "Central ideas and details", 3, true],
    ["Information and Ideas", "Command of evidence", 2, true],
    ["Craft and Structure", "Words in context", 2, true],
    ["Standard English Conventions", "Boundaries", 3, false],
  ];

  return buildMasteryOverview(samples.map(([domain, skill, tier, isCorrect], index) => ({
    questionId: `preview-mastery-${index}`,
    isCorrect,
    attemptedAt: now,
    domain,
    skill,
    tier,
  })));
}

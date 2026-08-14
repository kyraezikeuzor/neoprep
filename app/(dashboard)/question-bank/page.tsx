import type { Metadata } from "next";
import {
  getBankOverview,
  getQuestionById,
  getRandomQuestion,
  getSkillProgress,
} from "@/app/actions";
import QuestionBankLanding from "@/components/QuestionBankLanding";
import QuestionCard from "@/components/QuestionCard";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";

function parseSubject(value: string | undefined): SubjectFilter {
  if (value === "math" || value === "reading_writing" || value === "all") return value;
  return "all";
}

function parseTier(value: string | undefined): TierFilter {
  if (value === "1" || value === "2" || value === "3") return Number(value) as 1 | 2 | 3;
  return "all";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: {
    question?: string;
    practice?: string;
  };
}): Promise<Metadata> {
  const inPractice =
    searchParams?.practice === "1" || Boolean(searchParams?.question?.trim());
  return {
    title: inPractice ? "Practice · Tutormigo" : "Question Bank · Tutormigo",
  };
}

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: {
    question?: string;
    practice?: string;
    subject?: string;
    tier?: string;
  };
}) {
  const inPractice =
    searchParams?.practice === "1" || Boolean(searchParams?.question?.trim());

  if (!inPractice) {
    const [overview, skillProgress] = await Promise.all([
      getBankOverview(),
      getSkillProgress(),
    ]);
    return (
      <QuestionBankLanding overview={overview} skillProgress={skillProgress} />
    );
  }

  const subject = parseSubject(searchParams?.subject);
  const tier = parseTier(searchParams?.tier);
  const requestedId = searchParams?.question?.trim();

  const question = requestedId
    ? (await getQuestionById(requestedId)) ??
      (await getRandomQuestion({ subject, tier }))
    : await getRandomQuestion({ subject, tier });

  return (
    <div className="h-full min-h-0">
      <QuestionCard
        initialQuestion={question}
        initialSubject={subject}
        initialTier={tier}
        sessionLength={5}
      />
    </div>
  );
}

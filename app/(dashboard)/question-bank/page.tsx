import type { Metadata } from "next";
import {
  getBankOverview,
  getBookmarkedQuestionIds,
  getDashboardShellStats,
  getQuestionById,
  getRandomQuestion,
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

function parseCount(value: string | undefined): number {
  const n = Number(value);
  if (n === 10 || n === 20 || n === 30) return n;
  return 10;
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
    title: inPractice ? "Practice · NeoPrep" : "Question Bank · NeoPrep",
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
    count?: string;
  };
}) {
  const inPractice =
    searchParams?.practice === "1" || Boolean(searchParams?.question?.trim());

  if (!inPractice) {
    const [overview, stats] = await Promise.all([
      getBankOverview(),
      getDashboardShellStats(),
    ]);
    return (
      <QuestionBankLanding overview={overview} streak={stats.streak} />
    );
  }

  const subject = parseSubject(searchParams?.subject);
  const tier = parseTier(searchParams?.tier);
  const count = parseCount(searchParams?.count);
  const requestedId = searchParams?.question?.trim();

  const [question, bookmarkedIds] = await Promise.all([
    requestedId
      ? (await getQuestionById(requestedId)) ??
        (await getRandomQuestion({ subject, tier }))
      : getRandomQuestion({ subject, tier }),
    getBookmarkedQuestionIds(),
  ]);

  return (
    <div className="h-full min-h-0">
      <QuestionCard
        initialQuestion={question}
        initialSubject={subject}
        initialTier={tier}
        sessionLength={count}
        initialBookmarkedIds={bookmarkedIds}
      />
    </div>
  );
}

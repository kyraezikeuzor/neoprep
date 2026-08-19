import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole } from "@/app/actions/bootcamp";
import {
  getQuestionReviewBacklogCount,
  listPlaygroundQuestions,
} from "@/app/actions/tools";
import StagingReview from "@/components/admin/StagingReview";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";

export const metadata: Metadata = {
  title: "Review Questions · NeoPrep",
};

function parseSubject(value: string | undefined): SubjectFilter {
  return value === "math" || value === "reading_writing" ? value : "all";
}

function parseTier(value: string | undefined): TierFilter {
  return value === "1" || value === "2" || value === "3"
    ? (Number(value) as 1 | 2 | 3)
    : "all";
}

export default async function StagingReviewPage({
  searchParams,
}: {
  searchParams?: { question?: string; subject?: string; tier?: string; count?: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const questionId = searchParams?.question?.trim() ?? "";
  const subject = parseSubject(searchParams?.subject);
  const tier = parseTier(searchParams?.tier);
  const requestedCount = Number(searchParams?.count);
  const sessionLength = requestedCount === 20 || requestedCount === 30 ? requestedCount : 10;
  const [allMatchingRows, initialBacklogCount] = await Promise.all([
    listPlaygroundQuestions({
      subject,
      tier,
      reviewState: questionId ? "all" : "unverified",
    }),
    getQuestionReviewBacklogCount(),
  ]);
  const initialRows = allMatchingRows.slice(0, sessionLength);

  return (
    <main className="h-screen min-h-0 overflow-hidden bg-white">
      <StagingReview
        initialRows={initialRows}
        initialBacklogCount={initialBacklogCount}
        initialReviewQuestionId={questionId}
        initialTier={tier}
        sessionLength={sessionLength}
        reviewMode
      />
    </main>
  );
}

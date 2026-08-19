import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPlaygroundQuestion } from "@/app/actions/tools";
import { getProfileRole } from "@/app/actions/bootcamp";
import QuestionCard from "@/components/QuestionCard";
import { PracticeSessionProvider } from "@/components/PracticeSessionProvider";

export const metadata: Metadata = {
  title: "Question Viewer · Tutormigo",
};

export default async function AdminQuestionViewerPage({
  searchParams,
}: {
  searchParams?: { question?: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const questionId = searchParams?.question?.trim() ?? "";
  if (!questionId) redirect("/admin/question-search");
  const question = await getPlaygroundQuestion(questionId);
  if (!question) redirect("/admin/question-search");

  return (
    <main className="h-screen overflow-hidden bg-white">
      <PracticeSessionProvider>
        <QuestionCard
          initialQuestion={question}
          questionQueue={[question]}
          hideFilters
          sessionExitHref="/admin/question-search"
          sessionExitLabel="Back to Lookup"
        />
      </PracticeSessionProvider>
    </main>
  );
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getQuestionById } from "@/app/actions";
import { getProfileRole } from "@/app/bootcamp-actions";
import QuestionViewer from "@/components/QuestionViewer";

export const metadata: Metadata = {
  title: "Question Search · Tutormigo",
};

export default async function QuestionViewerPage({
  searchParams,
}: {
  searchParams?: { question?: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/question-bank");

  const requestedId = searchParams?.question?.trim() ?? "";
  const question = requestedId ? await getQuestionById(requestedId) : null;

  return (
    <div className="h-full min-h-0">
      <QuestionViewer
        initialQuestion={question}
        initialId={question?.question_id ?? requestedId}
      />
    </div>
  );
}

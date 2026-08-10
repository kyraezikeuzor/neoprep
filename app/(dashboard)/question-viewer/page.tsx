import { getQuestionById } from "@/app/actions";
import QuestionViewer from "@/components/QuestionViewer";

export default async function QuestionViewerPage({
  searchParams,
}: {
  searchParams?: { question?: string };
}) {
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

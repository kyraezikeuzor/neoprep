import { getQuestionById, getRandomQuestion } from "@/app/actions";
import QuestionCard from "@/components/QuestionCard";

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: { question?: string };
}) {
  const requestedId = searchParams?.question;
  const question = requestedId
    ? (await getQuestionById(requestedId)) ?? (await getRandomQuestion())
    : await getRandomQuestion();

  return (
    <div className="h-full min-h-0">
      <QuestionCard initialQuestion={question} />
    </div>
  );
}

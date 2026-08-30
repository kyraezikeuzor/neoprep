import { notFound } from "next/navigation";
import { getPracticeTest } from "@/app/actions";
import QuestionCard from "@/components/QuestionCard";

export default async function PracticeTestPage({ params, searchParams }: { params: { id: string }; searchParams?: { run?: string; new?: string } }) {
  const test = await getPracticeTest(params.id, { runId: searchParams?.run, newAttempt: searchParams?.new === "1" });
  if (!test) notFound();

  const questions = test.modules.flatMap((module) => module.questions);
  const firstUnansweredIndex = questions.findIndex(
    (question) => !test.answers[question.question_id]
  );
  const restoredAnswers = Object.fromEntries(
    Object.entries(test.answers).map(([questionId, selectedAnswer]) => [
      questionId,
      { selectedAnswer, correct: false },
    ])
  );

  return (
    <QuestionCard
      initialQuestion={questions[0] ?? null}
      questionQueue={questions}
      sessionLength={questions.length}
      initialHistoryIndex={firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0}
      viewerType="practice-test"
      testId={test.id}
      testRunId={test.runId}
      testCompleted={test.runStatus === "completed"}
      hideFilters
      initialSessionResults={restoredAnswers}
      sessionExitHref="/practice-tests"
      sessionExitLabel="Back to Practice Tests"
      modules={test.modules}
    />
  );
}

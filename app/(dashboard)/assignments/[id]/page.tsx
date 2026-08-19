import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAssignmentForPractice,
  getStudentBootcamp,
} from "@/app/actions/bootcamp";
import { getBookmarkedQuestionIds } from "@/app/actions";
import QuestionCard from "@/components/QuestionCard";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const assignmentId = params.id?.trim();
  if (!assignmentId) return { title: "Roadmap · Tutormigo" };

  try {
    const assignment = await getAssignmentForPractice(assignmentId);
    if (!assignment) return { title: "Roadmap · Tutormigo" };
    return { title: `${assignment.title} · Tutormigo` };
  } catch {
    return { title: "Roadmap · Tutormigo" };
  }
}

export default async function AssignmentPracticePage({
  params,
}: {
  params: { id: string };
}) {
  const bootcamp = await getStudentBootcamp();
  if (!bootcamp) redirect("/dashboard");

  const assignmentId = params.id?.trim();
  if (!assignmentId) notFound();

  const assignment = await getAssignmentForPractice(assignmentId);
  if (!assignment) notFound();

  if (assignment.questions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <p className="font-sans text-sm text-arc-muted">
          This Focus Set has no questions yet.
        </p>
      </div>
    );
  }

  const initialSessionResults: Record<
    string,
    { correct: boolean; selectedAnswer: string }
  > = {};
  for (const row of assignment.progress) {
    initialSessionResults[row.question_id] = {
      correct: row.is_correct,
      selectedAnswer: row.selected_answer ?? "",
    };
  }

  // Resume at the first unanswered question (or last if all done).
  let initialHistoryIndex = 0;
  const firstUnanswered = assignment.questions.findIndex(
    (q) => !initialSessionResults[q.question_id]
  );
  if (firstUnanswered >= 0) {
    initialHistoryIndex = firstUnanswered;
  } else if (assignment.questions.length > 0) {
    initialHistoryIndex = assignment.questions.length - 1;
  }

  const bookmarkedIds = await getBookmarkedQuestionIds();

  return (
    <div className="h-full min-h-0">
      <QuestionCard
        initialQuestion={assignment.questions[initialHistoryIndex]!}
        questionQueue={assignment.questions}
        assignmentId={assignment.id}
        sessionLength={assignment.questions.length}
        hideFilters
        sessionExitHref="/assignments"
        sessionExitLabel="Back to Roadmap"
        initialSessionResults={initialSessionResults}
        initialHistoryIndex={initialHistoryIndex}
        initialBookmarkedIds={bookmarkedIds}
      />
    </div>
  );
}

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_QUESTION_LIMIT_ERROR } from "@/lib/access-policy";
import { getQuestionAccessForUser } from "@/lib/question-access.server";

export async function submitAttempt(params: {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpentSec: number;
  /** When set, marks this attempt as belonging to a bootcamp assignment. */
  assignmentId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in");
  }

  const admin = createAdminClient();
  const { data: priorAttempt, error: priorAttemptError } = await admin
    .from("attempts")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("question_id", params.questionId)
    .limit(1)
    .maybeSingle();

  if (priorAttemptError) {
    console.error("submitAttempt prior-attempt error:", priorAttemptError);
    throw new Error("Could not verify question access");
  }

  if (!priorAttempt) {
    const access = await getQuestionAccessForUser(user.id);
    if (!access.canAccessNewQuestion) {
      throw new Error(FREE_QUESTION_LIMIT_ERROR);
    }
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    question_id: params.questionId,
    selected_answer: params.selectedAnswer,
    is_correct: params.isCorrect,
    time_spent_sec: params.timeSpentSec,
  };
  if (params.assignmentId) {
    payload.assignment_id = params.assignmentId;
  }

  // Assignment-linked rows use the service role so RLS on assignment_id
  // cannot block progress saves for bootcamp students.
  const writer = params.assignmentId ? admin : supabase;
  const { error } = await writer.from("attempts").insert(payload);

  if (error) {
    console.error("submitAttempt error:", error);
    throw new Error("Could not save attempt");
  }

  revalidatePath("/question-bank");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recent-errors");
  revalidatePath("/leaderboard");
  revalidatePath("/", "layout");
  if (params.assignmentId) {
    revalidatePath("/assignments");
    revalidatePath(`/assignments/${params.assignmentId}`);
  }
}

export type QuestionReportIssueType =
  | "issue_with_explanation"
  | "wrong_answer_marked_correct"
  | "explanation_incorrect"
  | "formatting_display_issue"
  | "other";

export async function submitQuestionReport(params: {
  questionId: string;
  issueType: QuestionReportIssueType;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to report an issue." };
  }

  const notes = params.notes?.trim() ? params.notes.trim() : null;

  const { error } = await supabase.from("feedback").insert({
    question_id: params.questionId,
    user_id: user.id,
    issue_type: params.issueType,
    notes,
  });

  if (error) {
    console.error("submitQuestionReport error:", error);
    return {
      ok: false,
      error: error.message || "Could not submit report. Please try again.",
    };
  }

  return { ok: true };
}

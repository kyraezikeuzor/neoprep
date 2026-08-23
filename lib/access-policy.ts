export const FREE_QUESTION_LIMIT = 100;

export const FREE_QUESTION_LIMIT_ERROR =
  "You have used all 100 questions included with the Free plan. Upgrade to Pro to keep practicing new questions.";

export type QuestionAccess = {
  tier: "free" | "pro";
  planId: string;
  planLabel: string;
  isPro: boolean;
  uniqueQuestionsUsed: number;
  questionLimit: number | null;
  remainingQuestions: number | null;
  canAccessNewQuestion: boolean;
  accessEndsAt: string | null;
  provider: string | null;
};

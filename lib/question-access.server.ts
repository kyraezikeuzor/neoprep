import "server-only";

import { cache } from "react";
import {
  FREE_QUESTION_LIMIT,
  type QuestionAccess,
} from "@/lib/access-policy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SubscriptionRow = {
  plan: string;
  status: string;
  provider: string | null;
  access_ends_at: string | null;
  current_period_end: string | null;
  updated_at: string | null;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function hasCurrentAccess(subscription: SubscriptionRow, now: number) {
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) return false;
  const end = subscription.access_ends_at ?? subscription.current_period_end;
  return !end || new Date(end).getTime() > now;
}

function planLabel(planId: string) {
  if (planId === "until_sat") return "Pro · Until SAT";
  if (planId === "monthly") return "Pro · 1 Month";
  if (planId === "quarterly") return "Pro · 3 Months";
  if (planId === "six_months") return "Pro · 6 Months";
  if (planId === "bootcamp") return "Pro · Bootcamp";
  return "Pro";
}

export async function getQuestionAccessForUser(
  userId: string,
  attemptedQuestionIds?: Iterable<string>
): Promise<QuestionAccess> {
  const admin = createAdminClient();
  const [profileResult, subscriptionsResult, attemptsResult] = await Promise.all([
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
    admin
      .from("subscriptions")
      .select(
        "plan, status, provider, access_ends_at, current_period_end, updated_at"
      )
      .eq("student_id", userId)
      .order("updated_at", { ascending: false }),
    attemptedQuestionIds
      ? Promise.resolve({ data: null, error: null })
      : admin.from("attempts").select("question_id").eq("user_id", userId),
  ]);

  if (profileResult.error) {
    throw new Error(
      `Unable to load profile access: ${profileResult.error.message}`
    );
  }
  if (subscriptionsResult.error) {
    throw new Error(
      `Unable to load subscription access: ${subscriptionsResult.error.message}`
    );
  }
  if (attemptsResult.error) {
    throw new Error(
      `Unable to load question usage: ${attemptsResult.error.message}`
    );
  }

  const attemptedIds = new Set<string>();
  if (attemptedQuestionIds) {
    for (const questionId of attemptedQuestionIds) attemptedIds.add(questionId);
  } else {
    for (const row of attemptsResult.data ?? []) {
      if (row.question_id) attemptedIds.add(String(row.question_id));
    }
  }

  const now = Date.now();
  const activeSubscription = (
    (subscriptionsResult.data ?? []) as SubscriptionRow[]
  ).find((subscription) => hasCurrentAccess(subscription, now));
  const isAdmin = profileResult.data?.role === "admin";
  const isPro = isAdmin || Boolean(activeSubscription);
  const uniqueQuestionsUsed = attemptedIds.size;

  if (isPro) {
    const planId = isAdmin && !activeSubscription ? "admin" : activeSubscription!.plan;
    return {
      tier: "pro",
      planId,
      planLabel: isAdmin && !activeSubscription ? "Pro · Admin" : planLabel(planId),
      isPro: true,
      uniqueQuestionsUsed,
      questionLimit: null,
      remainingQuestions: null,
      canAccessNewQuestion: true,
      accessEndsAt:
        activeSubscription?.access_ends_at ??
        activeSubscription?.current_period_end ??
        null,
      provider: activeSubscription?.provider ?? (isAdmin ? "admin" : null),
    };
  }

  const remainingQuestions = Math.max(
    0,
    FREE_QUESTION_LIMIT - uniqueQuestionsUsed
  );
  return {
    tier: "free",
    planId: "free",
    planLabel: "Free",
    isPro: false,
    uniqueQuestionsUsed,
    questionLimit: FREE_QUESTION_LIMIT,
    remainingQuestions,
    canAccessNewQuestion: remainingQuestions > 0,
    accessEndsAt: null,
    provider: null,
  };
}

export const getCurrentQuestionAccess = cache(
  async (): Promise<QuestionAccess> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        tier: "free",
        planId: "free",
        planLabel: "Free",
        isPro: false,
        uniqueQuestionsUsed: 0,
        questionLimit: FREE_QUESTION_LIMIT,
        remainingQuestions: FREE_QUESTION_LIMIT,
        canAccessNewQuestion: true,
        accessEndsAt: null,
        provider: null,
      };
    }

    return getQuestionAccessForUser(user.id);
  }
);

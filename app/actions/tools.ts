"use server";

import { revalidatePath } from "next/cache";
import type { Question } from "@/app/actions";
import {
  requireAdmin,
} from "@/app/actions/bootcamp";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeQuestion, QUESTION_SELECT } from "@/lib/questions";
import {
  MATH_DOMAINS,
  READING_DOMAINS,
  type SubjectFilter,
  type TierFilter,
} from "@/lib/subjects";

export type PlaygroundQuestionOption = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
  questionType: "multiple_choice" | "grid_in" | null;
  stem: string;
  verified: boolean;
};

export type ExplainerStatus = {
  count: number;
  latestRecordedAt: string | null;
};

export type QuestionReviewState = {
  verified: boolean;
};

export type SandboxIssueType =
  | "issue_with_explanation"
  | "wrong_answer_marked_correct"
  | "explanation_incorrect"
  | "formatting_display_issue"
  | "other";

export type FeedbackQueueEntry = {
  questionId: string;
  issueType: SandboxIssueType;
  notes: string | null;
  createdAt: string | null;
  reporter: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  question: {
    question_id: string;
    domain: string | null;
    skill: string | null;
    tier: number | null;
    stem: string;
    verified: boolean;
  } | null;
};

export async function listPlaygroundQuestions(params: {
  subject?: SubjectFilter;
  domain?: string;
  tier?: TierFilter;
  reviewState?: "all" | "verified" | "unverified";
}): Promise<PlaygroundQuestionOption[]> {
  await requireAdmin();
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("questions")
    .select("question_id, domain, skill, tier, question_type, stem, verified")
    .not("correct_answer", "is", null)
    .not("stem", "is", null)
    .limit(250);

  if (params.reviewState === "verified") {
    query = query.eq("verified", true).order("created_at", { ascending: false });
  } else if (params.reviewState === "unverified") {
    query = query.eq("verified", false).order("created_at", { ascending: false });
  } else {
    query = query
      .order("verified", { ascending: true })
      .order("created_at", { ascending: false });
  }

  if (params.tier && params.tier !== "all") {
    query = query.eq("tier", params.tier);
  }
  if (params.domain && params.domain !== "all") {
    query = query.eq("domain", params.domain);
  } else if (params.subject === "math") {
    query = query.in("domain", [...MATH_DOMAINS]);
  } else if (params.subject === "reading_writing") {
    query = query.in("domain", [...READING_DOMAINS]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listPlaygroundQuestions error:", error);
    return [];
  }

  return (data ?? []).map((question: Record<string, unknown>) => ({
    question_id: question.question_id as string,
    domain: (question.domain as string | null) ?? null,
    skill: (question.skill as string | null) ?? null,
    tier: question.tier == null ? null : Number(question.tier),
    questionType:
      question.question_type === "multiple_choice" || question.question_type === "grid_in"
        ? (question.question_type as "multiple_choice" | "grid_in")
        : null,
    stem: (question.stem as string) ?? "",
    verified: question.verified === true,
  }));
}

export async function getQuestionReviewBacklogCount(): Promise<number> {
  await requireAdmin();
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("questions")
    .select("question_id", { count: "exact", head: true })
    .eq("verified", false)
    .not("correct_answer", "is", null)
    .not("stem", "is", null);

  if (error) {
    console.error("getQuestionReviewBacklogCount error:", error);
    return 0;
  }

  return count ?? 0;
}

export async function getPlaygroundQuestion(
  questionId: string
): Promise<Question | null> {
  await requireAdmin();
  const id = questionId.trim();
  if (!id) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .select(QUESTION_SELECT)
    .ilike("question_id", id)
    .maybeSingle();

  if (error) {
    console.error("getPlaygroundQuestion error:", error);
    return null;
  }
  if (data) return normalizeQuestion(data as Record<string, unknown>);

  const { data: prefixMatches, error: prefixError } = await admin
    .from("questions")
    .select(QUESTION_SELECT)
    .ilike("question_id", `${id}%`)
    .limit(2);

  if (prefixError) {
    console.error("getPlaygroundQuestion prefix error:", prefixError);
    return null;
  }
  return prefixMatches?.length === 1
    ? normalizeQuestion(prefixMatches[0] as Record<string, unknown>)
    : null;
}

export async function getExplainerStatus(
  questionId: string
): Promise<ExplainerStatus> {
  await requireAdmin();
  const id = questionId.trim();
  if (!id) return { count: 0, latestRecordedAt: null };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("explainers")
    .select("recorded_at")
    .eq("question_id", id)
    .order("recorded_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getExplainerStatus error:", error);
    return { count: 0, latestRecordedAt: null };
  }

  const rows = data ?? [];
  return {
    count: rows.length,
    latestRecordedAt: rows[0]?.recorded_at
      ? String(rows[0].recorded_at)
      : null,
  };
}

export async function getQuestionReviewState(
  questionId: string
): Promise<QuestionReviewState> {
  await requireAdmin();
  const id = questionId.trim();
  if (!id) return { verified: false };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .select("verified")
    .eq("question_id", id)
    .maybeSingle();

  if (error) {
    console.error("getQuestionReviewState error:", error);
    return { verified: false };
  }

  return {
    verified: data?.verified === true,
  };
}

export async function markQuestionExplained(
  questionId: string
): Promise<
  | { ok: true; recordedAt: string }
  | { ok: false; error: string }
> {
  try {
    const { userId } = await requireAdmin();
    const id = questionId.trim();
    if (!id) return { ok: false, error: "Question id is required." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("explainers")
      .insert({
        question_id: id,
        created_by: userId,
        recorded_at: new Date().toISOString(),
      })
      .select("recorded_at")
      .single();

    if (error || !data) {
      console.error("markQuestionExplained error:", error);
      return {
        ok: false,
        error: error?.message || "Could not mark question as explained.",
      };
    }

    revalidatePath("/admin/playground");
    revalidatePath("/admin/sandbox");
    revalidatePath("/admin/tools");
    return { ok: true, recordedAt: String(data.recorded_at) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return { ok: false, error: message };
  }
}

export async function markQuestionVerified(
  questionId: string
): Promise<
  | { ok: true; verified: true }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const id = questionId.trim();
    if (!id) return { ok: false, error: "Question id is required." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("questions")
      .update({
        verified: true,
      })
      .eq("question_id", id)
      .select("verified")
      .maybeSingle();

    if (error || data?.verified !== true) {
      console.error("markQuestionVerified error:", error);
      return {
        ok: false,
        error: error?.message || "Could not mark question as verified.",
      };
    }

    revalidatePath("/admin/sandbox");
    revalidatePath("/admin/playground");
    revalidatePath("/admin/generate-questions");
    revalidatePath("/admin/feedback");
    revalidatePath("/admin/tools");
    revalidatePath("/admin/skills");
    return { ok: true, verified: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return { ok: false, error: message };
  }
}

export async function submitAdminQuestionFeedback(params: {
  questionId: string;
  issueType: SandboxIssueType;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await requireAdmin();
    const id = params.questionId.trim();
    if (!id) return { ok: false, error: "Question id is required." };

    const notes = params.notes?.trim() ? params.notes.trim() : null;
    const admin = createAdminClient();
    const { error } = await admin.from("feedback").insert({
      question_id: id,
      user_id: userId,
      issue_type: params.issueType,
      notes,
    });

    if (error) {
      console.error("submitAdminQuestionFeedback error:", error);
      return {
        ok: false,
        error: error.message || "Could not submit feedback.",
      };
    }

    revalidatePath("/admin/feedback");
    revalidatePath("/admin/sandbox");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return { ok: false, error: message };
  }
}

export async function listFeedbackQueue(): Promise<FeedbackQueueEntry[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .select("question_id, user_id, issue_type, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("listFeedbackQueue error:", error);
    return [];
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const questionIds = [
    ...new Set(
      rows
        .map((row) => (typeof row.question_id === "string" ? row.question_id : ""))
        .filter(Boolean)
    ),
  ];
  const userIds = [
    ...new Set(
      rows
        .map((row) => (typeof row.user_id === "string" ? row.user_id : ""))
        .filter(Boolean)
    ),
  ];

  const [{ data: questions, error: questionError }, { data: profiles, error: profileError }] =
    await Promise.all([
      questionIds.length
        ? admin
            .from("questions")
            .select("question_id, domain, skill, tier, stem, verified")
            .in("question_id", questionIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? admin
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (questionError) {
    console.error("listFeedbackQueue questions error:", questionError);
  }
  if (profileError) {
    console.error("listFeedbackQueue profiles error:", profileError);
  }

  const questionById = new Map(
    (questions ?? []).map((question) => [
      String(question.question_id),
      {
        question_id: String(question.question_id),
        domain: (question.domain as string | null) ?? null,
        skill: (question.skill as string | null) ?? null,
        tier: question.tier == null ? null : Number(question.tier),
        stem: (question.stem as string) ?? "",
        verified: question.verified === true,
      },
    ])
  );

  const reporterById = new Map(
    (profiles ?? []).map((profile) => [
      String(profile.id),
      {
        id: String(profile.id),
        fullName: (profile.full_name as string | null) ?? null,
        email: (profile.email as string | null) ?? null,
      },
    ])
  );

  return rows.map((row) => ({
    questionId: String(row.question_id),
    issueType: (row.issue_type as SandboxIssueType) ?? "other",
    notes: (row.notes as string | null) ?? null,
    createdAt: (row.created_at as string | null) ?? null,
    reporter: reporterById.get(String(row.user_id)) ?? null,
    question: questionById.get(String(row.question_id)) ?? null,
  }));
}

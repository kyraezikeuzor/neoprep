"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/app/actions";
import {
  getPlaygroundQuestion,
  getQuestionReviewBacklogCount,
  getQuestionReviewState,
  listPlaygroundQuestions,
  markQuestionVerified,
  submitAdminQuestionFeedback,
  type PlaygroundQuestionOption,
  type QuestionReviewState,
  type SandboxIssueType,
} from "@/app/actions/tools";
import StagingReviewModal from "@/components/admin/StagingReviewModal";
import StagingPracticeReview from "@/components/admin/StagingPracticeReview";
import {
  MATH_DOMAINS,
  READING_DOMAINS,
  type TierFilter,
} from "@/lib/subjects";

type ReviewStatusFilter = "unverified" | "verified" | "all";

const EMPTY_REVIEW_STATE: QuestionReviewState = {
  verified: false,
};

const DOMAIN_OPTIONS = [
  { value: "all", label: "All domains" },
  ...READING_DOMAINS.map((domain) => ({ value: domain, label: domain })),
  ...MATH_DOMAINS.map((domain) => ({ value: domain, label: domain })),
];

function truncate(text: string, max = 110): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function formatTierLabel(tier: number | null): string {
  return tier != null ? `Tier ${tier}` : "—";
}

function formatQuestionTypeLabel(
  questionType: PlaygroundQuestionOption["questionType"]
): string {
  if (questionType === "multiple_choice") return "Multiple choice";
  if (questionType === "grid_in") return "Grid in";
  return "Unknown";
}

function formatStatusLabel(status: ReviewStatusFilter): string {
  if (status === "unverified") return "Needs review";
  if (status === "verified") return "Verified";
  return "All statuses";
}

function questionToRow(question: Question, verified: boolean): PlaygroundQuestionOption {
  return {
    question_id: question.question_id,
    domain: question.domain,
    skill: question.skill,
    tier: question.tier,
    questionType: question.choices ? "multiple_choice" : "grid_in",
    stem: question.stem,
    verified,
  };
}

function upsertRow(
  rows: PlaygroundQuestionOption[],
  question: Question,
  verified: boolean
): PlaygroundQuestionOption[] {
  const next = rows.filter((row) => row.question_id !== question.question_id);
  return [questionToRow(question, verified), ...next];
}

function rowMatchesFilters(
  row: PlaygroundQuestionOption,
  domain: string,
  tier: TierFilter,
  status: ReviewStatusFilter
): boolean {
  if (domain !== "all" && row.domain !== domain) return false;
  if (tier !== "all" && row.tier !== tier) return false;
  if (status === "verified" && !row.verified) return false;
  if (status === "unverified" && row.verified) return false;
  return true;
}

export default function StagingReview({
  initialRows,
  initialBacklogCount,
  initialReviewQuestionId = "",
  initialDomain = "all",
  initialTier = "all",
  initialStatus = "unverified",
  reviewMode = false,
  sessionLength,
}: {
  initialRows: PlaygroundQuestionOption[];
  initialBacklogCount: number;
  initialReviewQuestionId?: string;
  initialDomain?: string;
  initialTier?: TierFilter;
  initialStatus?: ReviewStatusFilter;
  /** Show one focused question instead of the legacy table queue. */
  reviewMode?: boolean;
  sessionLength?: number;
}) {
  const router = useRouter();
  const [domain, setDomain] = useState(initialDomain);
  const [tier, setTier] = useState<TierFilter>(initialTier);
  const [status, setStatus] = useState<ReviewStatusFilter>(initialStatus);
  const [rows, setRows] = useState<PlaygroundQuestionOption[]>(initialRows);
  const [backlogCount, setBacklogCount] = useState(initialBacklogCount);
  const [pageError, setPageError] = useState("");
  const [pageFeedback, setPageFeedback] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalQuestion, setModalQuestion] = useState<Question | null>(null);
  const [modalReviewState, setModalReviewState] =
    useState<QuestionReviewState>(EMPTY_REVIEW_STATE);
  const [modalQuestionId, setModalQuestionId] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [modalError, setModalError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [issueType, setIssueType] = useState<SandboxIssueType>("other");
  const [notes, setNotes] = useState("");
  const [filtersPending, startFiltersTransition] = useTransition();
  const [approving, startApprovingTransition] = useTransition();
  const [rejecting, startRejectingTransition] = useTransition();
  const tableRequestVersion = useRef(0);
  const modalRequestVersion = useRef(0);
  const openedInitialQuestion = useRef(false);

  const visibleRows = rows.filter((row) =>
    rowMatchesFilters(row, domain, tier, status)
  );
  const reviewQueue = reviewMode ? rows : [];

  function goToReviewIndex(index: number) {
    const row = reviewQueue[index];
    if (!row) return;
    setReviewIndex(index);
    void openReview(row.question_id);
  }

  function finishCurrentReview() {
    if (reviewIndex < reviewQueue.length - 1) {
      goToReviewIndex(reviewIndex + 1);
    } else {
      router.push("/admin/sandbox");
    }
  }

  async function fetchQuestionState(questionId: string): Promise<{
    question: Question | null;
    reviewState: QuestionReviewState;
  }> {
    const [question, reviewState] = await Promise.all([
      getPlaygroundQuestion(questionId),
      getQuestionReviewState(questionId),
    ]);

    return { question, reviewState };
  }

  function closeModal() {
    setModalOpen(false);
    setRejectOpen(false);
    setIssueType("other");
    setNotes("");
    setModalError("");
    if (reviewMode) router.push("/admin/sandbox");
  }

  async function openReview(questionId: string) {
    const id = questionId.trim();
    if (!id) return;

    const currentRequest = ++modalRequestVersion.current;
    setModalOpen(true);
    setModalLoading(true);
    setModalQuestionId(id);
    setModalQuestion(null);
    setModalError("");
    setRejectOpen(false);
    setIssueType("other");
    setNotes("");
    setPageError("");
    setPageFeedback("");

    const next = await fetchQuestionState(id);
    if (currentRequest !== modalRequestVersion.current) return;

    setModalLoading(false);
    if (!next.question) {
      setModalReviewState(EMPTY_REVIEW_STATE);
      setModalError(`No question found for ID “${id}”.`);
      return;
    }

    setModalQuestion(next.question);
    setModalReviewState(next.reviewState);
    setRows((prev) => upsertRow(prev, next.question!, next.reviewState.verified));
  }

  function refreshRows(
    nextDomain: string,
    nextTier: TierFilter,
    nextStatus: ReviewStatusFilter
  ) {
    startFiltersTransition(async () => {
      const currentRequest = ++tableRequestVersion.current;
      setPageError("");
      setPageFeedback("");

      const [nextRows, nextBacklogCount] = await Promise.all([
        listPlaygroundQuestions({
          domain: nextDomain,
          tier: nextTier,
          reviewState: nextStatus,
        }),
        getQuestionReviewBacklogCount(),
      ]);
      if (currentRequest !== tableRequestVersion.current) return;

      setRows(nextRows);
      setBacklogCount(nextBacklogCount);
    });
  }

  useEffect(() => {
    if (openedInitialQuestion.current) return;
    openedInitialQuestion.current = true;
    const questionId = initialReviewQuestionId || (reviewMode ? initialRows[0]?.question_id : "");
    if (questionId) {
      void openReview(questionId);
    } else if (reviewMode) {
      setModalError("No questions match these filters.");
    }
  }, [initialReviewQuestionId, initialRows, reviewMode]);

  return (
    <>
      {!reviewMode ? <div className="mt-8 space-y-6">
        <section className="arc-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="arc-card-label">Backlog</p>
              <h2 className="mt-1 font-sans text-xl font-semibold text-arc-ink">
                {backlogCount} question{backlogCount === 1 ? "" : "s"} need review
              </h2>
              <p className="mt-2 text-sm text-arc-muted">
                Showing {visibleRows.length} row{visibleRows.length === 1 ? "" : "s"} for{" "}
                {formatStatusLabel(status).toLowerCase()}.
              </p>
            </div>

            <Link
              href="/admin/feedback"
              className="rounded-full border border-arc-line px-4 py-2 text-sm font-medium text-arc-accent transition hover:bg-[#F8FBFF]"
            >
              Open Feedback
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="font-sans text-xs font-medium text-arc-muted">
                Topic / Domain
              </span>
              <select
                value={domain}
                onChange={(event) => {
                  const nextDomain = event.target.value;
                  setDomain(nextDomain);
                  refreshRows(nextDomain, tier, status);
                }}
                className="mt-1 block w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
              >
                {DOMAIN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-sans text-xs font-medium text-arc-muted">Difficulty</span>
              <select
                value={String(tier)}
                onChange={(event) => {
                  const value = event.target.value;
                  const nextTier = value === "all" ? "all" : (Number(value) as 1 | 2 | 3);
                  setTier(nextTier);
                  refreshRows(domain, nextTier, status);
                }}
                className="mt-1 block w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
              >
                <option value="all">All difficulties</option>
                <option value="1">Easy</option>
                <option value="2">Medium</option>
                <option value="3">Hard</option>
              </select>
            </label>

            <label className="block">
              <span className="font-sans text-xs font-medium text-arc-muted">Status</span>
              <select
                value={status}
                onChange={(event) => {
                  const nextStatus = event.target.value as ReviewStatusFilter;
                  setStatus(nextStatus);
                  refreshRows(domain, tier, nextStatus);
                }}
                className="mt-1 block w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
              >
                <option value="unverified">Needs review</option>
                <option value="verified">Verified</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>

          {filtersPending ? (
            <p className="mt-4 text-sm text-arc-muted">Refreshing review queue…</p>
          ) : null}
          {pageError ? <p className="mt-4 text-sm text-arc-incorrect">{pageError}</p> : null}
          {!pageError && pageFeedback ? (
            <p className="mt-4 text-sm text-[#15803D]">{pageFeedback}</p>
          ) : null}
        </section>

        <section className="arc-card overflow-hidden">
          <div className="border-b border-arc-line px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="arc-card-label">Queue</p>
                <p className="mt-1 font-sans text-base font-medium text-arc-heading">
                  Review questions in a modal without leaving the table
                </p>
              </div>
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <div className="px-5 py-10 text-center sm:px-6">
              <p className="font-sans text-sm text-arc-muted">
                No questions match the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#F9FAFB]">
                  <tr className="arc-card-label">
                    <th className="px-4 py-3 sm:px-6">Question ID</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Skill</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Question type</th>
                    <th className="px-4 py-3">Stem preview</th>
                    <th className="px-4 py-3 text-right sm:px-6">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-line">
                  {visibleRows.map((row) => (
                    <tr key={row.question_id} className="align-top">
                      <td className="px-4 py-4 font-mono text-xs text-arc-muted sm:px-6">
                        {row.question_id}
                      </td>
                      <td className="px-4 py-4 font-sans text-sm text-arc-heading">
                        {row.domain || "—"}
                      </td>
                      <td className="px-4 py-4 font-sans text-sm text-arc-heading">
                        {row.skill || "—"}
                      </td>
                      <td className="px-4 py-4 font-sans text-sm text-arc-heading">
                        {formatTierLabel(row.tier)}
                      </td>
                      <td className="px-4 py-4 font-sans text-sm text-arc-heading">
                        {formatQuestionTypeLabel(row.questionType)}
                      </td>
                      <td className="max-w-[28rem] px-4 py-4 font-sans text-sm text-arc-muted">
                        {truncate(row.stem)}
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => void openReview(row.question_id)}
                          className="rounded-lg border border-arc-line bg-white px-3 py-2 text-sm font-medium text-arc-accent transition hover:bg-[#F8FBFF]"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div> : null}

      {reviewMode ? <StagingPracticeReview
        question={modalQuestion}
        reviewState={modalReviewState}
        loading={modalLoading}
        approving={approving}
        rejecting={rejecting}
        rejectOpen={rejectOpen}
        issueType={issueType}
        notes={notes}
        error={modalError}
        onExit={closeModal}
        reviewIndex={reviewIndex}
        reviewCount={reviewQueue.length}
        reviewQueue={reviewQueue}
        onPrevious={() => goToReviewIndex(reviewIndex - 1)}
        onNext={() => goToReviewIndex(reviewIndex + 1)}
        onJumpTo={goToReviewIndex}
        onApprove={() =>
          startApprovingTransition(async () => {
            if (!modalQuestion) return;
            setModalError("");

            const result = await markQuestionVerified(modalQuestion.question_id);
            if (!result.ok) {
              setModalError(result.error);
              return;
            }

            setRows((prev) =>
              prev.map((row) =>
                row.question_id === modalQuestion.question_id
                  ? { ...row, verified: true }
                  : row
              )
            );
            if (!modalReviewState.verified) {
              setBacklogCount((prev) => Math.max(0, prev - 1));
            }
            setPageFeedback("Question approved.");
            finishCurrentReview();
          })
        }
        onRejectOpen={() => {
          setRejectOpen(true);
          setModalError("");
        }}
        onRejectCancel={() => {
          setRejectOpen(false);
          setIssueType("other");
          setNotes("");
        }}
        onIssueTypeChange={setIssueType}
        onNotesChange={setNotes}
        onRejectSubmit={() =>
          startRejectingTransition(async () => {
            if (!modalQuestion) return;
            setModalError("");

            const result = await submitAdminQuestionFeedback({
              questionId: modalQuestion.question_id,
              issueType,
              notes,
            });
            if (!result.ok) {
              setModalError(result.error);
              return;
            }

            setPageFeedback("Question sent to feedback.");
            finishCurrentReview();
          })
        }
      /> : <StagingReviewModal
        open={modalOpen}
        question={modalQuestion}
        reviewState={modalReviewState}
        loading={modalLoading}
        approving={approving}
        rejecting={rejecting}
        rejectOpen={rejectOpen}
        issueType={issueType}
        notes={notes}
        error={modalError}
        onClose={closeModal}
        onApprove={() =>
          startApprovingTransition(async () => {
            if (!modalQuestion) return;
            setModalError("");
            const result = await markQuestionVerified(modalQuestion.question_id);
            if (!result.ok) { setModalError(result.error); return; }
            setRows((prev) => prev.map((row) => row.question_id === modalQuestion.question_id ? { ...row, verified: true } : row));
            if (!modalReviewState.verified) setBacklogCount((prev) => Math.max(0, prev - 1));
            setPageFeedback("Question approved.");
            closeModal();
          })
        }
        onRejectOpen={() => { setRejectOpen(true); setModalError(""); }}
        onRejectCancel={() => { setRejectOpen(false); setIssueType("other"); setNotes(""); }}
        onIssueTypeChange={setIssueType}
        onNotesChange={setNotes}
        onRejectSubmit={() =>
          startRejectingTransition(async () => {
            if (!modalQuestion) return;
            setModalError("");
            const result = await submitAdminQuestionFeedback({ questionId: modalQuestion.question_id, issueType, notes });
            if (!result.ok) { setModalError(result.error); return; }
            setPageFeedback("Question sent to feedback.");
            closeModal();
          })
        }
      />}
    </>
  );
}

"use client";

import { useEffect, useId, type ReactNode } from "react";
import type { Question } from "@/app/actions";
import type { QuestionReviewState, SandboxIssueType } from "@/app/actions/tools";
import MathText from "@/components/MathText";
import GraphRenderer, { type GraphSpec } from "@/components/graphs/GraphRenderer";
import { getExplanationDisplay } from "./StagingPracticeReview";

function normalizeAnswerKey(value: string): string {
  return value.trim().toUpperCase();
}

function isCorrectChoice(letter: string, correctAnswer: string): boolean {
  return normalizeAnswerKey(letter) === normalizeAnswerKey(correctAnswer);
}

function getCorrectAnswerLabel(question: Question): string {
  if (!question.choices) return question.correct_answer;

  const direct = question.choices[question.correct_answer];
  if (direct) return `${question.correct_answer}. ${direct}`;

  const upper = normalizeAnswerKey(question.correct_answer);
  const next = question.choices[upper];
  if (next) return `${upper}. ${next}`;

  return question.correct_answer;
}

function getQuestionTypeLabel(question: Question): string {
  return question.choices ? "Multiple choice" : "Grid in";
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-arc-line bg-[#FAFAFA] px-3 py-1 text-xs font-medium text-arc-muted">
      {label}
    </span>
  );
}

function ColumnCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-arc-line bg-[#FAFAFA] p-4">
      <p className="arc-card-label">{label}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function StagingReviewModal({
  open,
  question,
  reviewState,
  loading,
  approving,
  rejecting,
  rejectOpen,
  issueType,
  notes,
  error,
  onClose,
  onApprove,
  onRejectOpen,
  onRejectCancel,
  onIssueTypeChange,
  onNotesChange,
  onRejectSubmit,
  inline = false,
}: {
  open: boolean;
  question: Question | null;
  reviewState: QuestionReviewState;
  loading: boolean;
  approving: boolean;
  rejecting: boolean;
  rejectOpen: boolean;
  issueType: SandboxIssueType;
  notes: string;
  error: string;
  onClose: () => void;
  onApprove: () => void;
  onRejectOpen: () => void;
  onRejectCancel: () => void;
  onIssueTypeChange: (value: SandboxIssueType) => void;
  onNotesChange: (value: string) => void;
  onRejectSubmit: () => void;
  /** Render as the dedicated review page instead of a dialog. */
  inline?: boolean;
}) {
  const titleId = useId();
  const closeDisabled = approving || rejecting;
  const explanation = getExplanationDisplay(question?.rationale);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !closeDisabled) onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeDisabled, onClose]);

  if (!open) return null;

  return (
    <div className={inline ? "mt-8" : "fixed inset-0 z-[70] flex items-center justify-center p-4"}>
      {!inline ? (
        <button
          type="button"
          aria-label="Close review dialog"
          className="absolute inset-0 bg-arc-ink/35"
          onClick={() => !closeDisabled && onClose()}
        />
      ) : null}

      <div
        role="dialog"
        aria-modal={inline ? undefined : "true"}
        aria-labelledby={titleId}
        className={`relative ${inline ? "" : "z-10"} flex w-full ${inline ? "" : "max-w-7xl"} flex-col overflow-hidden rounded-[28px] border border-arc-line bg-white ${inline ? "" : "shadow-[0_20px_60px_rgba(15,23,42,0.18)]"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-arc-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="font-sans text-lg font-semibold text-arc-ink">
              Review Question
            </h2>
            {question ? (
              <>
                <p className="mt-1 font-mono text-xs text-arc-muted">{question.question_id}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.domain ? <MetaPill label={question.domain} /> : null}
                  {question.skill ? <MetaPill label={question.skill} /> : null}
                  {question.tier != null ? <MetaPill label={`Tier ${question.tier}`} /> : null}
                  <MetaPill label={getQuestionTypeLabel(question)} />
                  <MetaPill label={reviewState.verified ? "Verified" : "Needs review"} />
                </div>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="rounded-lg border border-arc-line bg-white px-3 py-2 text-sm font-medium text-arc-heading transition hover:bg-arc-soft disabled:opacity-50"
          >
            {inline ? "Back to Editor" : "Close"}
          </button>
        </div>

        <div className={`${inline ? "" : "max-h-[70vh] overflow-y-auto"} px-5 py-5 sm:px-6`}>
          {loading ? (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-arc-line bg-[#FAFAFA]">
              <p className="font-sans text-sm text-arc-muted">Loading question…</p>
            </div>
          ) : question ? (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <ColumnCard label="Question">
                  <div className="space-y-4 text-sm leading-7 text-arc-heading">
                    {question.graph_spec ? (
                      <div className="overflow-hidden rounded-2xl border border-arc-line bg-white p-3">
                        <GraphRenderer spec={question.graph_spec as GraphSpec | null} />
                      </div>
                    ) : null}
                    <MathText text={question.stem || "(No question text)"} block />
                  </div>
                </ColumnCard>

                <ColumnCard label="Choices">
                  {question.choices ? (
                    <div className="space-y-3">
                      {Object.entries(question.choices).map(([letter, text]) => {
                        const correct = isCorrectChoice(letter, question.correct_answer);
                        return (
                          <div
                            key={letter}
                            className={`rounded-xl border px-4 py-3 ${
                              correct
                                ? "border-[#15803D] bg-[#F0FDF4]"
                                : "border-arc-line bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                                  correct
                                    ? "border-[#15803D] bg-[#15803D] text-white"
                                    : "border-[#D4D4D8] bg-white text-arc-heading"
                                }`}
                              >
                                {letter}
                              </div>
                              <div className="min-w-0 flex-1 text-sm leading-7 text-arc-heading">
                                <MathText text={text} block />
                                {correct ? (
                                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#15803D]">
                                    Correct answer
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#15803D] bg-[#F0FDF4] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#15803D]">
                        Correct answer
                      </p>
                      <p className="mt-2 font-sans text-base font-semibold text-arc-ink">
                        {getCorrectAnswerLabel(question)}
                      </p>
                    </div>
                  )}
                </ColumnCard>

              </div>

              <ColumnCard label="Explanation">
                <div className="text-sm leading-7 text-arc-heading">
                  {explanation.text ? (
                    <MathText text={explanation.text} block />
                  ) : (
                    <p className="text-arc-incorrect">{explanation.error}</p>
                  )}
                </div>
              </ColumnCard>

              {error ? (
                <p className="rounded-xl bg-arc-incorrectBg px-4 py-3 font-sans text-sm text-arc-incorrect">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-arc-line bg-[#FAFAFA]">
              <p className="font-sans text-sm text-arc-muted">
                This question could not be loaded.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-arc-line px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-arc-muted">
              {reviewState.verified
                ? "Already approved."
                : "Approve good questions or send problems to feedback."}
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onApprove}
                disabled={loading || approving || rejecting || !question || reviewState.verified}
                className="arc-btn-primary disabled:opacity-60"
              >
                {reviewState.verified
                  ? "Approved"
                  : approving
                    ? "Approving..."
                    : "Approve"}
              </button>
              <button
                type="button"
                onClick={onRejectOpen}
                disabled={loading || approving || rejecting || !question}
                className="rounded-lg border border-arc-line bg-white px-4 py-2.5 text-sm font-semibold text-arc-heading transition hover:bg-arc-soft disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>

          {rejectOpen ? (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Close rejection form"
                className="absolute inset-0 bg-arc-ink/35"
                onClick={onRejectCancel}
                disabled={rejecting}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Send question to feedback"
                className="relative z-10 w-full max-w-2xl rounded-3xl border border-arc-line bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-sans text-lg font-semibold text-arc-ink">
                      Reject question
                    </h3>
                    <p className="mt-1 text-sm text-arc-muted">
                      Send the issue to Feedback with enough detail to fix it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRejectCancel}
                    disabled={rejecting}
                    className="rounded-lg border border-arc-line bg-white px-3 py-2 text-sm font-medium text-arc-heading transition hover:bg-arc-soft disabled:opacity-50"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="font-sans text-xs font-medium text-arc-muted">Issue type</span>
                  <select
                    value={issueType}
                    onChange={(event) =>
                      onIssueTypeChange(event.target.value as SandboxIssueType)
                    }
                    className="mt-1 block w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
                  >
                    <option value="issue_with_explanation">Issue with explanation</option>
                    <option value="wrong_answer_marked_correct">
                      Wrong answer marked as correct
                    </option>
                    <option value="explanation_incorrect">Explanation is incorrect</option>
                    <option value="formatting_display_issue">Formatting/display issue</option>
                    <option value="other">Other issue</option>
                  </select>
                </label>

                <label className="block">
                  <span className="font-sans text-xs font-medium text-arc-muted">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(event) => onNotesChange(event.target.value)}
                    rows={3}
                    placeholder="Describe what needs to be fixed."
                    className="mt-1 w-full resize-y rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm text-arc-ink outline-none transition placeholder:text-arc-muted focus:border-arc-accent"
                  />
                </label>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={onRejectCancel}
                    disabled={rejecting}
                    className="rounded-lg border border-arc-line bg-white px-4 py-2.5 text-sm font-semibold text-arc-heading transition hover:bg-arc-soft disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onRejectSubmit}
                    disabled={rejecting || !question}
                    className="arc-btn-primary disabled:opacity-60"
                  >
                    {rejecting ? "Sending..." : "Send to feedback"}
                  </button>
                </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import type { Question } from "@/app/actions";
import type { PlaygroundQuestionOption, QuestionReviewState, SandboxIssueType } from "@/app/actions/tools";
import MathText from "@/components/MathText";
import GraphRenderer, { type GraphSpec } from "@/components/graphs/GraphRenderer";
import { splitRationaleByChoices } from "@/lib/explanations";
import { useState } from "react";

function normalize(value: string) {
  return value.trim().toUpperCase();
}

function splitStem(stem: string) {
  const blocks = stem.trim().split(/\n\n+/);
  const last = blocks.at(-1)?.trim() ?? stem;
  const before = blocks.slice(0, -1).join("\n\n").trim();
  const isQuestion = /^(Which|What|Based on|According to|As used|The author)/i.test(last);
  return before.length > 0 && isQuestion ? { stimulus: before, question: last } : { stimulus: null, question: stem };
}

function buildReviewPayload(question: Question) {
  return JSON.stringify(
    {
      task: "Review this SAT-style question. Decide whether it should be approved or rejected, and briefly identify any factual, mathematical, answer-key, ambiguity, or formatting issues.",
      question: {
        id: question.question_id,
        domain: question.domain,
        skill: question.skill,
        tier: question.tier,
        stem: question.stem,
        choices: question.choices,
        correctAnswer: question.correct_answer,
        explanation: question.rationale,
        graphSpec: question.graph_spec,
      },
    },
    null,
    2
  );
}

type ExplanationDisplay =
  | { text: string; error: null }
  | { text: null; error: string };

/**
 * The review screen must never render an AI request/response wrapper. The
 * normal path is the database rationale string, but this also safely handles
 * an accidentally supplied serialized review payload.
 */
export function getExplanationDisplay(value: unknown): ExplanationDisplay {
  if (typeof value !== "string" || !value.trim()) {
    return { text: null, error: "No explanation is available for this question yet." };
  }

  const text = value.trim();
  if (!text.startsWith("{")) return { text, error: null };

  try {
    const payload: unknown = JSON.parse(text);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Invalid review payload");
    }

    const record = payload as Record<string, unknown>;
    const question = record.question;
    const response = record.response;
    const result = record.result;
    const candidates = [
      record.explanation,
      question && typeof question === "object" && !Array.isArray(question)
        ? (question as Record<string, unknown>).explanation
        : null,
      response && typeof response === "object" && !Array.isArray(response)
        ? (response as Record<string, unknown>).explanation
        : null,
      result && typeof result === "object" && !Array.isArray(result)
        ? (result as Record<string, unknown>).explanation
        : null,
    ];
    const explanation = candidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" && candidate.trim().length > 0
    );

    if (explanation) return { text: explanation.trim(), error: null };
  } catch {
    // A JSON-looking value without a valid parsed explanation is not safe to display.
  }

  return {
    text: null,
    error: "The review payload did not include a usable explanation. Please reload the question or send it to feedback.",
  };
}

export default function StagingPracticeReview({
  question,
  reviewState,
  loading,
  approving,
  rejecting,
  rejectOpen,
  issueType,
  notes,
  error,
  onExit,
  onApprove,
  onRejectOpen,
  onRejectCancel,
  onIssueTypeChange,
  onNotesChange,
  onRejectSubmit,
  reviewIndex,
  reviewCount,
  reviewQueue,
  onPrevious,
  onNext,
  onJumpTo,
}: {
  question: Question | null;
  reviewState: QuestionReviewState;
  loading: boolean;
  approving: boolean;
  rejecting: boolean;
  rejectOpen: boolean;
  issueType: SandboxIssueType;
  notes: string;
  error: string;
  onExit: () => void;
  onApprove: () => void;
  onRejectOpen: () => void;
  onRejectCancel: () => void;
  onIssueTypeChange: (value: SandboxIssueType) => void;
  onNotesChange: (value: string) => void;
  onRejectSubmit: () => void;
  reviewIndex: number;
  reviewCount: number;
  reviewQueue: PlaygroundQuestionOption[];
  onPrevious: () => void;
  onNext: () => void;
  onJumpTo: (index: number) => void;
}) {
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const split = question ? splitStem(question.stem) : null;
  const hasLeftPane = Boolean(split?.stimulus || question?.graph_spec);
  const explanation = getExplanationDisplay(question?.rationale);

  async function copyForReview() {
    if (!question) return;
    await navigator.clipboard.writeText(buildReviewPayload(question));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <header className="shrink-0 px-3 pt-2 sm:px-6 md:px-8">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-arc-line pb-1.5 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button type="button" onClick={onExit} className="rounded-lg bg-arc-ink px-3.5 py-1.5 font-sans text-sm font-semibold text-white transition hover:bg-[#2D2D2D]">
              Exit
            </button>
            <span className="inline-flex rounded-full bg-arc-soft px-3 py-1.5 font-sans text-sm text-arc-heading">Editor review</span>
            {question?.tier != null ? <span className="hidden rounded-full bg-arc-soft px-3 py-1.5 font-sans text-sm text-arc-heading sm:inline-flex">Tier {question.tier}</span> : null}
          </div>
          <p className="hidden justify-self-center font-sans text-sm font-medium text-arc-muted sm:block">Review mode</p>
          <div className="flex items-center justify-self-end gap-2">
            {reviewState.verified ? <span className="rounded-full border border-[#15803D] bg-[#F0FDF4] px-3 py-1.5 text-xs font-semibold text-[#15803D]">Approved</span> : null}
            <button type="button" onClick={copyForReview} disabled={!question} className="rounded-lg border border-arc-line bg-white px-3 py-1.5 font-sans text-sm font-semibold text-arc-heading transition hover:bg-arc-soft disabled:opacity-40">
              {copied ? "Copied" : "Copy for AI"}
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center"><p className="text-sm text-arc-muted">Loading question…</p></div>
      ) : !question ? (
        <div className="flex flex-1 items-center justify-center"><p className="text-sm text-arc-muted">{error || "This question could not be loaded."}</p></div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {hasLeftPane ? <>
            <section className="min-h-0 max-h-[42%] w-full shrink-0 overflow-y-auto border-b border-arc-line px-4 py-4 sm:px-6 sm:py-5 md:max-h-none md:w-1/2 md:border-b-0 md:px-8 md:py-7 lg:px-10 lg:py-8">
              <div className="question-prose mx-auto max-w-xl">
                {question.graph_spec ? <div className="mb-5"><GraphRenderer spec={question.graph_spec as GraphSpec | null} /></div> : null}
                {split?.stimulus ? <MathText text={split.stimulus} className="math-text" /> : null}
              </div>
            </section>
            <div className="relative z-10 hidden w-0 shrink-0 items-center justify-center md:flex" aria-hidden>
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-arc-line" />
              <div className="relative grid grid-cols-2 gap-0.5 rounded-sm bg-white px-1 py-1.5 text-[#9CA3AF]">{Array.from({ length: 6 }).map((_, index) => <span key={index} className="block h-0.5 w-0.5 rounded-full bg-current" />)}</div>
            </div>
          </> : null}

          <section className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${hasLeftPane ? "md:w-1/2 md:flex-none" : "w-full"}`}>
            <div className="shrink-0 px-4 pt-3 sm:px-6">
              <div className="flex h-9 items-center overflow-hidden rounded-lg bg-[#F9FAFB]">
                <span className="flex aspect-square h-full items-center justify-center bg-arc-ink font-sans text-sm font-semibold text-white">1</span>
                <div className="flex flex-1 items-center justify-between px-3">
                  <span className="font-sans text-sm text-[#5A5A5A]">Review question</span>
                  <span className="font-mono text-xs text-arc-muted">{question.question_id}</span>
                </div>
                <span className="flex aspect-square h-full items-center justify-center bg-arc-ink text-sm text-white">✓</span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-6 sm:pt-5 md:px-8 md:pt-6">
              <div className={`mx-auto w-full ${hasLeftPane ? "max-w-xl" : "max-w-2xl"}`}>
                <div className="question-prose mb-6"><MathText text={split?.question ?? question.stem} className="math-text" /></div>
                {question.choices ? <div className="space-y-2.5">
                  {Object.entries(question.choices).map(([letter, text]) => {
                    const correct = normalize(letter) === normalize(question.correct_answer);
                    return <div key={letter} className={`question-prose choice-text flex items-center gap-3 rounded-2xl border px-4 py-3 ${correct ? "border-arc-correct bg-arc-correctBg" : "border-arc-muted/30 bg-white opacity-60"}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-sans text-sm font-semibold ${correct ? "border-arc-correct bg-arc-correct text-white" : "border-arc-muted/40 text-arc-ink/50"}`}>{letter}</span>
                      <MathText text={text} className="math-text min-w-0 flex-1" />
                      {correct ? <span className="text-xs font-semibold uppercase tracking-[0.12em] text-arc-correct">Correct</span> : null}
                    </div>;
                  })}
                </div> : <div className="rounded-2xl border border-arc-correct bg-arc-correctBg px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-arc-correct">Correct answer</p><p className="mt-1 font-sans text-lg font-semibold text-arc-ink">{question.correct_answer}</p></div>}
                <section className="mt-6 font-sans">
                  {explanation.text ? (
                    <>
                      <p className="mb-3 text-sm font-semibold text-arc-ink">Step-by-step explanation</p>
                      <div className="space-y-4">
                        {splitRationaleByChoices(explanation.text).map((line, index) => (
                          <MathText key={`${index}-${line.slice(0, 24)}`} text={line} block className="font-sans text-base font-normal leading-relaxed text-arc-ink" />
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-arc-incorrect">{explanation.error}</p>
                  )}
                </section>
                {error ? <p className="mt-4 rounded-xl bg-arc-incorrectBg px-4 py-3 text-sm text-arc-incorrect">{error}</p> : null}
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="z-20 shrink-0 border-t border-arc-line bg-white px-3 py-3 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-2">
          <div className="justify-self-center sm:justify-self-start">
            <button type="button" onClick={() => setOverviewOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-arc-ink px-3.5 py-2 font-sans text-sm font-semibold tabular-nums text-white transition hover:bg-[#2D2D2D] sm:px-4">
              {Math.min(reviewIndex + 1, reviewCount)} of {reviewCount}
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 7.5L10 12l4.5-4.5" /></svg>
            </button>
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
            <button type="button" onClick={onPrevious} disabled={loading || reviewIndex === 0} className="arc-btn-secondary min-w-[calc(50%-0.25rem)] flex-1 rounded-lg px-4 py-3 text-base disabled:opacity-40 sm:min-w-0 sm:flex-none sm:px-6">Back</button>
            <button type="button" onClick={onRejectOpen} disabled={loading || rejecting || !question} className="arc-btn-secondary min-w-[calc(50%-0.25rem)] flex-1 rounded-lg px-4 py-3 text-base disabled:opacity-40 sm:min-w-0 sm:flex-none sm:px-6">Reject</button>
            <button type="button" onClick={onApprove} disabled={loading || approving || rejecting || !question || reviewState.verified} className="arc-btn-primary min-w-[calc(50%-0.25rem)] flex-1 rounded-lg px-4 py-3 text-base disabled:opacity-40 sm:min-w-0 sm:flex-none sm:px-8">{reviewState.verified ? "Approved" : approving ? "Approving..." : "Approve"}</button>
            <button type="button" onClick={onNext} disabled={loading || reviewIndex >= reviewQueue.length - 1} className="arc-btn-secondary min-w-[calc(50%-0.25rem)] flex-1 rounded-lg px-4 py-3 text-base disabled:opacity-40 sm:min-w-0 sm:flex-none sm:px-6">Next</button>
          </div>
          <div className="hidden text-right text-xs text-arc-muted sm:block sm:text-sm"><p>{question?.domain || "Domain"}</p><p>{question?.skill || "Skill"}</p></div>
        </div>
      </footer>

      {rejectOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <button type="button" aria-label="Close rejection form" className="absolute inset-0 bg-arc-ink/35" onClick={onRejectCancel} disabled={rejecting} />
        <div role="dialog" aria-modal="true" aria-label="Reject question" className="relative z-10 w-full max-w-xl rounded-3xl border border-arc-line bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-6">
          <h2 className="font-sans text-xl font-semibold text-arc-ink">Reject question</h2><p className="mt-1 text-sm text-arc-muted">Send the issue to Feedback so it can be fixed.</p>
          <label className="mt-5 block"><span className="text-xs font-medium text-arc-muted">Issue type</span><select value={issueType} onChange={(event) => onIssueTypeChange(event.target.value as SandboxIssueType)} className="mt-1 block w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 text-sm outline-none focus:border-arc-accent"><option value="issue_with_explanation">Issue with explanation</option><option value="wrong_answer_marked_correct">Wrong answer marked as correct</option><option value="explanation_incorrect">Explanation is incorrect</option><option value="formatting_display_issue">Formatting/display issue</option><option value="other">Other issue</option></select></label>
          <label className="mt-4 block"><span className="text-xs font-medium text-arc-muted">Notes</span><textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={4} placeholder="Describe what needs to be fixed." className="mt-1 w-full resize-y rounded-lg border border-arc-line bg-white px-3 py-2.5 text-sm outline-none focus:border-arc-accent" /></label>
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onRejectCancel} disabled={rejecting} className="arc-btn-secondary rounded-lg px-4 py-2.5">Cancel</button><button type="button" onClick={onRejectSubmit} disabled={rejecting} className="arc-btn-primary rounded-lg px-4 py-2.5">{rejecting ? "Sending..." : "Send to feedback"}</button></div>
        </div>
      </div> : null}

      {overviewOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <button type="button" aria-label="Close review overview" className="absolute inset-0 bg-arc-ink/35" onClick={() => setOverviewOpen(false)} />
        <div role="dialog" aria-modal="true" aria-label="Review session overview" className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-arc-line bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-arc-line px-5 py-4"><div><h2 className="font-sans text-lg font-semibold text-arc-ink">Review session</h2><p className="mt-1 text-sm text-arc-muted">{reviewQueue.length} questions in this session</p></div><button type="button" onClick={() => setOverviewOpen(false)} className="rounded-lg border border-arc-line px-3 py-2 text-sm font-medium text-arc-heading hover:bg-arc-soft">Close</button></div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-arc-line">{reviewQueue.map((row, index) => <button key={row.question_id} type="button" onClick={() => { onJumpTo(index); setOverviewOpen(false); }} className={`flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-arc-soft ${index === reviewIndex ? "bg-arc-accentSoft" : ""}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-sm font-semibold ${index === reviewIndex ? "bg-arc-accent text-white" : "bg-arc-soft text-arc-heading"}`}>{index + 1}</span><span className="min-w-0"><span className="block truncate font-sans text-sm font-medium text-arc-heading">{row.skill || row.domain || "Question"}</span><span className="mt-0.5 block text-xs text-arc-muted">{row.domain || "No domain"} · Tier {row.tier ?? "—"}</span></span></button>)}</div>
        </div>
      </div> : null}
    </div>
  );
}

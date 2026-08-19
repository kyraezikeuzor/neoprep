"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import type { Question } from "@/app/actions";
import {
  getExplainerStatus,
  getPlaygroundQuestion,
  listPlaygroundQuestions,
  markQuestionExplained,
  type ExplainerStatus,
  type PlaygroundQuestionOption,
} from "@/app/actions/tools";
import ExplainerPreviewCard from "@/components/admin/ExplainerPreviewCard";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";

const SUBJECT_OPTIONS: { value: SubjectFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "math", label: "Math" },
  { value: "reading_writing", label: "R and W" },
];

const DIFFICULTY_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "Random" },
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
];

const EMPTY_STATUS: ExplainerStatus = {
  count: 0,
  latestRecordedAt: null,
};

function truncate(text: string, max = 88): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function formatQuestionLabel(question: PlaygroundQuestionOption): string {
  const meta = [
    question.domain,
    question.skill,
    question.tier != null ? `Tier ${question.tier}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return meta ? `${question.question_id} — ${meta}` : question.question_id;
}

function formatRecordedAt(iso: string | null): string {
  if (!iso) return "Not yet recorded";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not yet recorded";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toggleClass(selected: boolean) {
  return selected
    ? "min-h-11 rounded-xl border border-arc-accent bg-arc-accentSoft px-4 py-2.5 font-sans text-sm font-medium text-arc-accent transition"
    : "min-h-11 rounded-xl border border-arc-line bg-transparent px-4 py-2.5 font-sans text-sm font-medium text-arc-heading transition hover:bg-arc-soft";
}

function OptionRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="arc-card-label">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function ExplainerPlayground({
  initialOptions,
  initialQuestion,
  initialStatus,
  initialSubject = "all",
  initialTier = "all",
}: {
  initialOptions: PlaygroundQuestionOption[];
  initialQuestion: Question | null;
  initialStatus: ExplainerStatus;
  initialSubject?: SubjectFilter;
  initialTier?: TierFilter;
}) {
  const [subject, setSubject] = useState<SubjectFilter>(initialSubject);
  const [tier, setTier] = useState<TierFilter>(initialTier);
  const [options, setOptions] = useState<PlaygroundQuestionOption[]>(initialOptions);
  const [question, setQuestion] = useState<Question | null>(initialQuestion);
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    initialQuestion?.question_id ?? initialOptions[0]?.question_id ?? ""
  );
  const [status, setStatus] = useState<ExplainerStatus>(initialStatus);
  const [card, setCard] = useState<"hook" | "reveal">("hook");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [filtersPending, startFiltersTransition] = useTransition();
  const [marking, startMarkingTransition] = useTransition();
  const requestVersion = useRef(0);

  async function fetchQuestionState(questionId: string): Promise<{
    question: Question | null;
    status: ExplainerStatus;
  }> {
    const [nextQuestion, nextStatus] = await Promise.all([
      getPlaygroundQuestion(questionId),
      getExplainerStatus(questionId),
    ]);

    return {
      question: nextQuestion,
      status: nextStatus,
    };
  }

  async function showQuestion(questionId: string) {
    const id = questionId.trim();
    if (!id) {
      setError("Choose a question.");
      return;
    }

    const currentRequest = ++requestVersion.current;
    setLoadingQuestion(true);
    setError("");
    setFeedback("");
    setSelectedQuestionId(id);

    const next = await fetchQuestionState(id);
    if (currentRequest !== requestVersion.current) return;

    setLoadingQuestion(false);
    if (!next.question) {
      setQuestion(null);
      setStatus(EMPTY_STATUS);
      setError(`No verified question found for ID “${id}”.`);
      return;
    }

    setQuestion(next.question);
    setStatus(next.status);
    setCard("hook");
    setSelectedQuestionId(next.question.question_id);
  }

  function refreshOptions(nextSubject: SubjectFilter, nextTier: TierFilter) {
    const preferredId = selectedQuestionId;

    startFiltersTransition(async () => {
      const currentRequest = ++requestVersion.current;
      setError("");
      setFeedback("");

      const rows = await listPlaygroundQuestions({
        subject: nextSubject,
        tier: nextTier,
        reviewState: "verified",
      });
      if (currentRequest !== requestVersion.current) return;

      setOptions(rows);
      const nextId = rows.some((row) => row.question_id === preferredId)
        ? preferredId
        : rows[0]?.question_id ?? "";

      setSelectedQuestionId(nextId);

      if (!nextId) {
        setQuestion(null);
        setStatus(EMPTY_STATUS);
        return;
      }

      setLoadingQuestion(true);
      const next = await fetchQuestionState(nextId);
      if (currentRequest !== requestVersion.current) return;

      setLoadingQuestion(false);
      setQuestion(next.question);
      setStatus(next.status);
      setCard("hook");

      if (!next.question) {
        setError(`No verified question found for ID “${nextId}”.`);
      }
    });
  }

  function handleCardShift(direction: "prev" | "next") {
    setCard(() => {
      if (direction === "prev") return "hook";
      return "reveal";
    });
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="arc-card h-fit p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="arc-card-label">Format</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#007AFF] px-3 py-1.5 font-sans text-sm font-medium text-white">
                  Static
                </span>
                <span className="rounded-full border border-arc-line bg-[#FAFAFA] px-3 py-1.5 font-sans text-sm font-medium text-arc-muted opacity-70">
                  Video
                </span>
              </div>
            </div>

            <div className="rounded-full border border-arc-line px-3 py-1 text-xs font-medium text-arc-muted">
              Coming soon
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <OptionRow label="Subject">
              {SUBJECT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSubject(option.value);
                    refreshOptions(option.value, tier);
                  }}
                  className={toggleClass(subject === option.value)}
                  aria-pressed={subject === option.value}
                >
                  {option.label}
                </button>
              ))}
            </OptionRow>

            <OptionRow label="Difficulty">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    setTier(option.value);
                    refreshOptions(subject, option.value);
                  }}
                  className={toggleClass(tier === option.value)}
                  aria-pressed={tier === option.value}
                >
                  {option.label}
                </button>
              ))}
            </OptionRow>

            <label className="block">
              <span className="font-sans text-xs font-medium text-arc-muted">Question</span>
              <select
                value={selectedQuestionId}
                onChange={(event) => void showQuestion(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
              >
                {options.length === 0 ? (
                  <option value="">No verified questions for these filters</option>
                ) : (
                  options.map((option) => (
                    <option key={option.question_id} value={option.question_id}>
                      {formatQuestionLabel(option)}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-2 text-xs leading-5 text-arc-muted">
                {options.length === 0
                  ? "Only verified questions show up here."
                  : `${options.length} verified question${options.length === 1 ? "" : "s"} available.`}
              </p>
              {selectedQuestionId ? (
                <p className="mt-2 text-xs leading-5 text-arc-muted">
                  {truncate(
                    options.find((option) => option.question_id === selectedQuestionId)?.stem ??
                      question?.stem ??
                      ""
                  )}
                </p>
              ) : null}
            </label>
          </div>
        </div>

        <div className="arc-card rounded-2xl border border-arc-line bg-[#FAFAFA] p-4">
          <p className="arc-card-label">Explainer log</p>
          <p className="mt-2 font-sans text-2xl font-semibold text-arc-ink">
            {status.count}
          </p>
          <p className="mt-1 text-sm text-arc-muted">
            Last recorded: {formatRecordedAt(status.latestRecordedAt)}
          </p>

          <button
            type="button"
            disabled={marking || !question}
            onClick={() =>
              startMarkingTransition(async () => {
                if (!question) return;
                setError("");
                setFeedback("");

                const result = await markQuestionExplained(question.question_id);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }

                setStatus((prev) => ({
                  count: prev.count + 1,
                  latestRecordedAt: result.recordedAt,
                }));
                setFeedback("Marked as explained.");
              })
            }
            className="arc-btn-primary mt-4"
          >
            {marking ? "Saving..." : "Mark as explained"}
          </button>
        </div>

        {filtersPending ? (
          <p className="text-sm text-arc-muted">Refreshing verified questions…</p>
        ) : null}
        {error ? <p className="text-sm text-arc-incorrect">{error}</p> : null}
        {!error && feedback ? (
          <p className="text-sm text-[#15803D]">{feedback}</p>
        ) : null}
      </div>

      <div className="arc-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="arc-card-label">Playground</p>
            <p className="mt-1 font-sans text-base font-medium text-arc-heading">
              Static explainer carousel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCardShift("prev")}
              disabled={card === "hook"}
              className="rounded-full border border-arc-line px-3 py-2 text-sm font-medium text-arc-heading disabled:cursor-not-allowed disabled:opacity-50"
            >
              ←
            </button>
            <div className="rounded-full border border-arc-line p-1">
              <button
                type="button"
                onClick={() => setCard("hook")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  card === "hook" ? "bg-[#007AFF] text-white" : "text-arc-heading"
                }`}
              >
                Hook
              </button>
              <button
                type="button"
                onClick={() => setCard("reveal")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  card === "reveal" ? "bg-[#007AFF] text-white" : "text-arc-heading"
                }`}
              >
                Reveal
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleCardShift("next")}
              disabled={card === "reveal"}
              className="rounded-full border border-arc-line px-3 py-2 text-sm font-medium text-arc-heading disabled:cursor-not-allowed disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-6">
          {question ? (
            <ExplainerPreviewCard question={question} variant={card} />
          ) : loadingQuestion ? (
            <div className="flex h-[32rem] items-center justify-center rounded-[30px] border border-dashed border-arc-line bg-[#FAFAFA]">
              <p className="font-sans text-sm text-arc-muted">Loading question…</p>
            </div>
          ) : (
            <div className="flex h-[32rem] items-center justify-center rounded-[30px] border border-dashed border-arc-line bg-[#FAFAFA]">
              <p className="font-sans text-sm text-arc-muted">
                Choose a verified question to open the static carousel preview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

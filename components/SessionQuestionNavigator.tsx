"use client";

export type SessionNavQuestion = {
  question_id: string;
  tier: number | null;
};

export type SessionNavResult = {
  correct: boolean;
};

function tierTileClass(tier: number | null | undefined): string {
  if (tier === 1) return "bg-[#F8E7A0] text-[#5C4E12]";
  if (tier === 2) return "bg-[#F5C7A9] text-[#6B3F1D]";
  if (tier === 3) return "bg-[#EFA3A3] text-[#6B2424]";
  return "bg-[#E8E8E6] text-arc-ink";
}

function CorrectBadge() {
  return (
    <span
      className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-sm"
      aria-hidden
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
        <path
          d="M2.5 6.2l2.2 2.2 4.8-4.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function IncorrectBadge() {
  return (
    <span
      className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-sm"
      aria-hidden
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
        <path
          d="M3.2 3.2l5.6 5.6M8.8 3.2L3.2 8.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function ReviewBadge() {
  return (
    <span
      className="absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[#C2410C] text-white shadow-sm"
      aria-hidden
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
        <path d="M3 1.5h6a.75.75 0 01.75.75v8.1a.4.4 0 01-.64.32L6 8.85l-3.11 1.82a.4.4 0 01-.64-.32v-8.1A.75.75 0 013 1.5z" />
      </svg>
    </span>
  );
}

export default function SessionQuestionNavigator({
  open,
  onClose,
  onJump,
  questions,
  total,
  currentIndex,
  results,
  markedForReview,
}: {
  open: boolean;
  onClose: () => void;
  onJump: (index: number) => void;
  questions: SessionNavQuestion[];
  total: number;
  currentIndex: number;
  results: Record<string, SessionNavResult>;
  markedForReview: Set<string>;
}) {
  if (!open) return null;

  const tiles = Array.from({ length: total }, (_, i) => {
    const q = questions[i] ?? null;
    return { index: i, question: q };
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center pb-24 sm:items-center sm:pb-0">
      <button
        type="button"
        aria-label="Close question navigator"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Question navigator"
        className="relative z-10 w-[min(100%-1.5rem,28rem)] rounded-2xl bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-sans text-lg font-bold tracking-tight text-arc-ink">
              Questions
            </p>
            <p className="mt-1 font-sans text-xs text-arc-muted">
              Yellow easy · Orange medium · Red hard
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-arc-muted transition hover:bg-[#F4F4F5] hover:text-arc-ink"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mb-3 border-t border-[#E8E8E6]" />

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-[11px] text-arc-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative h-3.5 w-3.5">
              <span className="absolute inset-0 rounded-full bg-[#22C55E]" />
              <svg
                viewBox="0 0 12 12"
                className="absolute inset-0 m-auto h-2 w-2 text-white"
                fill="none"
              >
                <path
                  d="M2.5 6.2l2.2 2.2 4.8-4.8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Correct
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative h-3.5 w-3.5">
              <span className="absolute inset-0 rounded-full bg-[#EF4444]" />
              <svg
                viewBox="0 0 12 12"
                className="absolute inset-0 m-auto h-2 w-2 text-white"
                fill="none"
              >
                <path
                  d="M3.2 3.2l5.6 5.6M8.8 3.2L3.2 8.8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Incorrect
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#C2410C] text-white">
              <svg viewBox="0 0 12 12" className="h-2 w-2" fill="currentColor">
                <path d="M3 1.5h6a.75.75 0 01.75.75v8.1a.4.4 0 01-.64.32L6 8.85l-3.11 1.82a.4.4 0 01-.64-.32v-8.1A.75.75 0 013 1.5z" />
              </svg>
            </span>
            For Review
          </span>
        </div>

        <div className="grid max-h-[50vh] grid-cols-4 gap-2 overflow-y-auto p-1 sm:grid-cols-6 sm:gap-2.5">
          {tiles.map(({ index, question }) => {
            const result = question ? results[question.question_id] : undefined;
            const forReview = question
              ? markedForReview.has(question.question_id)
              : false;
            const isCurrent = index === currentIndex;
            const canJump = Boolean(question);

            const statusLabel = result
              ? result.correct
                ? ", correct"
                : ", incorrect"
              : ", unanswered";
            const reviewLabel = forReview ? ", marked for review" : "";

            return (
              <button
                key={index}
                type="button"
                disabled={!canJump}
                onClick={() => {
                  if (!canJump) return;
                  onJump(index);
                }}
                className={`relative flex aspect-square items-center justify-center rounded-xl font-sans text-sm font-bold tabular-nums transition ${tierTileClass(
                  question?.tier ?? null
                )} ${
                  isCurrent
                    ? "border-[3px] border-arc-ink"
                    : "border-[3px] border-transparent hover:brightness-[0.97]"
                } disabled:cursor-not-allowed disabled:opacity-45`}
                aria-current={isCurrent ? "true" : undefined}
                aria-label={`Question ${index + 1}${statusLabel}${reviewLabel}`}
              >
                {index + 1}
                {result?.correct === true ? <CorrectBadge /> : null}
                {result?.correct === false ? <IncorrectBadge /> : null}
                {forReview ? <ReviewBadge /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

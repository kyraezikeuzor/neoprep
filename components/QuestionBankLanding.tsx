"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { BankOverview } from "@/app/actions";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import { typography } from "@/lib/typography";
import { filterPillClass, SELECTED_FILTER_STYLE } from "@/lib/uiStyles";
import type { QuestionAccess } from "@/lib/access-policy";
import UpgradeToProCard from "@/components/billing/UpgradeToProCard";

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

const COUNT_OPTIONS = [10, 20, 30] as const;

function LightningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0 text-sky-400"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13.2 2.1a.75.75 0 01.68.42l4.5 9.5a.75.75 0 01-.68 1.08H13l1.35 7.42a.75.75 0 01-1.28.64l-8.5-10.5A.75.75 0 015.2 9.5H9.5L8.05 2.9A.75.75 0 018.75 2h4.45z" />
    </svg>
  );
}

function OptionRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <p className="arc-card-label mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function QuestionBankLanding({
  overview,
  streak,
  access,
}: {
  overview: BankOverview;
  streak: number;
  access: QuestionAccess;
}) {
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(10);

  const completionPct =
    overview.total === 0
      ? 0
      : Math.min(100, Math.round((overview.completed / overview.total) * 100));

  const practiceHref = useMemo(() => {
    const params = new URLSearchParams({
      practice: "1",
      count: String(count),
    });
    if (subject !== "all") params.set("subject", subject);
    if (tier !== "all") params.set("tier", String(tier));
    return `/question-bank?${params.toString()}`;
  }, [subject, tier, count]);

  const streakHint = streak > 0 ? "Keep it going" : "Start practicing to begin";
  const requestedCount = access.isPro
    ? count
    : Math.min(count, access.remainingQuestions ?? 0);
  const limitReached = !access.canAccessNewQuestion;

  return (
    <DashboardPageShell>
      <PageHeader title="Question Bank" />

      <div className="hidden mt-6 rounded-2xl border-2 border-arc-line bg-white px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <LightningIcon />
          <h2 className={typography.cardTitle}>
            What is Question Bank?
          </h2>
        </div>
        <p className={`mt-2 max-w-3xl ${typography.sectionDescription}`}>
          Question Bank is where you practice at your own pace. Pick a subject
          and difficulty, work through questions one at a time, and see the full
          explanation after each answer. Use it to target weak spots between your
          bootcamp assignments, or just keep your skills sharp.
        </p>
      </div>

      <div className="arc-card mt-8 grid divide-y divide-arc-line lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        <div className="px-5 py-5 sm:px-6">
          <p className={typography.cardLabel}>
            Completion
          </p>
          <p className={`mt-2 ${typography.cardValue}`}>
            {completionPct}%
          </p>
          <p className="arc-card-hint mt-2">
            {overview.completed} of {overview.total}
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className={typography.cardLabel}>
            Accuracy
          </p>
          <p className={`mt-2 ${typography.cardValue}`}>
            {overview.accuracy}%
          </p>
          <p className="arc-card-hint mt-2">Across all attempts</p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className={typography.cardLabel}>
            Streak
          </p>
          <p className={`mt-2 ${typography.cardValue}`}>
            {streak}
          </p>
          <p className="arc-card-hint mt-2">{streakHint}</p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className={typography.cardLabel}>Current plan</p>
          <p className={`mt-2 ${typography.cardValue}`}>{access.planLabel}</p>
          <p className="arc-card-hint mt-2">
            {access.isPro
              ? "Full question bank access"
              : `${access.uniqueQuestionsUsed} of ${access.questionLimit} questions used`}
          </p>
        </div>
      </div>

      {!access.isPro ? (
        <UpgradeToProCard
          className="mt-4"
          usedQuestions={access.uniqueQuestionsUsed}
          questionLimit={access.questionLimit}
        />
      ) : null}

      <div className="arc-card mt-4 divide-y divide-arc-line">
        <OptionRow label="Subject">
          {SUBJECT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setSubject(o.value)}
              className={filterPillClass(subject === o.value)}
              style={subject === o.value ? SELECTED_FILTER_STYLE : undefined}
              aria-pressed={subject === o.value}
            >
              {o.label}
            </button>
          ))}
        </OptionRow>

        <OptionRow label="Difficulty">
          {DIFFICULTY_OPTIONS.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => setTier(o.value)}
              className={filterPillClass(tier === o.value)}
              style={tier === o.value ? SELECTED_FILTER_STYLE : undefined}
              aria-pressed={tier === o.value}
            >
              {o.label}
            </button>
          ))}
        </OptionRow>

        <OptionRow label="How many questions">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={filterPillClass(count === n)}
              style={count === n ? SELECTED_FILTER_STYLE : undefined}
              aria-pressed={count === n}
            >
              {n}
            </button>
          ))}
        </OptionRow>

        <div className="px-5 py-5 sm:px-6">
          {limitReached ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-sans text-sm text-arc-muted">
                You have used all 100 questions included with Free.
              </p>
              <Link
                href="/pricing"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#EC4899] px-6 py-3 font-sans text-base font-semibold text-[#FDE7F4] transition hover:bg-[#DB2777]"
              >
                Upgrade to Pro
              </Link>
            </div>
          ) : (
            <div>
              <Link href={practiceHref} className="arc-btn-primary w-full py-3 text-base">
                Start practicing
              </Link>
              {!access.isPro && requestedCount < count ? (
                <p className="mt-2 text-center font-sans text-xs text-arc-muted">
                  This session will include your {requestedCount} remaining free questions.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
}

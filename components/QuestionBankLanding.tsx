"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { BankOverview } from "@/app/actions";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

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
    <div className="px-5 py-4 sm:px-6">
      <p className="arc-card-label mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function QuestionBankLanding({
  overview,
  streak,
}: {
  overview: BankOverview;
  streak: number;
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

  return (
    <DashboardPageShell>
      <PageHeader title="Question Bank" />

      <div className="mt-6 rounded-2xl border-2 border-arc-line bg-white px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <LightningIcon />
          <h2 className="font-sans text-base font-medium text-arc-heading sm:text-lg">
            What is Question Bank?
          </h2>
        </div>
        <p className="mt-2 max-w-3xl font-sans text-sm leading-relaxed text-[#71717A] sm:text-[15px]">
          Question Bank is where you practice at your own pace. Pick a subject
          and difficulty, work through questions one at a time, and see the full
          explanation after each answer. Use it to target weak spots between your
          bootcamp assignments, or just keep your skills sharp.
        </p>
      </div>

      <div className="arc-card mt-8 grid divide-y divide-arc-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="px-5 py-5 sm:px-6">
          <p className="font-sans text-[13px] font-normal text-[#8F8F98]">
            Completion
          </p>
          <p className="mt-2 font-sans text-2xl font-normal tabular-nums leading-none tracking-tight text-arc-heading">
            {completionPct}%
          </p>
          <p className="arc-card-hint mt-2">
            {overview.completed} of {overview.total}
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="font-sans text-[13px] font-normal text-[#8F8F98]">
            Accuracy
          </p>
          <p className="mt-2 font-sans text-2xl font-normal tabular-nums leading-none tracking-tight text-arc-heading">
            {overview.accuracy}%
          </p>
          <p className="arc-card-hint mt-2">Across all attempts</p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="font-sans text-[13px] font-normal text-[#8F8F98]">
            Streak
          </p>
          <p className="mt-2 font-sans text-2xl font-normal tabular-nums leading-none tracking-tight text-arc-heading">
            {streak}
          </p>
          <p className="arc-card-hint mt-2">{streakHint}</p>
        </div>
      </div>

      <div className="arc-card mt-4 divide-y divide-arc-line">
        <OptionRow label="Subject">
          {SUBJECT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setSubject(o.value)}
              className={toggleClass(subject === o.value)}
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
              className={toggleClass(tier === o.value)}
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
              className={toggleClass(count === n)}
              aria-pressed={count === n}
            >
              {n}
            </button>
          ))}
        </OptionRow>

        <div className="px-5 py-5 sm:px-6">
          <Link href={practiceHref} className="arc-btn-primary w-full py-3 text-base">
            Start practicing
          </Link>
        </div>
      </div>
    </DashboardPageShell>
  );
}

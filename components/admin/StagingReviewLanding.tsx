"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";

const SUBJECT_OPTIONS: { value: SubjectFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "math", label: "Math" },
  { value: "reading_writing", label: "R and W" },
];

const DIFFICULTY_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All difficulties" },
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
];
const COUNT_OPTIONS = [10, 20, 30] as const;

function toggleClass(selected: boolean) {
  return selected
    ? "min-h-11 rounded-xl border border-arc-accent bg-arc-accentSoft px-4 py-2.5 font-sans text-sm font-medium text-arc-accent transition"
    : "min-h-11 rounded-xl border border-arc-line bg-transparent px-4 py-2.5 font-sans text-sm font-medium text-arc-heading transition hover:bg-arc-soft";
}

function OptionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <p className="arc-card-label mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function StagingReviewLanding({ backlogCount }: { backlogCount: number }) {
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(10);

  const reviewHref = useMemo(() => {
    const params = new URLSearchParams({ count: String(count) });
    if (subject !== "all") params.set("subject", subject);
    if (tier !== "all") params.set("tier", String(tier));
    return `/admin/sandbox/review?${params.toString()}`;
  }, [subject, tier, count]);

  return (
    <div className="mt-8">
      <div className="arc-card divide-y divide-arc-line">
        <div className="px-5 py-5 sm:px-6">
          <p className="arc-card-label">Review queue</p>
          <p className="mt-2 font-sans text-2xl font-normal tabular-nums tracking-tight text-arc-heading">
            {backlogCount}
          </p>
          <p className="arc-card-hint mt-2">
            {backlogCount === 1 ? "question needs review" : "questions need review"}
          </p>
        </div>

        <OptionRow label="Subject">
          {SUBJECT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSubject(option.value)}
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
              onClick={() => setTier(option.value)}
              className={toggleClass(tier === option.value)}
              aria-pressed={tier === option.value}
            >
              {option.label}
            </button>
          ))}
        </OptionRow>

        <OptionRow label="Questions to review">
          {COUNT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCount(option)}
              className={toggleClass(count === option)}
              aria-pressed={count === option}
            >
              {option}
            </button>
          ))}
        </OptionRow>

        <div className="px-5 py-5 sm:px-6">
          <Link href={reviewHref} className="arc-btn-primary w-full py-3 text-base">
            Start reviewing
          </Link>
        </div>
      </div>
    </div>
  );
}

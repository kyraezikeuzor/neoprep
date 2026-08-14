"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BankOverview, SkillProgress } from "@/app/actions";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

const SUBJECT_OPTIONS: { value: SubjectFilter; label: string }[] = [
  { value: "all", label: "All topics" },
  { value: "math", label: "Math" },
  { value: "reading_writing", label: "Reading & Writing" },
];

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All difficulties" },
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
];

export default function QuestionBankLanding({
  overview,
  skillProgress,
}: {
  overview: BankOverview;
  skillProgress: SkillProgress[];
}) {
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");

  const completionPct =
    overview.total === 0
      ? 0
      : Math.min(100, Math.round((overview.completed / overview.total) * 100));

  const practiceHref = useMemo(() => {
    const params = new URLSearchParams({ practice: "1" });
    if (subject !== "all") params.set("subject", subject);
    if (tier !== "all") params.set("tier", String(tier));
    return `/question-bank?${params.toString()}`;
  }, [subject, tier]);

  const filteredSkills = useMemo(() => {
    if (subject === "all") return skillProgress;
    const mathish = new Set([
      "Algebra",
      "Advanced Math",
      "Problem-Solving and Data Analysis",
      "Geometry and Trigonometry",
    ]);
    return skillProgress.filter((s) => {
      if (!s.domain) return true;
      const isMath = mathish.has(s.domain);
      return subject === "math" ? isMath : !isMath;
    });
  }, [skillProgress, subject]);

  return (
    <DashboardPageShell>
        <PageHeader
          title="Question Bank"
          description="Practice original SAT-style questions with clear explanations."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-5">
            <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
              Completion
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
              {completionPct}%
            </p>
            <p className="mt-2 font-sans text-sm text-arc-muted">
              {overview.completed} / {overview.total} questions
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EFEFEF]">
              <div
                className="h-full rounded-full bg-[#007AFF]"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-5">
            <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
              Accuracy
            </p>
            <p className="mt-2 font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
              {overview.accuracy}%
            </p>
            <p className="mt-2 font-sans text-sm text-arc-muted">Across all attempts</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
              Topic
            </span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectFilter)}
              className="rounded-xl border-2 border-[#E5E7EB] bg-white px-3 py-2.5 font-sans text-sm text-arc-ink outline-none transition focus:border-[#007AFF]"
            >
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
              Difficulty
            </span>
            <select
              value={String(tier)}
              onChange={(e) => {
                const v = e.target.value;
                setTier(v === "all" ? "all" : (Number(v) as 1 | 2 | 3));
              }}
              className="rounded-xl border-2 border-[#E5E7EB] bg-white px-3 py-2.5 font-sans text-sm text-arc-ink outline-none transition focus:border-[#007AFF]"
            >
              {TIER_OPTIONS.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6">
          <Link
            href={practiceHref}
            className="inline-flex items-center justify-center rounded-full bg-[#007AFF] px-6 py-3 font-sans text-base font-semibold text-white transition hover:bg-[#0066DD]"
          >
            Start Practicing
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="font-sans text-base font-semibold text-[#3F3F46]">
            Completion by skill
          </h2>
          <p className="mt-1 font-sans text-sm text-arc-muted">
            Unique questions attempted out of available questions per skill
          </p>

          {filteredSkills.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-arc-muted">
              No skill-level data available yet.
            </p>
          ) : (
            <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {filteredSkills.map((item) => {
                const pct =
                  item.total === 0
                    ? 0
                    : Math.min(100, Math.round((item.completed / item.total) * 100));
                return (
                  <li key={item.skill}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate font-sans text-sm font-medium text-arc-ink">
                        {item.skill}
                      </p>
                      <p className="shrink-0 font-sans text-xs tabular-nums text-arc-muted">
                        {item.completed}/{item.total}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EFEFEF]">
                      <div
                        className="h-full rounded-full bg-[#9CA3AF]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
    </DashboardPageShell>
  );
}

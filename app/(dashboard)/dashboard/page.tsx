import Link from "next/link";
import type { Metadata } from "next";
import { getDashboardStats, getMistakeCount } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard · Tutormigo",
};

function getFirstName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
} | null) {
  if (!user) return "there";

  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.given_name === "string" && meta.given_name) ||
    "";

  if (fullName.trim()) {
    return fullName.trim().split(/\s+/)[0];
  }

  const email = user.email ?? "";
  if (email.includes("@")) return email.split("@")[0];
  return "there";
}

function scoreDisplay(value: number | null): string {
  return value == null ? "—" : String(value);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, errorCount] = await Promise.all([
    getDashboardStats(),
    getMistakeCount(),
  ]);
  const firstName = getFirstName(user);

  return (
    <DashboardPageShell>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your practice at a glance"
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Score — muted violet */}
        <div className="flex flex-col rounded-2xl border-2 border-[#E4DCEA] bg-white p-5">
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Score
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end gap-3">
            {stats.goalScore != null ? (
              <p className="font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
                {stats.goalScore}
              </p>
            ) : (
              <Link
                href="/settings"
                className="font-sans text-base font-medium leading-snug text-arc-ink underline-offset-2 hover:underline"
              >
                Set a goal score
              </Link>
            )}
          </div>
          <p className="mt-2 font-sans text-sm text-arc-muted">
            Predicted {scoreDisplay(stats.predictedScore)}
          </p>
          <p className="mt-1 font-sans text-xs text-arc-muted">
            Math {scoreDisplay(stats.mathScore)} · R&amp;W{" "}
            {scoreDisplay(stats.rwScore)}
          </p>
        </div>

        {/* Questions Attempted — muted blue */}
        <div className="flex flex-col rounded-2xl border-2 border-[#D5E2EE] bg-white p-5">
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Questions Attempted
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end">
            <p className="font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
              {stats.totalAttempts}
            </p>
          </div>
          <p className="mt-2 font-sans text-sm text-arc-muted">
            Today: {stats.todayAttempts}
          </p>
        </div>

        {/* Current Accuracy — muted soft orange */}
        <div className="flex flex-col rounded-2xl border-2 border-[#EEDFD0] bg-white p-5">
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Current Accuracy
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end">
            <p className="font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
              {stats.accuracyPercent == null ? "—" : `${stats.accuracyPercent}%`}
            </p>
          </div>
          <p className="mt-2 font-sans text-sm text-arc-muted">
            {stats.correctAttempts} correct
          </p>
        </div>

        {/* Study Streak — muted periwinkle / blue-purple */}
        <div className="flex flex-col rounded-2xl border-2 border-[#DBDDED] bg-white p-5">
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Study Streak
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end">
            {stats.streak > 0 ? (
              <p className="font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
                {stats.streak}
                <span className="ml-1 text-base font-medium text-arc-muted">
                  {stats.streak === 1 ? "day" : "days"}
                </span>
              </p>
            ) : (
              <p className="font-sans text-lg font-medium leading-none text-arc-ink">
                Start your streak
              </p>
            )}
          </div>
          <p className="mt-2 font-sans text-sm text-arc-muted">
            {stats.streak > 0
              ? "Consecutive days practiced"
              : "Answer a question to begin"}
          </p>
        </div>

        {/* Mistakes — muted terracotta / orange-rose */}
        <Link
          href="/mistakes"
          className="flex flex-col rounded-2xl border-2 border-[#ECDDD9] bg-white p-5 transition duration-200 hover:border-[#DCC8C3]"
        >
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Mistakes
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end">
            <p className="font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
              {errorCount}
            </p>
          </div>
          <p className="mt-2 font-sans text-sm font-medium text-arc-muted">
            {errorCount === 0 ? "No missed questions" : "View missed questions →"}
          </p>
        </Link>

        {/* Question Bank — muted slate-blue */}
        <Link
          href="/question-bank"
          className="flex flex-col rounded-2xl border-2 border-[#D2DFE8] bg-white p-5 transition duration-200 hover:border-[#BCCDD9]"
        >
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Question Bank
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end">
            <p className="font-sans text-lg font-medium leading-none text-arc-ink">
              Keep practicing
            </p>
          </div>
          <p className="mt-2 font-sans text-sm font-medium text-arc-muted">
            Open question bank →
          </p>
        </Link>
      </div>
    </DashboardPageShell>
  );
}

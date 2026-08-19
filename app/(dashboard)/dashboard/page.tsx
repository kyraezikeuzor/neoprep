import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDashboardStats, getMistakeCount } from "@/app/actions";
import { getAuthedUser } from "@/app/actions/bootcamp/auth";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="3" />
      <path
        d="M28 41l8 8 16-18"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <path
        d="M18 58V38M32 58V28M46 58V44M60 58V22"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="26" stroke="currentColor" strokeWidth="3" />
      <circle cx="40" cy="40" r="16" stroke="currentColor" strokeWidth="3" />
      <circle cx="40" cy="40" r="6" fill="currentColor" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <path
        d="M40 14c6 10 18 16 18 30a18 18 0 11-36 0c0-8 4-14 8-18 2 8 8 10 10 10-2-8 0-16 0-22z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="3" />
      <path
        d="M30 30l20 20M50 30L30 50"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BooksIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="currentColor" aria-hidden>
      <path d="M18 18h14c2 0 4 2 4 4v40c0-3-2-5-5-5H18V18zm22 0h14c2 0 4 2 4 4v40c0-3-2-5-5-5H40V18zm22 0h8v39c0 3-2 5-5 5h-3V18z" />
    </svg>
  );
}

function StatCell({
  label,
  value,
  hint,
  icon,
  action,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="relative min-h-[8.5rem] overflow-hidden px-5 py-5 sm:min-h-[9.5rem] sm:px-6">
      <div className={icon ? "relative z-10 max-w-[calc(100%-4.5rem)]" : "relative z-10"}>
        <p className="arc-card-label">{label}</p>
        <div className="mt-3 font-sans text-3xl font-normal tabular-nums leading-none tracking-tight text-arc-heading sm:text-4xl">
          {value}
        </div>
        {hint ? (
          <div className="arc-card-hint mt-2">{hint}</div>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
      {icon ? (
        <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line opacity-80">
          {icon}
        </div>
      ) : null}
    </div>
  );
}

export default async function DashboardPage() {
  const [{ user }, stats, errorCount] = await Promise.all([
    getAuthedUser(),
    getDashboardStats(),
    getMistakeCount(),
  ]);
  const firstName = getFirstName(user);

  return (
    <DashboardPageShell>
      <PageHeader
        title={`Welcome back, ${firstName}`}
      />

      <div className="mt-8 space-y-4">
        <div className="arc-card grid divide-y divide-arc-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <StatCell
            label="Target score"
            value={
              stats.goalScore != null ? (
                scoreDisplay(stats.goalScore)
              ) : (
                <Link
                  href="/settings"
                  className="text-lg font-normal text-arc-heading underline-offset-2 hover:underline"
                >
                  Set a goal score
                </Link>
              )
            }
            hint={
              <>
                Practice daily to reach
                <br />
                your target score.
              </>
            }
            icon={<TargetIcon />}
          />
          <StatCell
            label="Questions attempted"
            value={stats.totalAttempts}
            hint={`Today: ${stats.todayAttempts}`}
            icon={<CheckIcon />}
          />
          <StatCell
            label="Current accuracy"
            value={
              stats.accuracyPercent == null ? "—" : `${stats.accuracyPercent}%`
            }
            hint={`${stats.correctAttempts} correct`}
            icon={<ChartIcon />}
          />
        </div>

        <div className="arc-card grid divide-y divide-arc-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <StatCell
            label="Study streak"
            value={
              stats.streak > 0 ? (
                <>
                  {stats.streak}
                  <span className="ml-1.5 text-base font-normal text-[#8F8F98]">
                    {stats.streak === 1 ? "day" : "days"}
                  </span>
                </>
              ) : (
                <span className="text-lg font-normal text-arc-heading">
                  Start your streak
                </span>
              )
            }
            hint={
              stats.streak > 0
                ? "Consecutive days practiced"
                : "Answer a question to begin"
            }
            icon={<FlameIcon />}
          />
          <StatCell
            label="Mistakes"
            value={errorCount}
            hint={errorCount === 0 ? "No missed questions" : undefined}
            icon={<XCircleIcon />}
            action={
              <Link
                href="/mistakes"
                className="inline-flex items-center justify-center rounded-full border border-arc-line bg-white px-3 py-1 font-sans text-xs font-medium text-[#8F8F98] transition hover:bg-arc-soft"
              >
                View mistakes
              </Link>
            }
          />
          <StatCell
            label="Question bank"
            value={<span className="text-lg font-normal">Keep practicing</span>}
            icon={<BooksIcon />}
            action={
              <Link
                href="/question-bank"
                className="inline-flex items-center justify-center rounded-full border border-arc-line bg-white px-3 py-1 font-sans text-xs font-medium text-[#8F8F98] transition hover:bg-arc-soft"
              >
                Start practicing
              </Link>
            }
          />
        </div>
      </div>
    </DashboardPageShell>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  getDashboardShellStats,
  getDashboardStats,
  getMistakeCount,
} from "@/app/actions";
import { getAuthedUser } from "@/app/actions/bootcamp/auth";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import { isLocalStudentPreview } from "@/lib/devPreview";
import { typography } from "@/lib/typography";
import { getXpLevelProgress } from "@/lib/xp";

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
  valueClassName = typography.cardValueLarge,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="relative min-h-[8.5rem] overflow-hidden px-5 py-5 sm:min-h-[9.5rem] sm:px-6">
      <div className="relative z-10">
        <p className={typography.cardLabel}>{label}</p>
        <div className={`mt-3 ${valueClassName}`}>
          {value}
        </div>
        {hint ? (
          <div className={`mt-2 ${typography.cardHint}`}>{hint}</div>
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

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecentDays() {
  const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index - 6);
    return {
      key: toDateKey(date),
      label: formatter.format(date),
      isToday: index === 6,
    };
  });
}

function StudentProgressCard({
  firstName,
  xp,
  streak,
  recentActiveDates,
  questionsToday,
}: {
  firstName: string;
  xp: number;
  streak: number;
  recentActiveDates: string[];
  questionsToday: number;
}) {
  const level = getXpLevelProgress(xp);
  const recentDays = getRecentDays();
  const activeDates = new Set(recentActiveDates);
  const dailyGoal = 10;
  const completedToday = Math.min(questionsToday, dailyGoal);
  const remainingToday = Math.max(dailyGoal - questionsToday, 0);
  const dailyProgress = Math.round((completedToday / dailyGoal) * 100);

  return (
    <section
      className="arc-card grid overflow-hidden divide-y divide-arc-line xl:grid-cols-3 xl:divide-x xl:divide-y-0"
      aria-label="Level, streak, and daily goal"
    >
      <div className="flex min-w-0 items-center gap-4 p-5 sm:gap-5 sm:p-6 xl:gap-4 xl:p-4 2xl:gap-5 2xl:p-6">
        <div className="relative shrink-0 pb-2">
          <div className="grid h-16 w-16 place-items-center rounded-full border-[5px] border-arc-accent bg-arc-accentSoft text-2xl font-semibold text-arc-heading sm:h-20 sm:w-20">
            {firstName.charAt(0).toUpperCase() || "S"}
          </div>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0B0B0B] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
            LVL {level.level}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-arc-heading sm:text-xl">
            {firstName}
          </p>
          <p className="mt-1 text-sm font-medium text-arc-muted">
            {xp.toLocaleString()} XP
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-arc-line">
            <div
              className="h-full rounded-full bg-arc-accent transition-[width]"
              style={{ width: `${level.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 whitespace-nowrap text-[11px] text-arc-muted sm:text-xs">
            {level.xpToNextLevel != null
              ? `${level.xpToNextLevel.toLocaleString()} XP to Level ${level.level + 1}`
              : "Maximum level reached"}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6 xl:p-4 2xl:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className={typography.eyebrow}>Daily streak</p>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-arc-heading">
            <span aria-hidden>🔥</span>
            {streak}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5 2xl:gap-2">
          {recentDays.map((day) => {
            const isActive = activeDates.has(day.key);
            return (
              <div key={day.key} className="text-center">
                <div
                  className={`mx-auto h-8 w-8 rounded-xl border-2 sm:h-9 sm:w-9 xl:h-7 xl:w-7 2xl:h-9 2xl:w-9 ${
                    isActive
                      ? "border-arc-accent bg-arc-accent"
                      : day.isToday
                        ? "border-dashed border-arc-accent bg-white"
                        : "border-arc-line bg-white"
                  }`}
                  aria-label={`${day.label}${isActive ? ": practiced" : ": not practiced"}`}
                >
                  {isActive ? (
                    <span className="grid h-full place-items-center text-sm font-bold text-white" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[10px] font-medium text-arc-muted sm:text-xs">
                  {day.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 p-5 sm:p-6 xl:p-4 2xl:p-6">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full sm:h-20 sm:w-20"
          style={{
            background: `conic-gradient(#1BB1F6 ${dailyProgress}%, #ECECEC 0)`,
          }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-center sm:h-16 sm:w-16">
            <div>
              <p className="text-lg font-semibold leading-none text-arc-heading">
                {completedToday}
              </p>
              <p className="mt-1 text-[10px] leading-none text-arc-muted">of {dailyGoal}</p>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <p className={`${typography.eyebrow} whitespace-nowrap`}>Daily goal</p>
          <p className="mt-2 text-base font-medium leading-snug text-arc-heading">
            {remainingToday === 0
              ? "Goal complete"
              : `${remainingToday} more question${remainingToday === 1 ? "" : "s"}`}
          </p>
          <p className="mt-1 text-sm leading-snug text-arc-muted">
            {remainingToday === 0 ? "Nice work today." : "to reach today’s goal"}
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const [{ user }, stats, errorCount, shellStats] = await Promise.all([
    getAuthedUser(),
    getDashboardStats(),
    getMistakeCount(),
    getDashboardShellStats(),
  ]);
  const previewStudent = !user && isLocalStudentPreview;
  const displayStats = previewStudent
    ? {
        goalScore: 1450,
        predictedScore: 1320,
        mathScore: 680,
        rwScore: 640,
        totalAttempts: 86,
        todayAttempts: 12,
        correctAttempts: 64,
        accuracyPercent: 74,
        streak: 3,
      }
    : stats;
  const displayErrorCount = previewStudent ? 8 : errorCount;
  const firstName = previewStudent ? "Jordan" : getFirstName(user);
  const displayXp = previewStudent ? 480 : shellStats.xpTotal;
  const recentDays = getRecentDays();
  const displayActiveDates = previewStudent
    ? recentDays.slice(-3).map((day) => day.key)
    : shellStats.recentActiveDates;

  return (
    <DashboardPageShell
      backgroundImage="/backgrounds/dashboard-math-grid.webp"
      fadeBackground
    >
      <div className="[&_h1]:!text-[#075985]">
        <PageHeader title={`Welcome back, ${firstName}`} />
      </div>

      <div className="mt-8 space-y-4">
        <StudentProgressCard
          firstName={firstName}
          xp={displayXp}
          streak={displayStats.streak}
          recentActiveDates={displayActiveDates}
          questionsToday={displayStats.todayAttempts}
        />

        <div className="arc-card grid divide-y divide-arc-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <StatCell
            label="Target score"
            value={
              displayStats.goalScore != null ? (
                scoreDisplay(displayStats.goalScore)
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
            value={displayStats.totalAttempts}
            hint={`Today: ${displayStats.todayAttempts}`}
            icon={<CheckIcon />}
          />
          <StatCell
            label="Current accuracy"
            value={
              displayStats.accuracyPercent == null ? "—" : `${displayStats.accuracyPercent}%`
            }
            hint={`${displayStats.correctAttempts} correct`}
            icon={<ChartIcon />}
          />
        </div>

        <div className="arc-card grid divide-y divide-arc-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <StatCell
            label="Study streak"
            value={
              displayStats.streak > 0 ? (
                <>
                  {displayStats.streak}
                  <span className="ml-1.5 text-base font-normal tracking-normal text-arc-muted">
                    {displayStats.streak === 1 ? "day" : "days"}
                  </span>
                </>
              ) : (
                <span className="text-lg font-normal text-arc-heading">
                  Start your streak
                </span>
              )
            }
            hint={
              displayStats.streak > 0
                ? "Consecutive days practiced"
                : "Answer a question to begin"
            }
            icon={<FlameIcon />}
          />
          <StatCell
            label="Mistakes"
            value={displayErrorCount}
            hint={displayErrorCount === 0 ? "No missed questions" : undefined}
            icon={<XCircleIcon />}
            action={
              <Link
                href="/mistakes"
                className="arc-btn-secondary px-3 py-1 text-xs"
              >
                View mistakes
              </Link>
            }
          />
          <StatCell
            label="Question bank"
            valueClassName={typography.cardValueText}
            value={
              <span className="whitespace-nowrap">Keep practicing</span>
            }
            icon={<BooksIcon />}
            action={
              <Link
                href="/question-bank"
                className="arc-btn-secondary px-3 py-1 text-xs"
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

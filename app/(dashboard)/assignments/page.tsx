import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getStudentBootcamp,
  listStudentAssignments,
} from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Assignments · Tutormigo",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isFutureStart(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start.getTime() > today.getTime();
}

function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 11V8a4 4 0 118 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function AssignmentsPage() {
  const bootcamp = await getStudentBootcamp();
  if (!bootcamp) {
    redirect("/dashboard");
  }

  const assignments = await listStudentAssignments();

  return (
    <DashboardPageShell>
      <PageHeader title="Assignments" />

      {assignments.length === 0 ? (
        <div className="arc-card mt-8 px-6 py-8 text-center">
          <p className="arc-card-label">Assignments</p>
          <p className="mt-2 font-sans text-base font-normal text-arc-heading">
            No assignments yet.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {assignments.map((a) => {
            const hasQuestions = a.question_count > 0;
            const pct =
              a.question_count === 0
                ? 0
                : Math.min(
                    100,
                    Math.round((a.completed_count / a.question_count) * 100)
                  );
            const isComplete =
              hasQuestions && a.completed_count >= a.question_count;
            const locked = !hasQuestions || isFutureStart(a.start_date);
            const progressLabel = hasQuestions
              ? `${a.completed_count}/${a.question_count}`
              : "0/0";

            let actionLabel = "Start";
            if (isComplete) actionLabel = "Review";
            else if (a.completed_count > 0) actionLabel = "Continue";

            return (
              <li
                key={a.id}
                className="arc-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
              >
                {/* What this is */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="arc-card-label">Assignment</p>
                    {locked ? (
                      <span
                        className="inline-flex text-[#8F8F98]"
                        title={
                          !hasQuestions
                            ? "No questions attached yet"
                            : `Opens ${formatDate(a.start_date)}`
                        }
                      >
                        <LockIcon className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 font-sans text-lg font-normal leading-snug tracking-tight text-arc-heading">
                    {a.title}
                  </p>
                  <p className="arc-card-hint mt-1.5">
                    Start {formatDate(a.start_date)} · Due{" "}
                    {formatDate(a.due_date)}
                  </p>
                </div>

                {/* How far along + what to do next */}
                <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="min-w-[7.5rem] sm:w-36">
                    <p className="arc-card-label">Progress</p>
                    <p className="mt-1 font-sans text-2xl font-normal tabular-nums leading-none tracking-tight text-arc-heading">
                      {progressLabel}
                    </p>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-arc-soft">
                      <div
                        className="h-full rounded-full bg-arc-accent transition-[width]"
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                    </div>
                    <p className="arc-card-hint mt-1.5 text-xs">
                      {!hasQuestions
                        ? "Not ready"
                        : isComplete
                          ? "Completed"
                          : `${pct}% complete`}
                    </p>
                  </div>

                  <div className="sm:min-w-[7.5rem] sm:text-right">
                    {hasQuestions && !isFutureStart(a.start_date) ? (
                      <Link
                        href={`/assignments/${a.id}`}
                        className="arc-btn-primary min-h-11 w-full px-6 py-2.5 sm:w-auto"
                      >
                        {actionLabel}
                      </Link>
                    ) : (
                      <span
                        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-arc-line bg-arc-soft px-5 py-2.5 font-sans text-sm font-semibold text-[#8F8F98] sm:w-auto"
                        title={
                          !hasQuestions
                            ? "No questions attached yet"
                            : `Opens ${formatDate(a.start_date)}`
                        }
                      >
                        <LockIcon className="h-3.5 w-3.5" />
                        {!hasQuestions ? "Not ready" : "Locked"}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPageShell>
  );
}

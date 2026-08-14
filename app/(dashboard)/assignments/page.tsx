import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getStudentBootcamp,
  listStudentAssignments,
} from "@/app/bootcamp-actions";
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

export default async function AssignmentsPage() {
  const bootcamp = await getStudentBootcamp();
  if (!bootcamp) {
    redirect("/dashboard");
  }

  const assignments = await listStudentAssignments();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Assignments"
        description={`${bootcamp.name} · complete each set by the due date`}
      />

      {assignments.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-[#E5E7EB] bg-white px-5 py-10 text-center font-sans text-sm text-arc-muted">
          No assignments yet.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {assignments.map((a) => {
            const hasQuestions = a.question_count > 0;
            return (
              <li
                key={a.id}
                className="rounded-2xl border-2 border-[#E5E7EB] bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-sans text-base font-semibold text-arc-ink">
                      {a.title}
                    </p>
                    <p className="mt-1 font-sans text-sm text-arc-muted">
                      Start {formatDate(a.start_date)} · Due {formatDate(a.due_date)}
                    </p>
                    <p className="mt-2 font-sans text-sm text-arc-ink">
                      {a.question_count === 0
                        ? "0 questions"
                        : `${a.completed_count} of ${a.question_count} completed`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {hasQuestions ? (
                      <Link
                        href={`/assignments/${a.id}`}
                        className="inline-flex items-center rounded-xl bg-[#007AFF] px-4 py-2 font-sans text-sm font-medium text-white transition hover:bg-[#0066D6]"
                      >
                        {a.completed_count > 0 ? "Continue" : "Start"}
                      </Link>
                    ) : (
                      <span
                        className="inline-flex cursor-not-allowed items-center rounded-xl bg-[#E5E7EB] px-4 py-2 font-sans text-sm font-medium text-arc-muted"
                        title="No questions attached yet"
                      >
                        Not ready
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

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdminStudentBootcampDetail,
  getProfileRole,
} from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import StudentIncorrectQuestion from "@/components/admin/StudentIncorrectQuestion";

function formatAccuracy(accuracy: number | null): string {
  if (accuracy == null) return "—";
  return `${Math.round(accuracy * 100)}%`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string; studentId: string };
}): Promise<Metadata> {
  const bootcampId = Number(params.id);
  if (!Number.isFinite(bootcampId) || !params.studentId) {
    return { title: "Student · Tutormigo" };
  }
  try {
    const detail = await getAdminStudentBootcampDetail(
      bootcampId,
      params.studentId
    );
    if (!detail) return { title: "Student · Tutormigo" };
    const name = detail.full_name?.trim() || "Student";
    return { title: `${name} · Tutormigo` };
  } catch {
    return { title: "Student · Tutormigo" };
  }
}

export default async function AdminStudentBootcampDetailPage({
  params,
}: {
  params: { id: string; studentId: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const bootcampId = Number(params.id);
  if (!Number.isFinite(bootcampId) || !params.studentId) notFound();

  const detail = await getAdminStudentBootcampDetail(
    bootcampId,
    params.studentId
  );
  if (!detail) notFound();

  return (
    <DashboardPageShell>
      <Link
        href={`/admin/bootcamps/${bootcampId}`}
        className="mb-4 inline-block font-sans text-sm text-arc-muted hover:text-arc-ink"
      >
        ← Back to {detail.bootcamp_name}
      </Link>
      <PageHeader title={detail.full_name || "Student"} />

      <section className="mt-8 space-y-6">
        <h2 className="font-sans text-base font-semibold text-arc-ink">
          Assignment progress
        </h2>

        {detail.assignments.length === 0 ? (
          <p className="font-sans text-sm text-arc-muted">
            No assignments in this bootcamp yet.
          </p>
        ) : (
          detail.assignments.map((assignment) => (
            <article
              key={assignment.assignment_id}
              className="rounded-2xl border-2 border-arc-line bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-sans text-sm font-semibold text-arc-ink">
                    {assignment.title}
                  </h3>
                  <p className="mt-1 font-sans text-xs text-arc-muted">
                    Due {assignment.due_date ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 font-sans text-sm tabular-nums text-arc-ink">
                  <div>
                    <p className="arc-card-label">
                      Completed
                    </p>
                    <p className="mt-0.5 font-medium">
                      {assignment.completed}/{assignment.total}
                    </p>
                  </div>
                  <div>
                    <p className="arc-card-label">
                      Accuracy
                    </p>
                    <p className="mt-0.5 font-medium">
                      {formatAccuracy(assignment.accuracy)}
                      {assignment.attempted > 0 ? (
                        <span className="ml-1 text-xs font-normal text-arc-muted">
                          ({assignment.correct}/{assignment.attempted})
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="arc-card-label">
                  Incorrect questions
                </p>
                {assignment.incorrect.length === 0 ? (
                  <p className="mt-2 font-sans text-sm text-arc-muted">
                    {assignment.attempted === 0
                      ? "No attempts yet."
                      : "No incorrect answers."}
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {assignment.incorrect.map((item) => (
                      <li key={`${assignment.assignment_id}-${item.question_id}`}>
                        <StudentIncorrectQuestion item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </DashboardPageShell>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import StudentIncorrectQuestion from "@/components/admin/StudentIncorrectQuestion";
import { getAdminStudentDetail, getAdminStudentPracticeTests, getProfileRole } from "@/app/actions/bootcamp";

function formatAccuracy(value: number | null) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

export default async function AdminStudentDetailPage({ params }: { params: { studentId: string } }) {
  if (await getProfileRole() !== "admin") redirect("/dashboard");
  const [detail, practiceTests] = await Promise.all([
    getAdminStudentDetail(params.studentId),
    getAdminStudentPracticeTests(params.studentId),
  ]);
  if (!detail) notFound();

  return (
    <DashboardPageShell>
      <Link href="/admin/students" className="inline-block text-sm text-arc-muted hover:text-arc-ink">
        ← Back to Students
      </Link>
      <PageHeader title={detail.full_name || "Student"} description={detail.email || undefined} />
      <section className="mt-8 space-y-5">
        <h2 className="font-sans text-base font-semibold text-arc-ink">Assignments</h2>
        {detail.assignments.length === 0 ? <p className="font-sans text-sm text-arc-muted">No assignments yet.</p> : detail.assignments.map((assignment) => (
          <article key={assignment.assignment_id} className="rounded-2xl border-2 border-arc-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h3 className="font-semibold text-arc-ink">{assignment.title}</h3><p className="mt-1 text-xs text-arc-muted">Due {assignment.due_date || "—"}</p></div>
              <div className="flex gap-6 text-sm tabular-nums">
                <div><p className="arc-card-label">Completed</p><p className="mt-1 font-medium">{assignment.completed}/{assignment.total}</p></div>
                <div><p className="arc-card-label">Accuracy</p><p className="mt-1 font-medium">{formatAccuracy(assignment.accuracy)} {assignment.attempted ? <span className="text-xs font-normal text-arc-muted">({assignment.correct}/{assignment.attempted})</span> : null}</p></div>
              </div>
            </div>
            <div className="mt-5 border-t border-arc-line pt-4">
              <p className="arc-card-label">Incorrect questions</p>
              {assignment.incorrect.length ? <ul className="mt-2 space-y-2">{assignment.incorrect.map((item) => <li key={`${assignment.assignment_id}-${item.question_id}`}><StudentIncorrectQuestion item={item} /></li>)}</ul> : <p className="mt-2 text-sm text-arc-muted">{assignment.attempted ? "No incorrect answers." : "No attempts yet."}</p>}
            </div>
          </article>
        ))}
      </section>
      <section className="mt-10 space-y-4">
        <h2 className="font-sans text-base font-semibold text-arc-ink">Practice Tests</h2>
        {practiceTests.length === 0 ? <p className="font-sans text-sm text-arc-muted">No Practice Test 1 attempts yet.</p> : practiceTests.map((test, index) => (
          <Link key={test.run_id} href={`/admin/students/${detail.student_id}/practice-tests/${test.run_id}`} className="block rounded-2xl border-2 border-arc-line bg-white p-5 transition hover:border-arc-accent">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h3 className="font-semibold text-arc-ink">{test.title}{practiceTests.length > 1 ? ` · Attempt ${practiceTests.length - index}` : ""}</h3><p className="mt-1 text-xs text-arc-muted">{test.status === "completed" ? "Completed" : "In progress"} · {test.answered}/{test.total} answered</p></div>
              <div className="text-right"><p className="arc-card-label">Reported issues</p><p className="mt-1 font-medium text-arc-ink">{test.reported_questions}</p></div>
            </div>
          </Link>
        ))}
      </section>
    </DashboardPageShell>
  );
}

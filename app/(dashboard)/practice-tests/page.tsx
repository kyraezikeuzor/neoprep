import type { Metadata } from "next";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { listPracticeTests } from "@/app/actions";

export const metadata: Metadata = { title: "Practice Tests · Tutormigo" };

export default async function PracticeTestsPage() {
  const tests = await listPracticeTests();
  return (
    <DashboardPageShell>
      <PageHeader title="Practice Tests" description="Timed SAT modules with answers revealed only after you finish." />
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {tests.map((test) => {
          const completed = test.attempts.filter((attempt) => attempt.status === "completed");
          const latestCompleted = completed[0];
          return (
            <article key={test.id} className="arc-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="arc-card-label">Digital SAT</p><h2 className="mt-2 text-xl font-semibold text-arc-ink">{test.title}</h2></div>
                {latestCompleted ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Completed</span> : null}
              </div>
              <p className="mt-2 text-sm text-arc-muted">{test.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-arc-soft p-3"><b>{test.readingCount}</b> Reading & Writing<br/><span className="text-arc-muted">2 × {test.readingMinutes} minutes</span></div><div className="rounded-xl bg-arc-soft p-3"><b>{test.mathCount}</b> Math<br/><span className="text-arc-muted">2 × {test.mathMinutes} minutes</span></div></div>
              <div className="mt-6 flex flex-wrap gap-2">
                {test.activeRunId ? <Link href={`/practice-tests/${test.id}`} className="arc-btn-primary inline-flex min-h-11 items-center px-5">Continue</Link> : null}
                {latestCompleted ? <Link href={`/practice-tests/${test.id}?run=${latestCompleted.id}`} className="arc-btn-secondary inline-flex min-h-11 items-center px-5">View results</Link> : null}
                <Link href={`/practice-tests/${test.id}?new=1`} className={latestCompleted || test.activeRunId ? "arc-btn-secondary inline-flex min-h-11 items-center px-5" : "arc-btn-primary inline-flex min-h-11 items-center px-5"}>{latestCompleted ? "Redo test" : "Start test"}</Link>
              </div>
              {completed.length > 1 ? <details className="mt-5 border-t border-arc-line pt-4"><summary className="cursor-pointer text-sm font-semibold text-arc-ink">Past attempts ({completed.length})</summary><ul className="mt-3 space-y-2">{completed.map((attempt, index) => <li key={attempt.id}><Link className="text-sm text-arc-accent underline" href={`/practice-tests/${test.id}?run=${attempt.id}`}>Attempt {completed.length - index} · {new Date(attempt.completedAt ?? attempt.startedAt).toLocaleDateString()}</Link></li>)}</ul></details> : null}
            </article>
          );
        })}
        {!tests.length ? <p className="arc-card p-6 text-sm text-arc-muted">Practice tests will appear here once the Tests migration has run.</p> : null}
      </section>
    </DashboardPageShell>
  );
}

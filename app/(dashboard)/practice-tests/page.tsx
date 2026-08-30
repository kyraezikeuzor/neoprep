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
      <PageHeader
        title="Practice Tests"
        description="Timed SAT modules with answers revealed only after you finish."
      />
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {tests.map((test) => <article key={test.id} className="arc-card p-6"><p className="arc-card-label">Digital SAT</p><h2 className="mt-2 text-xl font-semibold text-arc-ink">{test.title}</h2><p className="mt-2 text-sm text-arc-muted">{test.description}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-arc-soft p-3"><b>{test.readingCount}</b> Reading & Writing<br/><span className="text-arc-muted">{test.readingMinutes} minutes</span></div><div className="rounded-xl bg-arc-soft p-3"><b>{test.mathCount}</b> Math<br/><span className="text-arc-muted">{test.mathMinutes} minutes</span></div></div><Link href={`/practice-tests/${test.id}`} className="arc-btn-primary mt-6 inline-flex min-h-11 items-center px-5">{test.hasProgress ? "Continue" : "Start test"}</Link></article>)}
        {!tests.length ? <p className="arc-card p-6 text-sm text-arc-muted">Practice tests will appear here once the Tests migration has run.</p> : null}
      </section>
    </DashboardPageShell>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getStudentBootcamp,
  listStudentAssignments,
} from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import { isLocalStudentPreview } from "@/lib/devPreview";

export const metadata: Metadata = {
  title: "Roadmap · Tutormigo",
};

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

function focusTitle(title: string) {
  return title.replace(/^Focus Questions:\s*/i, "");
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
  const previewStudent = !bootcamp && isLocalStudentPreview;
  if (!bootcamp && !previewStudent) {
    redirect("/dashboard");
  }

  const assignments = previewStudent
    ? [
        {
          id: "local-preview-completed-set",
          title: "Focus Questions: Linear Equations",
          due_date: null,
          created_at: null,
          start_date: null,
          question_count: 10,
          completed_count: 10,
        },
        {
          id: "local-preview-focus-set",
          title: "Focus Questions: Equivalent Expressions",
          due_date: null,
          created_at: null,
          start_date: null,
          question_count: 12,
          completed_count: 5,
        },
        {
          id: "local-preview-next-set",
          title: "Focus Questions: Percentages",
          due_date: null,
          created_at: null,
          start_date: "2099-01-01",
          question_count: 10,
          completed_count: 0,
        },
      ]
    : await listStudentAssignments();

  return (
    <DashboardPageShell>
      <PageHeader title="Roadmap" />

      {assignments.length === 0 ? (
        <div className="arc-card mt-8 px-6 py-8 text-center">
          <p className="arc-card-label">Roadmap</p>
          <p className="mt-2 font-sans text-base font-normal text-arc-heading">
            Your roadmap will appear here soon.
          </p>
        </div>
      ) : (() => {
        const current =
          assignments.find((assignment) => assignment.question_count > 0 && !isFutureStart(assignment.start_date) && assignment.completed_count < assignment.question_count) ??
          assignments.find((assignment) => assignment.question_count > 0 && !isFutureStart(assignment.start_date)) ??
          assignments[0];
        const currentIndex = assignments.findIndex((assignment) => assignment.id === current.id);
        const upNext = assignments.slice(currentIndex + 1).find((assignment) => assignment.question_count > 0);
        const completedFocuses = assignments.filter((assignment) => assignment.id !== current.id && assignment.question_count > 0 && assignment.completed_count >= assignment.question_count);
        const total = current.question_count;
        const completed = current.completed_count;
        const remaining = Math.max(total - completed, 0);
        const pct = total ? Math.round((completed / total) * 100) : 0;
        const canOpen = total > 0 && !isFutureStart(current.start_date);
        const currentHref = previewStudent ? "/question-bank?practice=1&subject=math&tier=2&count=10" : `/assignments/${current.id}`;
        const topic = focusTitle(current.title);

        return (
          <div className="mt-8 space-y-4">
            <section className="arc-card px-5 py-5 sm:px-6 lg:sticky lg:top-4 lg:z-10">
              <p className="arc-section-label">Your current focus</p>
              <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="font-sans text-xl font-semibold tracking-tight text-arc-heading">Focus Questions: {topic}</h2>
                  <p className="arc-card-hint mt-1.5">{canOpen ? remaining === 0 ? "You finished this focus — review it to reinforce the pattern." : `${remaining} question${remaining === 1 ? "" : "s"} left · unlock your next focus by finishing this one` : "This focus will unlock when your current work is complete."}</p>
                  <div className="mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-arc-soft"><div className="h-full rounded-full bg-arc-accent transition-[width]" style={{ width: `${pct}%` }} /></div>
                  <p className="arc-card-hint mt-1.5 text-xs">{completed} of {total} complete</p>
                </div>
                {canOpen ? <Link href={currentHref} className="arc-btn-primary min-h-11 shrink-0 px-6 py-2.5">{completed > 0 ? "Continue focus" : "Start focus"}</Link> : <span className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-arc-line bg-arc-soft px-5 py-2.5 font-sans text-sm font-semibold text-[#8F8F98]"><LockIcon className="h-3.5 w-3.5" /> Locked</span>}
              </div>
            </section>
            <section className="arc-card flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className="arc-section-label">Live workshop</p><h2 className="mt-1.5 font-sans text-lg font-semibold tracking-tight text-arc-heading">Saturday · Advanced Math Q&amp;A</h2><p className="arc-card-hint mt-1">Bring questions from this week&apos;s Focus Questions.</p></div>
              <Link href="/sessions" className="arc-btn-secondary min-h-11 shrink-0 px-5 py-2.5">View class</Link>
            </section>
            <section className="arc-card flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className="arc-section-label">Optional boost</p><h2 className="mt-1.5 font-sans text-lg font-semibold tracking-tight text-arc-heading">Question Drill: {topic}</h2><p className="arc-card-hint mt-1">10 questions · Based on your recent misses.</p></div>
              <Link href="/question-bank?practice=1&subject=math&tier=2&count=10" className="arc-btn-secondary min-h-11 shrink-0 px-5 py-2.5">Start drill</Link>
            </section>
            {upNext ? <section className="arc-card flex flex-col gap-4 border-dashed px-5 py-5 opacity-75 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="arc-section-label">Up next · locked</p><h2 className="mt-1.5 font-sans text-lg font-semibold tracking-tight text-arc-heading">Focus Questions: {focusTitle(upNext.title)}</h2><p className="arc-card-hint mt-1">Finish your current Focus Questions to unlock this next step.</p></div><LockIcon className="h-5 w-5 shrink-0 text-arc-muted" /></section> : null}
            {completedFocuses.length ? <details className="arc-card px-5 py-4 sm:px-6"><summary className="cursor-pointer font-sans text-sm font-semibold text-arc-heading">Completed Focus Questions ({completedFocuses.length})</summary><div className="mt-4 space-y-3 border-t border-arc-line pt-4">{completedFocuses.map((assignment) => <div key={assignment.id} className="flex items-center justify-between gap-4"><div><p className="font-sans text-sm font-medium text-arc-heading">{focusTitle(assignment.title)}</p><p className="arc-card-hint mt-0.5 text-xs">{assignment.question_count} of {assignment.question_count} complete</p></div><span className="text-sm font-medium text-arc-muted">Completed</span></div>)}</div></details> : null}
          </div>
        );
      })()}
    </DashboardPageShell>
  );
}

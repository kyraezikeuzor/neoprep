import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import MathText from "@/components/MathText";
import { getAdminPracticeTestRunDetail, getAdminStudentDetail, getProfileRole } from "@/app/actions/bootcamp";

function answerText(answer: string | null, choices: Record<string, string> | null) {
  if (!answer) return "No answer";
  const key = answer.trim();
  if (choices?.[key]) return `${key}. ${choices[key]}`;
  const upper = key.toUpperCase();
  return choices?.[upper] ? `${upper}. ${choices[upper]}` : key;
}

export default async function PracticeTestRunReviewPage({ params }: { params: { studentId: string; runId: string } }) {
  if (await getProfileRole() !== "admin") redirect("/dashboard");
  const [student, detail] = await Promise.all([
    getAdminStudentDetail(params.studentId),
    getAdminPracticeTestRunDetail(params.studentId, params.runId),
  ]);
  if (!student || !detail) notFound();

  return (
    <DashboardPageShell>
      <Link href={`/admin/students/${params.studentId}`} className="inline-block text-sm text-arc-muted hover:text-arc-ink">← Back to {student.full_name || "student"}</Link>
      <PageHeader title={detail.run.title} description={`${detail.run.answered}/${detail.run.total} answered · ${detail.run.reported_questions} reported issue${detail.run.reported_questions === 1 ? "" : "s"}`} />
      <p className="mt-2 text-sm text-arc-muted">Reported items are credited as correct in the adjusted score.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="arc-card p-5"><p className="arc-card-label">Original score</p><p className="mt-2 font-sans text-4xl font-semibold text-arc-ink">{detail.raw.total}</p><p className="mt-1 text-sm text-arc-muted">Range {detail.raw.total_lower}–{detail.raw.total_upper} · R&W {detail.raw.reading_writing} correct · Math {detail.raw.math} correct</p></section>
        <section className="rounded-2xl border-2 border-arc-accent bg-arc-accentSoft p-5"><p className="arc-card-label text-arc-accentDeep">Adjusted score</p><p className="mt-2 font-sans text-4xl font-semibold text-arc-ink">{detail.adjusted.total}</p><p className="mt-1 text-sm text-arc-muted">Range {detail.adjusted.total_lower}–{detail.adjusted.total_upper} · R&W {detail.adjusted.reading_writing} correct · Math {detail.adjusted.math} correct</p></section>
      </div>
      <section className="mt-8 space-y-3">
        <h2 className="font-sans text-base font-semibold text-arc-ink">Question review</h2>
        {detail.questions.map((question) => (
          <details key={question.question_id} className="group rounded-2xl border border-arc-line bg-white open:border-[#D1D5DB]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden"><span className="font-medium text-arc-ink">{question.section === "math" ? "Math" : "Reading & Writing"} · Q{question.position}</span><span className={question.credited_for_report ? "text-arc-accent" : question.answered_correctly ? "text-arc-correct" : "text-arc-incorrect"}>{question.credited_for_report ? "Reported · credited" : question.answered_correctly ? "Correct" : "Incorrect"}</span></summary>
            <div className="space-y-4 border-t border-arc-line px-4 py-4 text-sm"><div className="question-prose text-arc-ink"><MathText text={question.stem} /></div><div className="grid gap-3 sm:grid-cols-2"><div><p className="arc-card-label">Student answer</p><div className="mt-1 text-arc-ink"><MathText text={answerText(question.selected_answer, question.choices)} /></div></div><div><p className="arc-card-label">Correct answer</p><div className="mt-1 text-arc-correct"><MathText text={answerText(question.correct_answer, question.choices)} /></div></div></div>{question.reports.length > 0 ? <div className="rounded-xl bg-arc-accentSoft p-3"><p className="font-medium text-arc-ink">Student report{question.reports.length > 1 ? "s" : ""}</p>{question.reports.map((report, index) => <p key={index} className="mt-1 text-arc-muted">{report.issue_type.replaceAll("_", " ")}{report.notes ? ` — ${report.notes}` : ""}</p>)}</div> : null}</div>
          </details>
        ))}
      </section>
    </DashboardPageShell>
  );
}

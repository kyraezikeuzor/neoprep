import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardShellStats } from "@/app/actions";
import {
  getStudentBootcamp,
  getStudentRoadmapSessions,
  listStudentAssignments,
} from "@/app/actions/bootcamp";
import type {
  AssignmentListItem,
  RoadmapSessionData,
} from "@/app/actions/bootcamp/types";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import StudyPlannerRoadmap, {
  EmptyRoadmap,
  previewStudyDates,
} from "@/components/roadmap/StudyPlannerRoadmap";
import { isLocalStudentPreview } from "@/lib/devPreview";
import GenerateRoadmapButton from "@/components/roadmap/GenerateRoadmapButton";

export const metadata: Metadata = {
  title: "Study Planner · Tutormigo",
};

export default async function AssignmentsPage() {
  const [bootcamp, shellStats] = await Promise.all([
    getStudentBootcamp(),
    getDashboardShellStats(),
  ]);
  // Development preview must never replace a real enrolled student's Roadmap.
  const previewStudent = !bootcamp && isLocalStudentPreview;

  const assignments: AssignmentListItem[] = previewStudent
    ? [
        {
          id: "local-preview-completed-set",
          title: "Question Set: Linear Equations",
          due_date: null,
          created_at: null,
          start_date: null,
          question_count: 10,
          completed_count: 10,
          source: "roadmap",
        },
        {
          id: "local-preview-focus-set",
          title: "Question Set: Equivalent Expressions",
          due_date: null,
          created_at: null,
          start_date: null,
          question_count: 12,
          completed_count: 5,
          source: "roadmap",
        },
        {
          id: "local-preview-next-set",
          title: "Question Set: Percentages",
          due_date: null,
          created_at: null,
          start_date: "2099-01-01",
          question_count: 10,
          completed_count: 0,
          source: "roadmap",
        },
      ]
    : await listStudentAssignments();
  const activeDates = previewStudent
    ? previewStudyDates()
    : shellStats.monthlyActiveDates;
  const liveSessions: RoadmapSessionData = previewStudent
    ? {
        next: {
          id: "local-preview-live-session",
          title: "SAT Math Masterclass",
          sessionDate: null,
          dateLabel: "Saturday",
          timeLabel: "Aug 29 · 11:00 AM CT",
        },
        attended: [],
      }
    : await getStudentRoadmapSessions();
  const bootcampAssignments = assignments
    .filter((assignment) => assignment.source === "bootcamp" && assignment.completed_count < assignment.question_count)
    .sort((a, b) => {
      const aWeek = Number(a.title.match(/\bweek\s*(\d+)\b/i)?.[1]);
      const bWeek = Number(b.title.match(/\bweek\s*(\d+)\b/i)?.[1]);
      if (Number.isFinite(aWeek) && Number.isFinite(bWeek) && aWeek !== bWeek) return aWeek - bWeek;
      return (a.due_date ?? "").localeCompare(b.due_date ?? "");
    });
  const roadmapAssignments = assignments.filter((assignment) => assignment.source === "roadmap");

  return (
    <DashboardPageShell>
      <PageHeader
        title="Study Planner"
        description="A flexible Roadmap that adapts as you complete each Question Set."
      />
      {assignments.length === 0 ? (
        <><EmptyRoadmap activeDates={activeDates} /><GenerateRoadmapButton /></>
      ) : (
        <>
          {bootcampAssignments.length > 0 ? (
            <section className="mt-8">
              <div className="mb-3"><p className="arc-card-label">Bootcamp</p><h2 className="mt-1 font-sans text-xl font-semibold text-arc-ink">Assignments to finish</h2></div>
              <div className="space-y-3">
                {bootcampAssignments.map((assignment) => {
                  const total = assignment.question_count;
                  const completed = Math.min(assignment.completed_count, total);
                  const remaining = Math.max(total - completed, 0);
                  const pct = total ? Math.round((completed / total) * 100) : 0;
                  return <article key={assignment.id} className="arc-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><p className="font-sans text-base font-semibold text-arc-ink">{assignment.title}</p><p className="mt-1 text-sm text-arc-muted">{remaining} question{remaining === 1 ? "" : "s"} left{assignment.due_date ? ` · Due ${new Date(`${assignment.due_date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</p><div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-[#E5F7FF]"><div className="h-full rounded-full bg-[#1BB1F6]" style={{ width: `${pct}%` }} /></div><p className="mt-1 text-xs text-arc-muted">{completed} of {total} complete</p></div><Link href={`/assignments/${assignment.id}`} className="arc-btn-primary min-h-11 shrink-0 px-5 py-2.5">Continue assignment</Link></article>;
                })}
              </div>
            </section>
          ) : null}
          {roadmapAssignments.length > 0 ? <StudyPlannerRoadmap assignments={roadmapAssignments} previewStudent={previewStudent} activeDates={activeDates} liveSessions={liveSessions} /> : <><EmptyRoadmap activeDates={activeDates} /><GenerateRoadmapButton /></>}
        </>
      )}
    </DashboardPageShell>
  );
}

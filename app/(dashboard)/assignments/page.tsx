import type { Metadata } from "next";
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
        },
        {
          id: "local-preview-focus-set",
          title: "Question Set: Equivalent Expressions",
          due_date: null,
          created_at: null,
          start_date: null,
          question_count: 12,
          completed_count: 5,
        },
        {
          id: "local-preview-next-set",
          title: "Question Set: Percentages",
          due_date: null,
          created_at: null,
          start_date: "2099-01-01",
          question_count: 10,
          completed_count: 0,
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
  return (
    <DashboardPageShell>
      <PageHeader
        title="Study Planner"
        description="A flexible Roadmap that adapts as you complete each Question Set."
      />
      {assignments.length === 0 ? (
        <><EmptyRoadmap activeDates={activeDates} /><GenerateRoadmapButton /></>
      ) : (
        <StudyPlannerRoadmap
          assignments={assignments}
          previewStudent={previewStudent}
          activeDates={activeDates}
          liveSessions={liveSessions}
        />
      )}
    </DashboardPageShell>
  );
}

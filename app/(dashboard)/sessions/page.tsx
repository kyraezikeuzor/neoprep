import type { Metadata } from "next";
import { getStudentSessionsPageData } from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import LiveLessonsHub from "@/components/LiveLessonsHub";
import PageHeader from "@/components/PageHeader";
import { isLocalStudentPreview } from "@/lib/devPreview";

export const metadata: Metadata = { title: "Live Classes · Tutormigo" };

export default async function SessionsPage() {
  const data = await getStudentSessionsPageData();
  const previewStudent = !data && isLocalStudentPreview;

  const next = data?.next ?? {
    sessionId: null,
    dateLabel: "Saturday",
    timeLabel: "11:00 AM CT",
    meetingUrl: null,
  };

  return (
    <DashboardPageShell
      backgroundImage="/backgrounds/dashboard-math-grid.webp"
      fadeBackground
    >
      <div className="[&_h1]:!text-[#075985]">
        <PageHeader title="Live Classes" />
      </div>
      <LiveLessonsHub
        next={next}
        upcoming={data?.upcoming ?? []}
        bootcampName={data?.bootcampName ?? (previewStudent ? "preview" : null)}
      />
    </DashboardPageShell>
  );
}

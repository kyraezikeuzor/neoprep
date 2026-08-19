import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudentSessionsPageData } from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import LiveLessonsHub from "@/components/LiveLessonsHub";
import PageHeader from "@/components/PageHeader";
import { isLocalStudentPreview } from "@/lib/devPreview";

export const metadata: Metadata = { title: "Live Lessons · Tutormigo" };

export default async function SessionsPage() {
  const data = await getStudentSessionsPageData();
  const previewStudent = !data && isLocalStudentPreview;
  if (!data && !previewStudent) redirect("/dashboard");
  const { next } = data ?? { next: { dateLabel: "Saturday", timeLabel: "11:00 AM CT", meetingUrl: null } };
  return <DashboardPageShell><PageHeader title="Live Lessons" /><LiveLessonsHub next={next} /></DashboardPageShell>;
}

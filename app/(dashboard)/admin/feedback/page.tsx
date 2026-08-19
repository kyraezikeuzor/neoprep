import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole } from "@/app/actions/bootcamp";
import { listFeedbackQueue } from "@/app/actions/tools";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import FeedbackQueueList from "@/components/admin/FeedbackQueueList";

export const metadata: Metadata = {
  title: "Admin Feedback · Tutormigo",
};

export default async function AdminFeedbackPage() {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const entries = await listFeedbackQueue();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Feedback"
        description="Handle student-reported issues and review questions that need to be fixed."
      />
      <FeedbackQueueList entries={entries} />
    </DashboardPageShell>
  );
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole } from "@/app/actions/bootcamp";
import { getQuestionReviewBacklogCount } from "@/app/actions/tools";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import StagingReviewLanding from "@/components/admin/StagingReviewLanding";

export const metadata: Metadata = {
  title: "Admin Editor · Tutormigo",
};

export default async function AdminSandboxPage({
  searchParams,
}: {
  searchParams?: { question?: string; subject?: string; tier?: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const requestedId = searchParams?.question?.trim();
  if (requestedId) redirect(`/admin/sandbox/review?question=${encodeURIComponent(requestedId)}`);

  const initialBacklogCount = await getQuestionReviewBacklogCount();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Editor"
        description="Inspect generated questions, approve the good ones, and send problems to feedback."
      />
      <StagingReviewLanding backlogCount={initialBacklogCount} />
    </DashboardPageShell>
  );
}

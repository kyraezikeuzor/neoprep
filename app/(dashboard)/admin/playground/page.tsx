import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole } from "@/app/actions/bootcamp";
import {
  getExplainerStatus,
  getPlaygroundQuestion,
  listPlaygroundQuestions,
} from "@/app/actions/tools";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import ExplainerPlayground from "@/components/admin/ExplainerPlayground";

export const metadata: Metadata = {
  title: "Admin Playground · NeoPrep",
};

export default async function AdminPlaygroundPage({
  searchParams,
}: {
  searchParams?: { question?: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const initialOptions = await listPlaygroundQuestions({
    subject: "all",
    tier: "all",
    reviewState: "verified",
  });

  const requestedId = searchParams?.question?.trim() ?? "";
  const requestedIsAvailable = initialOptions.some(
    (option) => option.question_id === requestedId
  );
  const initialQuestionId = requestedIsAvailable
    ? requestedId
    : initialOptions[0]?.question_id || "";

  const [initialQuestion, initialStatus] = initialQuestionId
    ? await Promise.all([
        getPlaygroundQuestion(initialQuestionId),
        getExplainerStatus(initialQuestionId),
      ])
    : [null, { count: 0, latestRecordedAt: null }];

  return (
    <DashboardPageShell>
      <PageHeader
        title="Playground"
        description="Browse verified questions and build the two-card social explainer carousel."
      />
      <ExplainerPlayground
        initialOptions={initialOptions}
        initialQuestion={initialQuestion}
        initialStatus={initialStatus}
      />
    </DashboardPageShell>
  );
}

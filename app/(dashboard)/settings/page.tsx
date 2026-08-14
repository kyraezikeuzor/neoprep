import type { Metadata } from "next";
import { getGoalScore } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import GoalScoreForm from "@/components/GoalScoreForm";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Settings · Tutormigo",
};

export default async function SettingsPage() {
  const goalScore = await getGoalScore();

  return (
    <DashboardPageShell narrow>
      <PageHeader title="Settings" description="Manage your ManyPrep preferences." />
      <GoalScoreForm initialGoalScore={goalScore} />
    </DashboardPageShell>
  );
}

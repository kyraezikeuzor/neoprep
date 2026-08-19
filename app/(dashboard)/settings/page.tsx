import type { Metadata } from "next";
import { getGoalScore } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import GoalScoreForm from "@/components/GoalScoreForm";
import PageHeader from "@/components/PageHeader";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Settings · Tutormigo",
};

export default async function SettingsPage() {
  const goalScore = await getGoalScore();

  return (
    <DashboardPageShell narrow>
      <PageHeader title="Settings" />
      <GoalScoreForm initialGoalScore={goalScore} />
      <div className="mt-10 border-t border-arc-line pt-6">
        <SignOutButton />
      </div>
    </DashboardPageShell>
  );
}

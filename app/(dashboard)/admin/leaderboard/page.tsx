import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getXpLeaderboard } from "@/app/actions";
import { getProfileRole } from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import LeaderboardTable from "@/components/LeaderboardTable";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Admin Leaderboard · Tutormigo",
};

export default async function AdminLeaderboardPage() {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const entries = await getXpLeaderboard();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Leaderboard"
        description="Live XP rankings across all students."
      />
      <LeaderboardTable
        entries={entries}
        emptyHint="No student attempts have been recorded yet."
      />
    </DashboardPageShell>
  );
}

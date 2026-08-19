import type { Metadata } from "next";
import { getXpLeaderboard } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import LeaderboardTable from "@/components/LeaderboardTable";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Leaderboard · Tutormigo",
};

/** Flip to true when ready to show live XP rankings again. */
const LEADERBOARD_LIVE = false;

export default async function LeaderboardPage() {
  const entries = LEADERBOARD_LIVE ? await getXpLeaderboard() : [];

  return (
    <DashboardPageShell>
      <PageHeader title="Leaderboard" />

      {!LEADERBOARD_LIVE ? (
        <div className="arc-card mt-8 px-6 py-12 text-center sm:py-14">
          <p className="arc-card-label">XP rankings</p>
          <p className="mt-3 font-sans text-xl font-medium text-arc-heading sm:text-2xl">
            Coming September 2026
          </p>
          <p className="arc-card-hint mt-2">
            The leaderboard will open once more students are practicing.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <LeaderboardTable entries={entries} />
      ) : (
        <LeaderboardTable entries={entries} />
      )}
    </DashboardPageShell>
  );
}

import type { Metadata } from "next";
import { getGoalScore } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import GoalScoreForm from "@/components/GoalScoreForm";
import PageHeader from "@/components/PageHeader";
import SignOutButton from "@/components/SignOutButton";
import BillingPortalButton from "@/components/billing/BillingPortalButton";
import UpgradeToProCard from "@/components/billing/UpgradeToProCard";
import { getCurrentQuestionAccess } from "@/lib/question-access.server";

export const metadata: Metadata = {
  title: "Settings · Tutormigo",
};

export default async function SettingsPage() {
  const [goalScore, access] = await Promise.all([
    getGoalScore(),
    getCurrentQuestionAccess(),
  ]);

  return (
    <DashboardPageShell narrow>
      <PageHeader title="Settings" />
      <GoalScoreForm initialGoalScore={goalScore} />
      <div className="mt-8 rounded-2xl border-2 border-arc-line bg-white p-5">
        <h2 className="font-dm text-xl font-medium tracking-normal text-arc-ink">
          Current plan
        </h2>
        <div className="mt-3">
          <div>
            <p className="font-sans text-lg font-semibold text-arc-heading">
              {access.planLabel}
            </p>
            <p className="mt-1 font-sans text-sm text-arc-muted">
              {access.isPro
                ? "Full access to the Tutormigo question bank."
                : `${access.uniqueQuestionsUsed} of ${access.questionLimit} free questions used.`}
            </p>
          </div>
        </div>
      </div>
      {!access.isPro ? (
        <UpgradeToProCard
          compact
          className="mt-4"
          usedQuestions={access.uniqueQuestionsUsed}
          questionLimit={access.questionLimit}
        />
      ) : null}
      {access.provider === "stripe" ? <BillingPortalButton /> : null}
      <div className="mt-10 border-t border-arc-line pt-6">
        <SignOutButton />
      </div>
    </DashboardPageShell>
  );
}

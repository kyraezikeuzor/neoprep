import type { Metadata } from "next";
import { getMasteryOverview } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import MasterySnapshot from "@/components/roadmap/MasterySnapshot";
import { isLocalStudentPreview } from "@/lib/devPreview";
import { previewMasteryOverview } from "@/lib/mastery";

export const metadata: Metadata = {
  title: "Skill Progress · Tutormigo",
};

export default async function SkillProgressPage() {
  const mastery = isLocalStudentPreview
    ? previewMasteryOverview()
    : await getMasteryOverview();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Skill Progress"
        description="See your mastery across SAT domains and the skills inside each one."
      />
      <div className="mt-8 w-full">
        <MasterySnapshot overview={mastery} />
      </div>
    </DashboardPageShell>
  );
}

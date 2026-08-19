import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole } from "@/app/actions/bootcamp";
import { listSkillGenerationCatalog } from "@/app/actions/skills";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import SkillsGenerationTable from "@/components/admin/SkillsGenerationTable";

export const metadata: Metadata = {
  title: "Generate · NeoPrep",
};

export default async function AdminGenerateQuestionsPage() {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const sections = await listSkillGenerationCatalog();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Generate"
        description="Create and generate new questions by exact SAT skill and difficulty tier."
      />
      <SkillsGenerationTable initialSections={sections} />
    </DashboardPageShell>
  );
}

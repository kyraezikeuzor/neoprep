import type { Metadata } from "next";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Practice Tests · Tutormigo" };

export default function PracticeTestsPage() {
  return (
    <DashboardPageShell>
      <PageHeader
        title="Practice Tests"
        description="Full-length SAT practice tests are coming soon."
      />
      <section className="arc-card mt-8 px-5 py-10 text-center sm:px-6">
        <p className="font-sans text-sm text-arc-muted">
          You will be able to sit timed practice tests here, then review every
          question with explanations.
        </p>
      </section>
    </DashboardPageShell>
  );
}

import type { Metadata } from "next";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Saved · Tutormigo",
};

export default function SavedPage() {
  return (
    <DashboardPageShell>
      <PageHeader
        title="Saved"
        description="Questions you’ve bookmarked for later."
      />
      <div className="mt-10 rounded-arc border border-arc-line bg-white px-5 py-10 text-center font-sans text-sm text-arc-muted">
        No saved questions yet.
      </div>
    </DashboardPageShell>
  );
}

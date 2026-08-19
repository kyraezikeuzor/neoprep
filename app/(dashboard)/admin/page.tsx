import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAdminMetrics,
  getProfileRole,
} from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import AdminMetricsOverview from "@/components/admin/AdminMetricsOverview";

export const metadata: Metadata = {
  title: "Dashboard · NeoPrep",
};

export default async function AdminPage() {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const metrics = await getAdminMetrics();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Dashboard"
        description="Business and engagement metrics for your bootcamp program."
      />
      <AdminMetricsOverview metrics={metrics} />
    </DashboardPageShell>
  );
}

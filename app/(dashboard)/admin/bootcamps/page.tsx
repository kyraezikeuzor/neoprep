import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole, listAdminBootcamps } from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import AdminBootcampManager from "@/components/admin/AdminBootcampManager";

export const metadata: Metadata = {
  title: "Admin Bootcamps · NeoPrep",
};

export default async function AdminBootcampsPage() {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const bootcamps = await listAdminBootcamps();

  return (
    <DashboardPageShell>
      <PageHeader
        title="Bootcamps"
        description="Create, share, and manage your bootcamp cohorts."
      />
      <AdminBootcampManager bootcamps={bootcamps} />
    </DashboardPageShell>
  );
}

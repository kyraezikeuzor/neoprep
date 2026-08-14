import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getProfileRole,
  listAdminBootcamps,
} from "@/app/bootcamp-actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import CreateBootcampForm from "@/components/admin/CreateBootcampForm";
import CopyJoinLinkButton from "@/components/admin/CopyJoinLinkButton";

export const metadata: Metadata = {
  title: "Admin · Tutormigo",
};

export default async function AdminPage() {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const bootcamps = await listAdminBootcamps();

  return (
    <DashboardPageShell>
      <PageHeader title="Admin" description="Create bootcamps and share join links." />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <CreateBootcampForm />

        <div>
          <h2 className="font-sans text-base font-semibold text-arc-ink">Your bootcamps</h2>
          {bootcamps.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-arc-muted">No bootcamps yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {bootcamps.map((b) => (
                <li
                  key={b.id}
                  className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/bootcamps/${b.id}`}
                        className="font-sans text-base font-semibold text-arc-ink hover:underline"
                      >
                        {b.name}
                      </Link>
                      <p className="mt-1 font-sans text-xs text-arc-muted">
                        {b.start_date ?? "—"} → {b.end_date ?? "—"}
                      </p>
                    </div>
                    <Link
                      href={`/admin/bootcamps/${b.id}`}
                      className="font-sans text-sm font-medium text-[#007AFF]"
                    >
                      Manage →
                    </Link>
                  </div>
                  <div className="mt-3">
                    <CopyJoinLinkButton joinCode={b.join_code} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
}

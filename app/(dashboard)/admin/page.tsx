import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdminMetrics,
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

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  hint,
  borderClass,
}: {
  label: string;
  value: string;
  hint?: string;
  borderClass: string;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border-2 ${borderClass} bg-white p-5`}>
      <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
        {label}
      </p>
      <div className="mt-2 flex min-h-[2.5rem] items-end">
        <p className="font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
          {value}
        </p>
      </div>
      {hint ? <p className="mt-2 font-sans text-sm text-arc-muted">{hint}</p> : null}
    </div>
  );
}

export default async function AdminPage() {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const [bootcamps, metrics] = await Promise.all([
    listAdminBootcamps(),
    getAdminMetrics(),
  ]);

  const { business, engagement } = metrics;

  return (
    <DashboardPageShell>
      <PageHeader
        title="Admin"
        description="Business metrics, engagement, and bootcamp management."
      />

      <section className="mt-8">
        <h2 className="font-sans text-base font-semibold text-arc-ink">Business</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active subscribers"
            value={String(business.activeSubscribers)}
            hint="Bootcamp plan · active"
            borderClass="border-[#D5E2EE]"
          />
          <StatCard
            label="Current MRR"
            value={formatMoney(business.mrr)}
            hint="Sum of active monthly prices"
            borderClass="border-[#DBDDED]"
          />
          <StatCard
            label="New this month"
            value={String(business.newThisMonth)}
            hint="Started this calendar month"
            borderClass="border-[#E4DCEA]"
          />
          <StatCard
            label="Canceled this month"
            value={String(business.canceledThisMonth)}
            hint="Canceled this calendar month"
            borderClass="border-[#EEDFD0]"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-[#E5E7EB] bg-white">
          <div className="border-b border-[#E5E7EB] px-4 py-3">
            <h3 className="font-sans text-sm font-semibold text-arc-ink">
              Active subscriptions
            </h3>
          </div>
          {business.activeSubscriptions.length === 0 ? (
            <p className="px-4 py-6 font-sans text-sm text-arc-muted">
              No active bootcamp subscriptions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#F9FAFB]">
                  <tr className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Plan</th>
                    <th className="px-4 py-2.5">Monthly</th>
                    <th className="px-4 py-2.5">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {business.activeSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-t border-[#E5E7EB] font-sans text-sm text-arc-ink"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {sub.student_name?.trim() || "—"}
                        </div>
                        <div className="text-xs text-arc-muted">
                          {sub.student_email ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{sub.plan}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatMoney(sub.monthly_price)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatDate(sub.started_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-sans text-base font-semibold text-arc-ink">Engagement</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Questions this week"
            value={String(engagement.questionsAnsweredThisWeek)}
            hint="Attempts in the last 7 days"
            borderClass="border-[#D5E2EE]"
          />
          <StatCard
            label="Accuracy this week"
            value={
              engagement.accuracyThisWeekPercent == null
                ? "—"
                : `${engagement.accuracyThisWeekPercent}%`
            }
            hint="Correct / total attempts"
            borderClass="border-[#EEDFD0]"
          />
          <StatCard
            label="Active students"
            value={String(engagement.activeStudentsThisWeek)}
            hint="Distinct students with attempts"
            borderClass="border-[#DBDDED]"
          />
          <StatCard
            label="Assignment completion"
            value={
              engagement.assignmentCompletionRatePercent == null
                ? "—"
                : `${engagement.assignmentCompletionRatePercent}%`
            }
            hint="This week's bootcamp assignments"
            borderClass="border-[#E4DCEA]"
          />
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
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

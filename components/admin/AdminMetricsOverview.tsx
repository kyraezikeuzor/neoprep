import type { AdminMetrics } from "@/app/actions/bootcamp";

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
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="arc-card flex flex-col p-5">
      <p className="arc-card-label">{label}</p>
      <div className="mt-2 flex min-h-[2.5rem] items-end">
        <p className="font-sans text-3xl font-semibold leading-none tabular-nums text-arc-ink">
          {value}
        </p>
      </div>
      {hint ? <p className="mt-2 font-sans text-sm text-arc-muted">{hint}</p> : null}
    </div>
  );
}

export default function AdminMetricsOverview({
  metrics,
}: {
  metrics: AdminMetrics;
}) {
  const { business, engagement } = metrics;

  return (
    <>
      <section className="mt-8">
        <h2 className="font-sans text-base font-semibold text-arc-ink">Business</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active subscribers"
            value={String(business.activeSubscribers)}
            hint="Bootcamp plan · active"
          />
          <StatCard
            label="Current MRR"
            value={formatMoney(business.mrr)}
            hint="Sum of active monthly prices"
          />
          <StatCard
            label="New this month"
            value={String(business.newThisMonth)}
            hint="Started this calendar month"
          />
          <StatCard
            label="Canceled this month"
            value={String(business.canceledThisMonth)}
            hint="Canceled this calendar month"
          />
        </div>

        <div className="arc-card mt-4 overflow-hidden">
          <div className="border-b border-arc-line px-4 py-3">
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
                  <tr className="arc-card-label">
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
                      className="border-t border-arc-line font-sans text-sm text-arc-ink"
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
          />
          <StatCard
            label="Accuracy this week"
            value={
              engagement.accuracyThisWeekPercent == null
                ? "—"
                : `${engagement.accuracyThisWeekPercent}%`
            }
            hint="Correct / total attempts"
          />
          <StatCard
            label="Active students"
            value={String(engagement.activeStudentsThisWeek)}
            hint="Distinct students with attempts"
          />
          <StatCard
            label="Assignment completion"
            value={
              engagement.assignmentCompletionRatePercent == null
                ? "—"
                : `${engagement.assignmentCompletionRatePercent}%`
            }
            hint="This week's bootcamp assignments"
          />
        </div>
      </section>
    </>
  );
}

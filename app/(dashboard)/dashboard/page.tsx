import Link from "next/link";
import { getMistakeCount, getTopicProgress } from "@/app/actions";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

function getFirstName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
} | null) {
  if (!user) return "there";

  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.given_name === "string" && meta.given_name) ||
    "";

  if (fullName.trim()) {
    return fullName.trim().split(/\s+/)[0];
  }

  const email = user.email ?? "";
  if (email.includes("@")) return email.split("@")[0];
  return "there";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [errorCount, topicProgress] = await Promise.all([
    getMistakeCount(),
    getTopicProgress(),
  ]);

  const firstName = getFirstName(user);

  return (
    <div className="h-full overflow-y-auto px-8 pb-10 pt-8 sm:px-10">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your practice at a glance"
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/mistakes"
          className="flex flex-col rounded-2xl border-2 border-[#E5E7EB] bg-white p-5 transition duration-200 hover:border-[#C4C4C4]"
        >
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Mistakes
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end">
            <p className="font-sans text-3xl font-semibold tabular-nums leading-none text-arc-ink">
              {errorCount}
            </p>
          </div>
          <p className="mt-2 font-sans text-sm font-medium text-arc-muted">
            {errorCount === 0 ? "No missed questions — nice work" : "View missed questions →"}
          </p>
        </Link>

        <Link
          href="/question-bank"
          className="flex flex-col rounded-2xl border-2 border-[#E5E7EB] bg-white p-5 transition duration-200 hover:border-[#C4C4C4]"
        >
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
            Question Bank
          </p>
          <div className="mt-2 flex min-h-[2.5rem] items-end">
            <p className="font-sans text-lg font-medium leading-none text-arc-ink">Keep practicing</p>
          </div>
          <p className="mt-2 font-sans text-sm font-medium text-arc-muted">Open question bank →</p>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="font-sans text-lg font-semibold text-[#3F3F46]">Accuracy by topic</h2>
        <p className="mt-1 font-sans text-base font-normal leading-[1.6] text-arc-muted">
          Progress across SAT domains from your practice attempts
        </p>

        <ul className="mt-5 divide-y divide-arc-line border-y border-arc-line">
          {topicProgress.map((item) => {
            const pctComplete =
              item.total === 0 ? 0 : Math.min(100, Math.round((item.completed / item.total) * 100));
            return (
              <li key={item.topic} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-sans text-sm font-medium text-arc-ink">{item.topic}</p>
                    <p className="shrink-0 font-sans text-xs tabular-nums text-arc-muted">
                      {item.completed} / {item.total}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFEFEF]">
                    <div
                      className="h-full rounded-full bg-[#9CA3AF] transition-[width]"
                      style={{ width: `${pctComplete}%` }}
                    />
                  </div>
                </div>
                <p className="shrink-0 font-sans text-sm tabular-nums text-arc-ink sm:w-16 sm:text-right">
                  <span className="font-semibold">{item.accuracy}%</span>
                  <span className="ml-1 text-arc-muted">acc</span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

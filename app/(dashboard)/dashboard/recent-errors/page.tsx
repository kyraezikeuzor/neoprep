import Link from "next/link";
import type { Metadata } from "next";
import { getRecentErrors } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Recent Errors · NeoPrep",
};

function truncateStem(stem: string, max = 140) {
  const cleaned = stem.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function formatWhen(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function RecentErrorsPage() {
  const errors = await getRecentErrors();

  return (
    <DashboardPageShell>
      <Link
        href="/dashboard"
        className="mb-4 inline-block font-sans text-sm text-arc-muted hover:text-arc-ink"
      >
        ← Back to Dashboard
      </Link>
      <PageHeader title="Recent Errors" />

      {errors.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-arc-line bg-white px-5 py-10 text-center font-sans text-sm text-arc-muted">
          No incorrect attempts yet.
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {errors.map((item) => (
            <li key={item.attempt_id}>
              <Link
                href={`/question-bank?question=${encodeURIComponent(item.question_id)}`}
                className="block rounded-2xl border-2 border-arc-line bg-white px-5 py-4 transition hover:border-arc-accent/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-sans text-xs font-medium text-arc-muted">
                      {[item.domain, item.skill].filter(Boolean).join(" · ") || "Question"}
                    </p>
                    <p className="mt-1 font-sans text-sm leading-relaxed text-arc-ink">
                      {truncateStem(item.stem)}
                    </p>
                  </div>
                  <span className="shrink-0 font-sans text-xs text-arc-muted">
                    {formatWhen(item.attempted_at)}
                  </span>
                </div>
                <p className="mt-3 font-sans text-sm font-medium text-arc-muted">Retry this question →</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  );
}

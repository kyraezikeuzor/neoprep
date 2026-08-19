import Link from "next/link";
import type { Metadata } from "next";
import { getRecentErrors } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Mistakes · NeoPrep",
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

function XCircleIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="3" />
      <path
        d="M30 30l20 20M50 30L30 50"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function MistakesPage() {
  const errors = await getRecentErrors();

  return (
    <DashboardPageShell>
      <PageHeader title="Mistakes" />

      {errors.length === 0 ? (
        <div className="arc-card relative mt-8 min-h-[9.5rem] overflow-hidden px-6 py-5">
          <p className="arc-card-label">Mistakes</p>
          <p className="mt-3 font-sans text-4xl font-normal tabular-nums leading-none tracking-tight text-arc-heading">
            0
          </p>
          <p className="arc-card-hint mt-2">No incorrect attempts yet.</p>
          <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line">
            <XCircleIcon />
          </div>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {errors.map((item) => (
            <li key={item.attempt_id}>
              <Link
                href={`/question-bank?question=${encodeURIComponent(item.question_id)}`}
                className="arc-card relative block overflow-hidden px-6 py-5 transition hover:bg-arc-soft/40"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="arc-card-label">
                      {[item.domain, item.skill].filter(Boolean).join(" · ") ||
                        "Question"}
                    </p>
                    <p className="mt-3 font-sans text-base font-normal leading-relaxed text-arc-heading">
                      {truncateStem(item.stem)}
                    </p>
                    <p className="arc-card-hint mt-3">{formatWhen(item.attempted_at)}</p>
                  </div>
                  <span className="relative z-10 inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-arc-line bg-white px-3 py-1 font-sans text-xs font-medium text-[#8F8F98]">
                    Retry
                  </span>
                </div>
                <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line opacity-70">
                  <XCircleIcon />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  );
}

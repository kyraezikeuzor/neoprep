import Link from "next/link";
import type { Metadata } from "next";
import { listBookmarks } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Saved · Tutormigo",
};

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <path
        d="M28 18h24a4 4 0 014 4v40l-16-10-16 10V22a4 4 0 014-4z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function truncateStem(stem: string, max = 140) {
  const cleaned = stem.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function tierLabel(tier: number | null) {
  if (tier === 1) return "Easy";
  if (tier === 2) return "Medium";
  if (tier === 3) return "Hard";
  return null;
}

export default async function SavedPage() {
  const bookmarks = await listBookmarks();
  const count = bookmarks.length;

  return (
    <DashboardPageShell>
      <PageHeader title="Saved" />

      {count === 0 ? (
        <div className="arc-card mt-8 grid divide-y divide-arc-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="relative min-h-[9.5rem] overflow-hidden px-6 py-5">
            <p className="arc-card-label">Saved questions</p>
            <p className="mt-3 font-sans text-4xl font-normal tabular-nums leading-none tracking-tight text-arc-heading">
              0
            </p>
            <p className="arc-card-hint mt-2">
              Bookmarked questions will show up here.
            </p>
            <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line">
              <BookmarkIcon />
            </div>
          </div>

          <div className="relative flex min-h-[9.5rem] flex-col overflow-hidden px-6 py-5">
            <p className="arc-card-label">Quick tip</p>
            <p className="mt-3 font-sans text-xl font-normal leading-snug tracking-tight text-arc-heading">
              Save as you practice
            </p>
            <p className="arc-card-hint mt-2">
              Bookmark tough questions from the practice
              <br />
              screen to revisit them later.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="arc-card relative mt-8 min-h-[9.5rem] overflow-hidden px-6 py-5 sm:max-w-sm">
            <p className="arc-card-label">Saved questions</p>
            <p className="mt-3 font-sans text-4xl font-normal tabular-nums leading-none tracking-tight text-arc-heading">
              {count}
            </p>
            <p className="arc-card-hint mt-2">Marked for review</p>
            <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line">
              <BookmarkIcon />
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {bookmarks.map((item) => {
              const topic =
                [item.domain, tierLabel(item.tier)].filter(Boolean).join(" · ") ||
                "Question";
              return (
                <li key={item.bookmark_id}>
                  <Link
                    href={`/question-bank?question=${encodeURIComponent(item.question_id)}&practice=1&count=1`}
                    className="arc-card relative block overflow-hidden px-6 py-5 transition hover:bg-arc-soft/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="arc-card-label">{topic}</p>
                        <p className="mt-3 font-sans text-base font-normal leading-relaxed text-arc-heading">
                          {truncateStem(item.stem)}
                        </p>
                      </div>
                      <span className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-full border border-arc-line bg-white px-3 py-1 font-sans text-xs font-medium text-arc-muted">
                        Open
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </DashboardPageShell>
  );
}

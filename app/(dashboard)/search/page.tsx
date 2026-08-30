import Link from "next/link";
import type { Metadata } from "next";
import { searchQuestions } from "@/app/actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Search · Tutormigo" };

function truncateStem(stem: string, max = 160) {
  const cleaned = stem.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q?.trim() ?? "";
  const hits = query.length >= 2 ? await searchQuestions(query, 30) : [];

  return (
    <DashboardPageShell>
      <PageHeader
        title="Search"
        description={
          query
            ? `Results for “${query}”`
            : "Search questions by skill, topic, or wording."
        }
      />

      {query.length < 2 ? (
        <section className="arc-card mt-8 px-5 py-10 text-center sm:px-6">
          <p className="font-sans text-sm text-arc-muted">
            Type at least two characters in the search bar to find questions.
          </p>
        </section>
      ) : hits.length === 0 ? (
        <section className="arc-card mt-8 px-5 py-10 text-center sm:px-6">
          <p className="font-sans text-sm text-arc-muted">
            No questions matched that search.
          </p>
        </section>
      ) : (
        <div className="mt-8 space-y-3">
          {hits.map((hit) => (
            <Link
              key={hit.question_id}
              href={`/question-bank?practice=1&question=${encodeURIComponent(hit.question_id)}`}
              className="arc-card block px-5 py-4 transition hover:bg-arc-soft sm:px-6"
            >
              <p className="font-sans text-sm text-arc-heading">
                {truncateStem(hit.stem)}
              </p>
              <p className="mt-1 font-sans text-xs text-arc-muted">
                {[hit.domain, hit.skill].filter(Boolean).join(" · ") ||
                  hit.question_id}
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardPageShell>
  );
}

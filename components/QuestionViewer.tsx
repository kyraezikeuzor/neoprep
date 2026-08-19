"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";

export default function QuestionViewer({
  initialId = "",
  headerTitle = "Question Search",
}: {
  initialId?: string;
  headerTitle?: string;
}) {
  const router = useRouter();
  const [inputId, setInputId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = inputId.trim();
    if (!id) {
      setError("Enter a question ID.");
      return;
    }

    setLoading(true);
    setError("");
    router.push(`/admin/question-search/view?question=${encodeURIComponent(id)}`);
  }

  return (
    <DashboardPageShell narrow>
      <div className="font-sans">
        <PageHeader title={headerTitle} />

        <div className="arc-card mt-5 p-5 sm:p-6">
          <form onSubmit={handleLookup} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Question ID"
              spellCheck={false}
              className="min-w-[12rem] flex-1 rounded-lg border border-arc-line bg-white px-3 py-2.5 font-mono text-sm text-arc-ink outline-none focus:border-arc-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-arc-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-arc-accentDeep disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load question"}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-arc-incorrect">{error}</p>}
          {!error && <p className="mt-5 text-center text-base font-normal leading-[1.6] text-arc-muted">Enter a question ID to open it in the full-screen viewer.</p>}
        </div>
      </div>
    </DashboardPageShell>
  );
}

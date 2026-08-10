"use client";

import { useState } from "react";
import { getQuestionById, type Question } from "@/app/actions";
import QuestionCard from "@/components/QuestionCard";
import PageHeader from "@/components/PageHeader";

export default function QuestionViewer({
  initialQuestion = null,
  initialId = "",
}: {
  initialQuestion?: Question | null;
  initialId?: string;
}) {
  const [inputId, setInputId] = useState(initialId);
  const [question, setQuestion] = useState<Question | null>(initialQuestion);
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
    const result = await getQuestionById(id);
    setLoading(false);

    if (!result) {
      setQuestion(null);
      setError(`No question found for ID “${id}”.`);
      return;
    }

    setQuestion(result);
    setInputId(result.question_id);
  }

  return (
    <div className="h-full overflow-y-auto px-6 pb-10 pt-8 font-sans sm:px-10">
      <div className="mx-auto w-full max-w-[750px]">
        <PageHeader
          title="Question Search"
          description="Look up any question by its ID (short hex or full UUID)."
        />

        <div className="mt-5 rounded-2xl border border-[#E8E8E6] bg-[#F9FAFB] p-5 sm:p-6">
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
          {question && !error && (
            <p className="mt-3 text-sm font-normal leading-[1.6] text-arc-muted">
              Showing{" "}
              <span className="font-mono font-medium text-arc-ink">{question.question_id}</span>
            </p>
          )}

          {question ? (
            <div className="mt-3 h-[min(70vh,720px)] min-h-[420px] overflow-hidden rounded-xl border border-arc-line bg-white">
              <QuestionCard
                key={question.question_id}
                initialQuestion={question}
                embedded
              />
            </div>
          ) : (
            !error && (
              <p className="mt-8 pb-4 text-center text-base font-normal leading-[1.6] text-arc-muted">
                Enter a question ID above to view it.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

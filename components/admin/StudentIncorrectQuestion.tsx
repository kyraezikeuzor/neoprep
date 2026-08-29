"use client";

import MathText from "@/components/MathText";
import Link from "next/link";
import type { AdminStudentIncorrectQuestion } from "@/app/actions/bootcamp";

function formatAnswerDisplay(
  answer: string | null,
  choices: Record<string, string> | null
): string {
  if (answer == null || answer === "") return "—";
  const key = answer.trim();
  if (choices && key in choices) return `${key}. ${choices[key]}`;
  const upper = key.toUpperCase();
  if (choices && upper in choices) return `${upper}. ${choices[upper]}`;
  return key;
}

export default function StudentIncorrectQuestion({
  item,
}: {
  item: AdminStudentIncorrectQuestion;
}) {
  const tag = [item.domain, item.skill].filter(Boolean).join(" · ") || "Untagged";

  return (
    <details className="group rounded-xl border border-arc-line bg-white open:border-[#D1D5DB]">
      <summary className="cursor-pointer list-none px-4 py-3 font-sans text-sm marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-arc-ink">{tag}</p>
            <p className="mt-0.5 text-xs text-arc-muted">
              Incorrect · tap to review response
            </p>
          </div>
          <span className="shrink-0 text-xs text-arc-muted group-open:hidden">
            Show
          </span>
          <span className="hidden shrink-0 text-xs text-arc-muted group-open:inline">
            Hide
          </span>
        </div>
      </summary>
      <div className="space-y-3 border-t border-arc-line px-4 py-3">
        <div>
          <p className="arc-card-label">
            Question
          </p>
          <div className="mt-1 font-sans text-sm text-arc-ink">
            <MathText text={item.stem || "(No stem)"} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="arc-card-label">
              Student answer
            </p>
            <div className="mt-1 font-sans text-sm text-red-700">
              <MathText
                text={formatAnswerDisplay(item.selected_answer, item.choices)}
              />
            </div>
          </div>
          <div>
            <p className="arc-card-label">
              Correct answer
            </p>
            <div className="mt-1 font-sans text-sm text-emerald-700">
              <MathText
                text={formatAnswerDisplay(item.correct_answer, item.choices)}
              />
            </div>
          </div>
        </div>
        <Link
          href={`/question-bank?practice=1&question=${encodeURIComponent(item.question_id)}`}
          className="arc-btn-secondary inline-flex min-h-10 items-center px-4 text-sm"
        >
          Re-answer this question
        </Link>
      </div>
    </details>
  );
}

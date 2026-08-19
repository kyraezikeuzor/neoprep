"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAssignment,
  listQuestionsForPicker,
  type BankQuestionOption,
} from "@/app/actions/bootcamp";
import type { SubjectFilter, TierFilter } from "@/lib/subjects";

function truncate(stem: string, max = 90) {
  const cleaned = stem.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

export default function CreateAssignmentForm({ bootcampId }: { bootcampId: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [questions, setQuestions] = useState<BankQuestionOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  function loadQuestions() {
    startTransition(async () => {
      const rows = await listQuestionsForPicker({ subject, tier, limit: 100 });
      setQuestions(rows);
    });
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createAssignment({
      bootcampId,
      title,
      dueDate,
      questionIds: [...selected],
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle("");
    setDueDate("");
    setSelected(new Set());
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="arc-card space-y-4 p-5">
      <h2 className="font-sans text-base font-semibold text-arc-ink">Create assignment</h2>

      <label className="block">
        <span className="font-sans text-xs font-medium text-arc-muted">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-arc-line px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
          placeholder="SAT Bootcamp Week 3"
        />
      </label>

      <label className="block">
        <span className="font-sans text-xs font-medium text-arc-muted">Due date</span>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-arc-line px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="font-sans text-xs font-medium text-arc-muted">Topic</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectFilter)}
            className="mt-1 block rounded-lg border border-arc-line px-3 py-2 font-sans text-sm"
          >
            <option value="all">All topics</option>
            <option value="math">Math</option>
            <option value="reading_writing">Reading & Writing</option>
          </select>
        </label>
        <label className="block">
          <span className="font-sans text-xs font-medium text-arc-muted">Difficulty</span>
          <select
            value={String(tier)}
            onChange={(e) => {
              const v = e.target.value;
              setTier(v === "all" ? "all" : (Number(v) as 1 | 2 | 3));
            }}
            className="mt-1 block rounded-lg border border-arc-line px-3 py-2 font-sans text-sm"
          >
            <option value="all">All difficulties</option>
            <option value="1">Easy</option>
            <option value="2">Medium</option>
            <option value="3">Hard</option>
          </select>
        </label>
        <button
          type="button"
          onClick={loadQuestions}
          disabled={pending}
          className="rounded-full border border-arc-line px-4 py-2 font-sans text-sm font-semibold text-arc-ink hover:bg-arc-soft disabled:opacity-60"
        >
          {pending ? "Loading..." : "Apply filters"}
        </button>
      </div>

      <p className="font-sans text-xs text-arc-muted">
        {selected.size} selected · showing {questions.length} questions
      </p>

      <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-arc-line p-2">
        {questions.map((q) => {
          const checked = selected.has(q.question_id);
          return (
            <li key={q.question_id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-arc-bg">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(q.question_id)}
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="block font-sans text-xs text-arc-muted">
                    {[q.domain, q.skill, q.tier != null ? `Tier ${q.tier}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="mt-0.5 block font-sans text-sm text-arc-ink">
                    {truncate(q.stem)}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
        {questions.length === 0 && (
          <li className="px-2 py-6 text-center font-sans text-sm text-arc-muted">
            No questions for these filters.
          </li>
        )}
      </ul>

      {error && <p className="font-sans text-sm text-[#C4372D]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="arc-btn-primary disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create assignment"}
      </button>
    </form>
  );
}

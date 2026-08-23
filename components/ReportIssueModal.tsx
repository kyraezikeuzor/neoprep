"use client";

import { useEffect, useId, useState } from "react";
import {
  submitQuestionReport,
  type QuestionReportIssueType,
} from "@/app/actions";

const ISSUE_OPTIONS: { value: QuestionReportIssueType; label: string }[] = [
  { value: "issue_with_explanation", label: "Issue with explanation" },
  { value: "wrong_answer_marked_correct", label: "Wrong answer marked as correct" },
  { value: "explanation_incorrect", label: "Explanation is incorrect" },
  { value: "formatting_display_issue", label: "Formatting/display issue" },
  { value: "other", label: "Other issue" },
];

export default function ReportIssueModal({
  open,
  questionId,
  onClose,
}: {
  open: boolean;
  questionId: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [issueType, setIssueType] = useState<QuestionReportIssueType>("other");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIssueType("other");
    setNotes("");
    setSubmitting(false);
    setError(null);
    setSuccess(false);
  }, [open, questionId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await submitQuestionReport({
      questionId,
      issueType,
      notes,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    window.setTimeout(() => {
      onClose();
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close report dialog"
        className="absolute inset-0 bg-arc-ink/30"
        onClick={() => !submitting && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-arc-line bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.14)] sm:p-6"
      >
        <h2 id={titleId} className="font-sans text-lg font-semibold text-arc-ink">
          Report an issue
        </h2>
        <p className="mt-1 font-sans text-sm font-normal text-arc-muted">
          Tell us what’s wrong with this question.
        </p>

        {success ? (
          <p className="mt-6 rounded-xl bg-arc-correctBg px-4 py-3 font-sans text-sm font-medium text-arc-correct">
            Thanks — your report was submitted.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <fieldset className="space-y-1">
              <legend className="mb-2 font-sans text-sm font-medium text-arc-muted">
                What’s the issue?
              </legend>
              <div className="space-y-0.5" role="radiogroup" aria-label="Issue type">
                {ISSUE_OPTIONS.map((opt) => {
                  const selected = issueType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-arc-soft"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected
                            ? "border-arc-ink bg-arc-ink"
                            : "border-[#D1D5DB] bg-white"
                        }`}
                        aria-hidden
                      >
                        {selected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="issueType"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setIssueType(opt.value)}
                        className="sr-only"
                      />
                      <span
                        className={`font-sans text-sm font-normal ${
                          selected ? "text-arc-ink" : "text-arc-muted"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="report-notes"
                className="mb-2 block font-sans text-sm font-medium text-arc-muted"
              >
                Additional details
              </label>
              <textarea
                id="report-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Optional. Add any details that might help"
                className="w-full resize-y rounded-xl border border-arc-line bg-white px-3 py-2.5 font-sans text-sm font-normal text-arc-ink outline-none transition placeholder:text-arc-muted focus:border-arc-accent"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-arc-incorrectBg px-3 py-2 font-sans text-sm text-arc-incorrect">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="arc-btn-secondary px-4 py-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-arc-accent px-4 py-2 font-sans text-sm font-semibold text-white transition hover:bg-arc-accentDeep disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

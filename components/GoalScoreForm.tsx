"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateGoalScore } from "@/app/actions";

export default function GoalScoreForm({
  initialGoalScore,
}: {
  initialGoalScore: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(
    initialGoalScore != null ? String(initialGoalScore) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function persist(score: number | null) {
    setLoading(true);
    setError("");
    setSaved(false);

    const result = await updateGoalScore(score);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (result.goalScore == null) setValue("");
    else setValue(String(result.goalScore));
    setSaved(true);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    const score = trimmed === "" ? null : Number(trimmed);
    await persist(score);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="arc-card mt-8 space-y-4 p-5"
    >
      <div>
        <h2 className="font-sans text-base font-semibold text-arc-ink">
          Goal score
        </h2>
        <p className="mt-1 font-sans text-sm text-arc-muted">
          Set the SAT total you&apos;re aiming for (400–1600). This shows on your
          dashboard.
        </p>
      </div>

      <label className="block">
        <span className="font-sans text-xs font-medium text-arc-muted">
          Target score
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={400}
          max={1600}
          step={10}
          placeholder="e.g. 1450"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          className="mt-1.5 w-full rounded-xl border border-arc-line bg-white px-3 py-2.5 font-sans text-sm text-arc-ink outline-none transition focus:border-arc-accent"
        />
      </label>

      {error ? (
        <p className="font-sans text-sm text-red-600">{error}</p>
      ) : null}
      {saved ? (
        <p className="font-sans text-sm text-emerald-700">Goal score saved.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading}
          className="arc-btn-primary"
        >
          {loading ? "Saving…" : "Save goal"}
        </button>
        {value.trim() !== "" ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => persist(null)}
            className="arc-btn-secondary text-arc-muted"
          >
            Clear
          </button>
        ) : null}
      </div>
    </form>
  );
}

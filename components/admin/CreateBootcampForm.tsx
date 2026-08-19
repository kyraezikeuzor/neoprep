"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBootcamp } from "@/app/actions/bootcamp";

export default function CreateBootcampForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createBootcamp({ name, startDate, endDate });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setStartDate("");
    setEndDate("");
    router.push(`/admin/bootcamps/${result.bootcamp.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="arc-card space-y-4 p-5">
      <h2 className="font-sans text-base font-semibold text-arc-ink">Create bootcamp</h2>
      <label className="block">
        <span className="font-sans text-xs font-medium text-arc-muted">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
          placeholder="SAT Bootcamp Summer 2026"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-sans text-xs font-medium text-arc-muted">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
          />
        </label>
        <label className="block">
          <span className="font-sans text-xs font-medium text-arc-muted">End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-arc-accent"
          />
        </label>
      </div>
      {error && <p className="font-sans text-sm text-[#C4372D]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="arc-btn-primary disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create bootcamp"}
      </button>
    </form>
  );
}

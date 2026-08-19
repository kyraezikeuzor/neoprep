"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrollStudentIntoBootcamp } from "@/app/actions/bootcamp";

/** Manual admin enrollment — creates enrollments row + Cal.com booking. */
export default function EnrollStudentForm({ bootcampId }: { bootcampId: number }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const result = await enrollStudentIntoBootcamp({
      studentId: studentId.trim(),
      bootcampId,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.bookingFailed) {
      setNotice(
        `Student enrolled, but Cal.com booking failed: ${result.bookingError ?? "unknown error"}. Follow up manually.`
      );
    } else {
      setNotice("Student enrolled and Cal.com booking requested.");
    }
    setStudentId("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="arc-card space-y-3 p-4"
    >
      <h3 className="font-sans text-sm font-semibold text-arc-ink">Enroll student</h3>
      <p className="font-sans text-xs text-arc-muted">
        Paste a student profile id (UUID). Creates an active enrollment and books them into the
        bootcamp&apos;s Cal.com event when configured.
      </p>
      <label className="block">
        <span className="font-sans text-xs font-medium text-arc-muted">Student ID</span>
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="uuid…"
          className="mt-1 w-full rounded-lg border border-arc-line bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-arc-accent"
          required
        />
      </label>
      {error ? <p className="font-sans text-sm text-[#C4372D]">{error}</p> : null}
      {notice ? <p className="font-sans text-sm text-arc-muted">{notice}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="arc-btn-primary disabled:opacity-60"
      >
        {loading ? "Enrolling…" : "Enroll student"}
      </button>
    </form>
  );
}

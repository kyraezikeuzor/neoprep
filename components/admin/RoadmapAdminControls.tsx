"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAdminLiveClass, generateAdminRoadmapAssignment } from "@/app/actions/bootcamp";

export function GenerateStudentSetButton({ studentId }: { studentId: string }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [error, setError] = useState("");
  return <div><button className="arc-btn-secondary min-h-9 px-3 text-xs" disabled={pending} onClick={() => start(async () => { const result = await generateAdminRoadmapAssignment(studentId); if (!result.ok) setError(result.error); else router.refresh(); })}>{pending ? "Generating…" : "Generate set"}</button>{error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}</div>;
}

export function CreateLiveClassForm() {
  const router = useRouter(); const [pending, start] = useTransition(); const [error, setError] = useState("");
  return <form className="arc-card grid gap-3 p-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); start(async () => { const result = await createAdminLiveClass({ title: String(form.get("title")), startsAt: String(form.get("startsAt")), durationMinutes: Number(form.get("duration")), timezone: String(form.get("timezone")), meetingUrl: String(form.get("meetingUrl") || "") }); if (!result.ok) setError(result.error); else { event.currentTarget.reset(); router.refresh(); } }); }}><input name="title" required placeholder="Class title" className="rounded-lg border border-arc-line px-3 py-2" /><input name="startsAt" required type="datetime-local" className="rounded-lg border border-arc-line px-3 py-2" /><input name="duration" type="number" min="15" defaultValue="60" className="rounded-lg border border-arc-line px-3 py-2" /><input name="timezone" defaultValue="America/Chicago" className="rounded-lg border border-arc-line px-3 py-2" /><input name="meetingUrl" type="url" placeholder="Meeting link (optional)" className="rounded-lg border border-arc-line px-3 py-2 md:col-span-2" /><button disabled={pending} className="arc-btn-primary min-h-10 px-4 md:w-fit">{pending ? "Creating…" : "Create live class"}</button>{error ? <p className="text-sm text-red-600">{error}</p> : null}</form>;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { SkillCatalogSection } from "@/lib/question-generation/metadata";
import { MATH_DOMAINS, READING_DOMAINS, type SubjectFilter } from "@/lib/subjects";
import { listGenerationPatterns } from "@/app/actions/skills";

type Message = { tone: "success" | "error"; text: string; reviewHref?: string };
type GenerateResponse =
  | { ok: true; addedCount: number; questionIds: string[]; anthropicModel: string }
  | { ok: false; error: string };

const TIER_OPTIONS = [
  { value: 1 as const, label: "Easy" },
  { value: 2 as const, label: "Medium" },
  { value: 3 as const, label: "Hard" },
];
const BATCH_OPTIONS = [1, 3, 5, 10] as const;

function toggleClass(selected: boolean) {
  return selected
    ? "min-h-11 rounded-xl border border-arc-accent bg-arc-accentSoft px-4 py-2.5 font-sans text-sm font-medium text-arc-accent transition"
    : "min-h-11 rounded-xl border border-arc-line bg-transparent px-4 py-2.5 font-sans text-sm font-medium text-arc-heading transition hover:bg-arc-soft";
}

function OptionRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="px-5 py-4 sm:px-6"><p className="arc-card-label mb-2.5">{label}</p><div className="flex flex-wrap gap-2">{children}</div></div>;
}

function updateCounts(sections: SkillCatalogSection[], domain: string, skill: string, tier: 1 | 2 | 3, delta: number) {
  return sections.map((section) => section.domain !== domain ? section : {
    ...section,
    skills: section.skills.map((entry) => entry.skill !== skill ? entry : {
      ...entry,
      tiers: { ...entry.tiers, [tier]: { ...entry.tiers[tier], total: entry.tiers[tier].total + delta } },
    }),
  });
}

export default function SkillsGenerationTable({ initialSections }: { initialSections: SkillCatalogSection[] }) {
  const [sections, setSections] = useState(initialSections);
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [domain, setDomain] = useState("");
  const [skill, setSkill] = useState("");
  const [tier, setTier] = useState<1 | 2 | 3>(2);
  const [batchSize, setBatchSize] = useState<(typeof BATCH_OPTIONS)[number]>(3);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<{ id: number; name: string; description: string }[]>([]);
  const [patternId, setPatternId] = useState<number | null>(null);

  const visibleSections = useMemo(() => sections.filter((section) => {
    if (subject === "math") return (MATH_DOMAINS as readonly string[]).includes(section.domain);
    if (subject === "reading_writing") return (READING_DOMAINS as readonly string[]).includes(section.domain);
    return true;
  }), [sections, subject]);

  useEffect(() => {
    if (!visibleSections.some((section) => section.domain === domain)) setDomain(visibleSections[0]?.domain ?? "");
  }, [domain, visibleSections]);

  const selectedSection = visibleSections.find((section) => section.domain === domain) ?? null;

  useEffect(() => {
    if (!selectedSection?.skills.some((entry) => entry.skill === skill)) setSkill(selectedSection?.skills[0]?.skill ?? "");
  }, [selectedSection, skill]);

  const selectedSkill = selectedSection?.skills.find((entry) => entry.skill === skill) ?? null;
  useEffect(() => {
    if (!selectedSection || !selectedSkill) return;
    setPatterns([]); setPatternId(null);
    void listGenerationPatterns(selectedSection.domain, selectedSkill.skill, tier).then((next) => {
      setPatterns(next); setPatternId(next[0]?.id ?? null);
    });
  }, [selectedSection, selectedSkill, tier]);
  const inventory = selectedSkill?.tiers[tier] ?? null;
  const unreviewed = inventory ? inventory.total - inventory.verified : 0;

  async function handleGenerate() {
    if (!selectedSection || !selectedSkill || !patternId) return;
    setLoading(true); setMessage(null); setProgress(["Connecting to the generator…"]);
    try {
      const response = await fetch("/api/admin/skills/generate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: selectedSection.domain, skill: selectedSkill.skill, tier, count: batchSize, patternId }),
      });
      if (!response.ok || !response.body) {
        const payload = await response.json() as GenerateResponse;
        throw new Error("error" in payload ? payload.error : "Question generation failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const payload = JSON.parse(event.slice(6)) as Record<string, unknown>;
          if (payload.type === "progress" && typeof payload.message === "string") {
            setProgress((steps) => steps.includes(payload.message as string) ? steps : [...steps, payload.message as string]);
          }
          if (payload.type === "error") throw new Error(typeof payload.error === "string" ? payload.error : "Question generation failed.");
          if (payload.type === "complete") {
            const addedCount = Number(payload.addedCount) || 0;
            const questionIds = Array.isArray(payload.questionIds) ? payload.questionIds.filter((id): id is string => typeof id === "string") : [];
            const anthropicModel = typeof payload.anthropicModel === "string" ? payload.anthropicModel : "Claude";
            setSections((previous) => updateCounts(previous, selectedSection.domain, selectedSkill.skill, tier, addedCount));
            setMessage({ tone: "success", text: `Added ${addedCount} question${addedCount === 1 ? "" : "s"} with ${anthropicModel}.`, reviewHref: questionIds[0] ? `/admin/sandbox/review?question=${encodeURIComponent(questionIds[0])}` : undefined });
            setProgress((steps) => [...steps, "Generation complete."]);
            completed = true;
          }
        }
      }
      if (!completed) throw new Error("The generation stream ended before completing.");
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Question generation failed." });
    } finally { setLoading(false); }
  }

  return <div className="mt-8 space-y-4">
    <div className="arc-card p-5 sm:p-6"><p className="font-sans text-sm leading-relaxed text-arc-muted">Choose the exact question type to generate. New questions are added to Editor as <span className="font-medium text-arc-ink">unverified</span> until they are reviewed.</p></div>
    <div className="arc-card divide-y divide-arc-line">
      <OptionRow label="Subject">
        {[{ value: "all" as const, label: "All" }, { value: "math" as const, label: "Math" }, { value: "reading_writing" as const, label: "R and W" }].map((option) => <button key={option.value} type="button" onClick={() => setSubject(option.value)} className={toggleClass(subject === option.value)} aria-pressed={subject === option.value}>{option.label}</button>)}
      </OptionRow>
      <OptionRow label="Domain">
        {visibleSections.map((section) => <button key={section.domain} type="button" onClick={() => setDomain(section.domain)} className={toggleClass(domain === section.domain)} aria-pressed={domain === section.domain}>{section.domain}</button>)}
      </OptionRow>
      <OptionRow label="Skill">
        {selectedSection?.skills.map((entry) => <button key={entry.id} type="button" onClick={() => setSkill(entry.skill)} className={toggleClass(skill === entry.skill)} aria-pressed={skill === entry.skill}>{entry.skill}</button>)}
      </OptionRow>
      <OptionRow label="Difficulty">
        {TIER_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => setTier(option.value)} className={toggleClass(tier === option.value)} aria-pressed={tier === option.value}>{option.label}</button>)}
      </OptionRow>
      <OptionRow label="Pattern">
        {patterns.length ? patterns.map((pattern) => <button key={pattern.id} type="button" title={pattern.description} onClick={() => setPatternId(pattern.id)} className={toggleClass(patternId === pattern.id)} aria-pressed={patternId === pattern.id}>{pattern.name}</button>) : <p className="text-sm text-arc-muted">No active patterns are configured for this skill and tier.</p>}
      </OptionRow>
      <OptionRow label="Questions to generate">
        {BATCH_OPTIONS.map((count) => <button key={count} type="button" onClick={() => setBatchSize(count)} className={toggleClass(batchSize === count)} aria-pressed={batchSize === count}>{count}</button>)}
      </OptionRow>
      <div className="grid divide-y divide-arc-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-5 sm:px-6"><p className="arc-card-label">Questions already available</p><p className="mt-2 font-sans text-2xl font-normal tabular-nums tracking-tight text-arc-heading">{inventory?.total ?? 0}</p><p className="arc-card-hint mt-2">Exact domain, skill, and difficulty</p></div>
        <div className="px-5 py-5 sm:px-6"><p className="arc-card-label">Approved</p><p className="mt-2 font-sans text-2xl font-normal tabular-nums tracking-tight text-arc-heading">{inventory?.verified ?? 0}</p><p className="arc-card-hint mt-2">Ready for learners</p></div>
        <div className="px-5 py-5 sm:px-6"><p className="arc-card-label">Awaiting review</p><p className="mt-2 font-sans text-2xl font-normal tabular-nums tracking-tight text-arc-heading">{unreviewed}</p><p className="arc-card-hint mt-2">Currently in Editor</p></div>
      </div>
      <div className="px-5 py-5 sm:px-6">
        <button type="button" onClick={() => void handleGenerate()} disabled={loading || !selectedSkill || !patternId} className="arc-btn-primary w-full py-3 text-base disabled:opacity-60">{loading ? "Generating..." : `Generate ${batchSize} question${batchSize === 1 ? "" : "s"}`}</button>
        {message ? <div className="mt-4 text-sm leading-6"><p className={message.tone === "success" ? "text-[#15803D]" : "text-arc-incorrect"}>{message.text}</p>{message.reviewHref ? <Link href={message.reviewHref} className="mt-1 inline-block font-medium text-arc-accent hover:underline">Review in Editor →</Link> : null}</div> : null}
      </div>
    </div>
    {progress.length > 0 ? <section className="arc-card px-5 py-5 sm:px-6" aria-live="polite">
      <p className="arc-card-label">Generation progress</p>
      <ol className="mt-3 space-y-2">
        {progress.map((step, index) => <li key={`${step}-${index}`} className="flex items-center gap-2.5 font-sans text-sm text-arc-heading"><span className={`h-2 w-2 shrink-0 rounded-full ${loading && index === progress.length - 1 ? "animate-pulse bg-arc-accent" : "bg-[#15803D]"}`} />{step}</li>)}
      </ol>
    </section> : null}
  </div>;
}

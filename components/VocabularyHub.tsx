"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VocabularyEntry, VocabularyOverview } from "@/app/actions";
import type { VocabularyTier, VocabularyType } from "@/lib/vocabulary";
import { typography } from "@/lib/typography";
import { filterPillClass, SELECTED_FILTER_STYLE } from "@/lib/uiStyles";
import DashboardPageShell from "@/components/DashboardPageShell";

type Tab = "explore" | "library";

const TYPE_OPTIONS: { value: VocabularyType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "n", label: "Noun" },
  { value: "v", label: "Verb" },
  { value: "adj", label: "Adjective" },
];

const DIFFICULTY_OPTIONS: { value: VocabularyTier | "all"; label: string }[] = [
  { value: "all", label: "Random" },
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
];

const COUNT_OPTIONS = [10, 20, 30] as const;

const CARD_BORDERS = ["#DCFCE7", "#FEF9C3", "#FFEDD5", "#FCE7F3", "#DBEAFE"];

function displayWord(word: string) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function OptionRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <p className="arc-card-label mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function DifficultyFilter({
  value,
  onChange,
}: {
  value: VocabularyTier | "all";
  onChange: (value: VocabularyTier | "all") => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    value === "all"
      ? "Difficulty"
      : DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label ?? "Difficulty";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 font-sans text-sm font-medium transition ${
          value === "all" ? "border-arc-line bg-white text-arc-heading" : ""
        }`}
        style={
          value === "all"
            ? undefined
            : { borderColor: "#09b5ff", backgroundColor: "#E5F7FF", color: "#09b5ff" }
        }
        aria-expanded={open}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M4 13h3v3H4v-3zm4.5-5h3v8h-3V8zM13 4h3v12h-3V4z" />
        </svg>
        {label}
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
          <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-arc-line bg-white py-1 shadow-[0_12px_32px_rgba(24,24,27,0.12)]">
          {([
            { value: "all" as const, label: "All" },
            { value: 1 as const, label: "Easy" },
            { value: 2 as const, label: "Medium" },
            { value: 3 as const, label: "Hard" },
          ]).map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full px-3.5 py-2 text-left font-sans text-sm ${
                value === option.value
                  ? "bg-[#E5F7FF] font-medium text-[#09b5ff]"
                  : "text-arc-heading hover:bg-arc-soft"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function VocabularyHub({
  words,
  overview,
  streak,
  initialTab = "explore",
}: {
  words: VocabularyEntry[];
  overview: VocabularyOverview;
  streak: number;
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [type, setType] = useState<VocabularyType | "all">("all");
  const [tier, setTier] = useState<VocabularyTier | "all">("all");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(10);
  const [search, setSearch] = useState("");
  const [libraryTier, setLibraryTier] = useState<VocabularyTier | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const completionPct =
    overview.total === 0
      ? 0
      : Math.min(100, Math.round((overview.completed / overview.total) * 100));
  const streakHint = streak > 0 ? "Keep it going" : "Start practicing to begin";

  const practiceHref = useMemo(() => {
    const params = new URLSearchParams({
      practice: "1",
      count: String(count),
    });
    if (type !== "all") params.set("type", type);
    if (tier !== "all") params.set("tier", String(tier));
    return `/vocabulary?${params.toString()}`;
  }, [type, tier, count]);

  const libraryWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return words.filter((entry) => {
      if (q && !entry.word.toLowerCase().includes(q) && !entry.definition.toLowerCase().includes(q)) {
        return false;
      }
      if (libraryTier !== "all" && Number(entry.tier) !== libraryTier) return false;
      return true;
    });
  }, [words, search, libraryTier]);

  function startLibraryPractice() {
    const ids = libraryWords.slice(0, count).map((entry) => entry.id);
    const params = new URLSearchParams({ practice: "1", count: String(count) });
    if (ids.length) params.set("ids", ids.join(","));
    router.push(`/vocabulary?${params.toString()}`);
  }

  return (
    <DashboardPageShell>
      <h1 className={typography.pageTitle}>
        Vocabulary Practice
      </h1>

      <div className="mt-6">
        <div className="inline-flex rounded-full bg-[#F3F3F3] p-1">
          <button
            type="button"
            onClick={() => setTab("explore")}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 font-sans text-sm transition ${
              tab === "explore"
                ? "bg-white font-medium text-arc-ink shadow-sm"
                : "font-medium text-[#8B8B93]"
            }`}
          >
            Explore
            <span className="rounded-full bg-[#09b5ff] px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase leading-none tracking-wide text-white">
              New
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("library")}
            className={`rounded-full px-5 py-2 font-sans text-sm transition ${
              tab === "library"
                ? "bg-white font-medium text-arc-ink shadow-sm"
                : "font-medium text-[#8B8B93]"
            }`}
          >
            Library
          </button>
        </div>
      </div>

      {tab === "explore" ? (
        <>
          <div className="arc-card mt-8 grid divide-y divide-arc-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="px-5 py-5 sm:px-6">
              <p className={typography.cardLabel}>Completion</p>
              <p className={`mt-2 ${typography.cardValue}`}>
                {completionPct}%
              </p>
              <p className="arc-card-hint mt-2">
                {overview.completed} of {overview.total}
              </p>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <p className={typography.cardLabel}>Accuracy</p>
              <p className={`mt-2 ${typography.cardValue}`}>
                {overview.accuracy}%
              </p>
              <p className="arc-card-hint mt-2">Across all attempts</p>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <p className={typography.cardLabel}>Streak</p>
              <p className={`mt-2 ${typography.cardValue}`}>
                {streak}
              </p>
              <p className="arc-card-hint mt-2">{streakHint}</p>
            </div>
          </div>

          <div className="arc-card mt-4 divide-y divide-arc-line">
            <OptionRow label="Type">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={filterPillClass(type === option.value)}
                  style={type === option.value ? SELECTED_FILTER_STYLE : undefined}
                  aria-pressed={type === option.value}
                >
                  {option.label}
                </button>
              ))}
            </OptionRow>
            <OptionRow label="Difficulty">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => setTier(option.value)}
                  className={filterPillClass(tier === option.value)}
                  style={tier === option.value ? SELECTED_FILTER_STYLE : undefined}
                  aria-pressed={tier === option.value}
                >
                  {option.label}
                </button>
              ))}
            </OptionRow>
            <OptionRow label="How many words">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={filterPillClass(count === n)}
                  style={count === n ? SELECTED_FILTER_STYLE : undefined}
                  aria-pressed={count === n}
                >
                  {n}
                </button>
              ))}
            </OptionRow>
            <div className="px-5 py-5 sm:px-6">
              <Link href={practiceHref} className="arc-btn-primary w-full py-3 text-base">
                Start practicing
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-arc-line bg-white px-4">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search words..."
                className="w-full bg-transparent font-sans text-sm text-arc-heading outline-none placeholder:text-arc-muted"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyFilter value={libraryTier} onChange={setLibraryTier} />
              <button
                type="button"
                onClick={startLibraryPractice}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#18181B] px-4 font-sans text-sm font-medium text-white transition hover:bg-[#3F3F46]"
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M6.5 4.6v10.8L16 10 6.5 4.6z" />
                </svg>
                Start Practice
              </button>
            </div>
          </div>

          {libraryWords.length === 0 ? (
            <p className="mt-10 text-center font-sans text-sm text-arc-muted">
              No words match that search.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {libraryWords.map((entry, index) => {
                const selected = selectedId === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedId(selected ? null : entry.id)}
                    className="flex min-h-[6.25rem] flex-col items-center justify-center rounded-2xl border-2 bg-white px-3 py-4 text-center transition hover:bg-[#FAFAFA]"
                    style={{ borderColor: CARD_BORDERS[index % CARD_BORDERS.length] }}
                  >
                    <span className="font-sans text-base font-medium text-arc-heading sm:text-lg">
                      {displayWord(entry.word)}
                    </span>
                    {selected ? (
                      <span className="mt-2 font-sans text-xs leading-relaxed text-arc-muted">
                        {entry.definition}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchQuestions, type QuestionSearchHit } from "@/app/actions";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0 text-[#8A8A8A]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6.25" />
      <path strokeLinecap="round" d="M16.15 16.15L20 20" />
    </svg>
  );
}

function truncateStem(stem: string, max = 72) {
  const cleaned = stem.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

export default function NavbarSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<QuestionSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timeout = window.setTimeout(() => {
      void searchQuestions(value, 8).then((rows) => {
        if (cancelled) return;
        setHits(rows);
        setOpen(true);
        setLoading(false);
      });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goToResults(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function openQuestion(questionId: string) {
    setOpen(false);
    router.push(
      `/question-bank?practice=1&question=${encodeURIComponent(questionId)}`
    );
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <form
      ref={rootRef}
      onSubmit={goToResults}
      className="relative w-40 shrink-0 sm:w-48"
    >
      <label className="flex h-9 items-center gap-1.5 rounded-full bg-arc-soft px-3.5">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          placeholder="Search..."
          className="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-arc-heading outline-none placeholder:text-[#8A8A8A]"
          aria-label="Search questions"
        />
      </label>

      {showPanel ? (
        <div className="absolute left-0 top-[calc(100%+0.4rem)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#ECECEE] bg-white shadow-[0_12px_32px_rgba(24,24,27,0.12)]">
          {loading && hits.length === 0 ? (
            <p className="px-3.5 py-3 font-sans text-sm text-arc-muted">
              Searching…
            </p>
          ) : hits.length === 0 ? (
            <p className="px-3.5 py-3 font-sans text-sm text-arc-muted">
              No matching questions.
            </p>
          ) : (
            <ul>
              {hits.map((hit) => (
                <li key={hit.question_id}>
                  <button
                    type="button"
                    onClick={() => openQuestion(hit.question_id)}
                    className="flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-[#F7F7F8]"
                  >
                    <span className="font-sans text-sm text-arc-heading">
                      {truncateStem(hit.stem)}
                    </span>
                    <span className="font-sans text-xs text-arc-muted">
                      {[hit.domain, hit.skill].filter(Boolean).join(" · ") ||
                        hit.question_id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </form>
  );
}

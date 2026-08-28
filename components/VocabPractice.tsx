"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { VocabularyEntry } from "@/app/actions";
import { usePracticeSession } from "@/components/PracticeSessionProvider";

const TIER_LABEL: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

function displayWord(word: string) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function displayPos(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function HintIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M9 18h6M10 21h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 3a6 6 0 00-3.6 10.8c.7.55 1.1 1.28 1.1 2.2h5c0-.92.4-1.65 1.1-2.2A6 6 0 0012 3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VocabPractice({
  words,
  pool,
}: {
  words: VocabularyEntry[];
  pool: VocabularyEntry[];
}) {
  const { setPracticeActive } = usePracticeSession();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hiddenChoices, setHiddenChoices] = useState<string[]>([]);

  useEffect(() => {
    setPracticeActive(true);
    return () => setPracticeActive(false);
  }, [setPracticeActive]);

  const current = words[index] ?? null;
  const choices = useMemo(() => {
    if (!current) return [];
    const distractors = shuffle(pool.filter((entry) => entry.id !== current.id))
      .slice(0, 3)
      .map((entry) => entry.definition);
    return shuffle([current.definition, ...distractors]);
  }, [current, pool]);

  if (!current) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F7F7F8] px-6">
        <p className="font-sans text-sm text-arc-muted">
          No vocabulary words to practice yet.
        </p>
      </div>
    );
  }

  const isLast = index >= words.length - 1;
  const correct = selected === current.definition;
  const visibleChoices = choices.filter((choice) => !hiddenChoices.includes(choice));
  const tierLabel = current.tier ? TIER_LABEL[current.tier] : null;

  function resetRound() {
    setSelected(null);
    setRevealed(false);
    setHintUsed(false);
    setHiddenChoices([]);
  }

  function useHint() {
    if (hintUsed || revealed || !current) return;
    const wrong = choices.filter((choice) => choice !== current.definition);
    setHiddenChoices(shuffle(wrong).slice(0, 2));
    setHintUsed(true);
    if (selected && selected !== current.definition) setSelected(null);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F7F7F8]">
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/vocabulary"
          className="font-sans text-sm font-medium text-arc-muted transition hover:text-arc-heading"
        >
          Back to Vocabulary
        </Link>
        <p className="font-sans text-sm tabular-nums text-arc-muted">
          {index + 1} / {words.length}
        </p>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 pb-8 sm:px-6">
        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-[#E4E4E7] bg-white px-5 py-8 shadow-[0_10px_40px_rgba(24,24,27,0.06)] sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tierLabel ? (
              <span className="rounded-full bg-[#F4F4F5] px-3 py-1 font-sans text-xs font-medium text-[#71717A]">
                {tierLabel}
              </span>
            ) : null}
            <span className="rounded-full bg-[#F4F4F5] px-3 py-1 font-sans text-xs font-medium text-[#71717A]">
              {displayPos(current.part_of_speech)}
            </span>
          </div>

          <h1 className="mt-8 text-center font-sans text-4xl font-semibold tracking-tight text-arc-ink sm:text-5xl">
            {displayWord(current.word)}
          </h1>
          <p className="mt-3 text-center font-sans text-sm text-[#8B8B93]">
            Choose the correct definition.
          </p>

          <div className="mt-8 min-h-0 flex-1 space-y-2.5 overflow-y-auto">
            {visibleChoices.map((choice) => {
              const isPick = selected === choice;
              const isAnswer = choice === current.definition;
              let className =
                "w-full rounded-2xl border border-[#E4E4E7] bg-white px-4 py-3.5 text-left font-sans text-sm text-arc-heading transition hover:bg-[#FAFAFA]";
              if (revealed && isAnswer) {
                className =
                  "w-full rounded-2xl border border-arc-correct bg-arc-correctBg px-4 py-3.5 text-left font-sans text-sm text-arc-heading";
              } else if (revealed && isPick && !correct) {
                className =
                  "w-full rounded-2xl border border-arc-incorrect bg-arc-incorrectBg px-4 py-3.5 text-left font-sans text-sm text-arc-heading";
              } else if (!revealed && isPick) {
                className =
                  "w-full rounded-2xl border border-arc-accent bg-arc-accentSoft px-4 py-3.5 text-left font-sans text-sm text-arc-heading";
              }
              return (
                <button
                  key={choice}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(choice)}
                  className={className}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={useHint}
              disabled={hintUsed || revealed}
              className="arc-btn-secondary h-10 gap-1.5 px-3.5 disabled:opacity-40"
            >
              <HintIcon />
              {hintUsed ? "Hint used" : "Get a hint"}
            </button>

            {!revealed ? (
              <button
                type="button"
                disabled={!selected}
                onClick={() => setRevealed(true)}
                className="arc-btn-primary min-h-11 rounded-full px-6 py-2.5"
              >
                Check
              </button>
            ) : isLast ? (
              <Link href="/vocabulary" className="arc-btn-primary min-h-11 rounded-full px-6 py-2.5">
                Finish
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIndex((value) => value + 1);
                  resetRound();
                }}
                className="arc-btn-primary min-h-11 rounded-full px-6 py-2.5"
              >
                Next word
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

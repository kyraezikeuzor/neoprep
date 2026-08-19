"use client";

import Image from "next/image";
import type { Question } from "@/app/actions";
import MathText from "@/components/MathText";
import GraphRenderer, { type GraphSpec } from "@/components/graphs/GraphRenderer";

function normalizeAnswerKey(value: string): string {
  return value.trim().toUpperCase();
}

function getCorrectAnswerLabel(question: Question): string {
  if (!question.choices) return question.correct_answer;

  const direct = question.choices[question.correct_answer];
  if (direct) return `${question.correct_answer}. ${direct}`;

  const upper = normalizeAnswerKey(question.correct_answer);
  const next = question.choices[upper];
  if (next) return `${upper}. ${next}`;

  return question.correct_answer;
}

function getDifficultyLabel(tier: number | null | undefined): string {
  if (tier === 1) return "Easy";
  if (tier === 2) return "Medium";
  if (tier === 3) return "Hard";
  return "Practice";
}

export default function ExplainerPreviewCard({
  question,
  variant,
}: {
  question: Question;
  variant: "hook" | "reveal";
}) {
  const choices = Object.entries(question.choices ?? {});
  const showReveal = variant === "reveal";

  return (
    <div
      className="explainer-preview-card mx-auto flex aspect-[1080/1350] w-full max-w-[min(42rem,calc((100dvh-10rem)*0.8))] flex-col overflow-hidden bg-[#087BFA] text-white shadow-[0_24px_72px_rgba(0,122,255,0.16)] [container-type:inline-size]"
      aria-label="1080 by 1350 social preview"
    >
      <div className="px-4 py-1.5 sm:px-5 sm:py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/neoprep-mark-white.png"
              alt="Tutormigo"
              width={24}
              height={24}
              className="h-5 w-5 object-contain sm:h-6 sm:w-6"
              priority
            />
            <span className="font-sans text-xs font-semibold tracking-tight text-white sm:text-sm">
              Tutormigo
            </span>
          </div>
          <div className="text-right font-sans text-[9px] font-medium text-white/65 sm:text-[10px]">
            {showReveal ? "2 / 2" : "1 / 2"}
          </div>
        </div>

      </div>

      <div className="m-[2.25%] mt-1 flex min-h-0 flex-1 flex-col rounded-[26px] bg-white p-[8%] text-arc-ink sm:mt-2">
        <div className={`min-h-0 flex-1 ${showReveal ? "overflow-y-auto" : "overflow-hidden"}`}>
          {showReveal ? <div className="mb-7 flex flex-wrap items-center gap-2 font-sans sm:mb-9">
            {question.domain ? (
              <span className="text-[11px] font-semibold text-[#25252B] sm:text-sm">
                {question.domain}
              </span>
            ) : null}
            {question.skill ? (
              <span className="rounded-full border border-[#E2E2E7] bg-[#FCFCFD] px-2.5 py-1 text-[9px] font-medium text-[#6D6D76] sm:text-[11px]">
                {question.skill}
              </span>
            ) : null}
            <span className="rounded-full border border-[#E2E2E7] bg-[#FCFCFD] px-2.5 py-1 text-[9px] font-medium text-[#6D6D76] sm:text-[11px]">
              {getDifficultyLabel(question.tier)}
            </span>
          </div> : null}
          <div className={showReveal ? "space-y-5 sm:space-y-7" : "flex min-h-full flex-col gap-5 sm:gap-7"}>
            {question.graph_spec ? (
              <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white p-3">
                <GraphRenderer spec={question.graph_spec as GraphSpec | null} />
              </div>
            ) : null}

            {!showReveal ? (
              <div className="flex min-h-[46%] flex-col">
                <MathText
                  text={question.stem || "(No question text)"}
                  className="question-prose playground-sat-stem"
                  block
                />
              </div>
            ) : null}

            {!showReveal && choices.length > 0 ? (
              <div className="space-y-3">
                {choices.map(([letter, text]) => {
                  return (
                    <div
                      key={letter}
                      className="px-1 py-1"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 shrink-0 font-sans text-sm font-medium text-[#242429] sm:text-base"
                        >
                          {`${letter})`}
                        </div>
                        <div className="min-w-0 flex-1">
                          <MathText
                            text={text}
                            className="question-prose choice-text playground-hook-choice"
                            block
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !showReveal ? (
              <div className="rounded-lg border border-[#DEDDE2] px-4 py-3 font-display text-base text-[#9CA2B1] sm:px-5 sm:py-4 sm:text-lg">
                Enter your answer
              </div>
            ) : null}

            {showReveal ? (
              <div className="rounded-2xl border border-[#15803D] bg-[#F0FDF4] p-4">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#15803D]">
                  Correct answer
                </p>
                <p className="mt-2 font-sans text-lg font-semibold text-arc-ink">
                  {getCorrectAnswerLabel(question)}
                </p>
              </div>
            ) : null}

            {showReveal ? (
              <div className="rounded-2xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 sm:p-5">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#8B8B93]">
                  Explanation
                </p>
                <div className="mt-3 text-sm leading-6 text-arc-heading">
                  <MathText
                    text={question.rationale || "No explanation available for this question yet."}
                    className="font-sans"
                    block
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {!showReveal ? (
          <p className="mt-5 border-t border-[#ECECF0] pt-4 text-left font-sans text-xs font-medium text-[#087BFA] sm:text-sm">
            Swipe to see the solution →
          </p>
        ) : null}
      </div>
    </div>
  );
}

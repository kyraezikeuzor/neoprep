"use client";

import { useEffect, useRef } from "react";
import { prepareForMathJax } from "@/lib/mathText";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      typesetClear?: (elements?: HTMLElement[]) => void;
      startup?: { promise?: Promise<void> };
    };
  }
}

type MathTextProps = {
  text: string;
  className?: string;
  /** Force block layout (e.g. explanation sentences on their own lines). */
  block?: boolean;
};

/**
 * Question-bank imports use an invisible separator pair to mark the exact
 * text the SAT item refers to as underlined. Keep this deliberately small and text-only: the
 * question bank must never be able to inject arbitrary markup into the page.
 */
function splitUnderlinedText(text: string): Array<{ text: string; underlined: boolean }> {
  const parts: Array<{ text: string; underlined: boolean }> = [];
  const matcher = /\u2063([\s\S]*?)\u2063/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), underlined: false });
    parts.push({ text: match[1], underlined: true });
    cursor = matcher.lastIndex;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), underlined: false });
  return parts;
}

function splitResearchNotes(text: string): {
  introduction: string;
  notes: string[];
  instruction: string | null;
} | null {
  const match = text.match(/^([\s\S]*?following notes:\s*)•\s+([\s\S]+)$/i);
  if (!match) return null;

  const parts = match[2]
    .split(/\s*•\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;

  const lastIndex = parts.length - 1;
  const last = parts[lastIndex]!;
  const instructionMatch = last.match(
    /^([\s\S]*?)(?=\s+(?:The student|The writer|The researcher)\s+wants\s+to\b)([\s\S]+)$/i
  );
  const instruction = instructionMatch?.[2]?.trim() ?? null;
  parts[lastIndex] = (instructionMatch?.[1] ?? last).trim();

  return {
    introduction: match[1].trim(),
    notes: parts.filter(Boolean),
    instruction,
  };
}

/** The raw MathJax node. Keep this separate so list detection never changes hook order. */
function MathTextRaw({ text, className, block = false }: MathTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prepared = prepareForMathJax(text);
  const hasDisplay = prepared.includes("\\[");
  const isBlock = block || hasDisplay;

  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    if (!el) return;

    // Set content outside React children so parent re-renders don't wipe
    // MathJax's replaced DOM nodes.
    el.textContent = prepared;

    async function typeset() {
      for (let i = 0; i < 40 && !window.MathJax?.typesetPromise; i++) {
        await new Promise((r) => setTimeout(r, 50));
        if (cancelled) return;
      }

      const mj = window.MathJax;
      if (!mj?.typesetPromise) return;

      try {
        await mj.startup?.promise;
        if (cancelled || !ref.current) return;
        mj.typesetClear?.([ref.current]);
        await mj.typesetPromise([ref.current]);
      } catch (err) {
        console.error("MathJax typeset error:", err);
      }
    }

    typeset();
    return () => {
      cancelled = true;
    };
  }, [prepared]);

  return (
    <span
      ref={ref}
      className={`math-text${isBlock ? " math-text--display" : ""} ${className ?? ""}`.trim()}
      style={{ display: isBlock ? "block" : "inline" }}
    />
  );
}

/** Renders text that may contain LaTeX via MathJax. Accepts \(...\) / \[...\]
 * delimiters, and also ASCII caret math (kx^2) which is converted first. */
export default function MathText(props: MathTextProps) {
  const underlinedParts = splitUnderlinedText(props.text);
  if (underlinedParts.some((part) => part.underlined)) {
    const Tag = props.block ? "div" : "span";
    return (
      <Tag className={props.className}>
        {underlinedParts.map((part, index) =>
          part.underlined ? (
            <span key={index} className="underline decoration-1 underline-offset-2">
              <MathTextRaw text={part.text} />
            </span>
          ) : (
            <MathTextRaw key={index} text={part.text} />
          )
        )}
      </Tag>
    );
  }

  const researchNotes = splitResearchNotes(props.text);
  if (!researchNotes) return <MathTextRaw {...props} />;

  return (
    <div className={props.className}>
      <MathTextRaw text={researchNotes.introduction} />
      <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-arc-ink">
        {researchNotes.notes.map((note, index) => (
          <li key={`${index}-${note.slice(0, 24)}`} className="pl-1">
            <MathTextRaw text={note} />
          </li>
        ))}
      </ul>
      {researchNotes.instruction ? <MathTextRaw text={researchNotes.instruction} /> : null}
    </div>
  );
}

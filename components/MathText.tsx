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

/** Renders text that may contain LaTeX via MathJax. Accepts \(...\) / \[...\]
 * delimiters, and also ASCII caret math (kx^2) which is converted first. */
export default function MathText({
  text,
  className,
  block = false,
}: {
  text: string;
  className?: string;
  /** Force block layout (e.g. explanation sentences on their own lines). */
  block?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
    <div
      ref={ref}
      className={`math-text${isBlock ? " math-text--display" : ""} ${className ?? ""}`.trim()}
      style={{ display: isBlock ? "block" : "inline" }}
    />
  );
}

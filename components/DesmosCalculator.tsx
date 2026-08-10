"use client";

import { useEffect, useRef, useState } from "react";

const DESMOS_API_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? "dcb31709b452b1cf9dc26972add0fda6";
const DESMOS_SCRIPT = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_API_KEY}`;
const CALC_PANEL_W = "36rem";

type DesmosNS = {
  GraphingCalculator: (
    el: HTMLElement,
    options?: Record<string, unknown>
  ) => { destroy: () => void; resize: () => void };
};

declare global {
  interface Window {
    Desmos?: DesmosNS;
  }
}

let desmosLoadPromise: Promise<DesmosNS> | null = null;

function loadDesmos(): Promise<DesmosNS> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Desmos requires a browser"));
  }
  if (window.Desmos) return Promise.resolve(window.Desmos);
  if (desmosLoadPromise) return desmosLoadPromise;

  desmosLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://www.desmos.com/api/"]`
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Desmos) resolve(window.Desmos);
        else reject(new Error("Desmos failed to load"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = DESMOS_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.Desmos) resolve(window.Desmos);
      else reject(new Error("Desmos failed to load"));
    };
    script.onerror = () => {
      desmosLoadPromise = null;
      reject(new Error("Desmos script failed"));
    };
    document.head.appendChild(script);
  });

  return desmosLoadPromise;
}

function CalculatorIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <rect x="5.5" y="2.5" width="13" height="19" rx="2.2" />
      <path strokeLinecap="round" d="M8.5 7.5h7" />
      <circle cx="9.25" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="9.25" cy="16.75" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="16.75" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CalculatorButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={open}
      aria-label={open ? "Close calculator" : "Open calculator"}
      className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition ${
        open
          ? "bg-[#F3F4F6] text-arc-ink"
          : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-arc-ink"
      }`}
    >
      <CalculatorIcon />
      <span className="text-[11px] font-medium leading-none">Calculator</span>
    </button>
  );
}

export default function DesmosCalculatorPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<{ destroy: () => void; resize: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      calcRef.current?.destroy();
      calcRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = "";
      return;
    }

    let cancelled = false;

    async function mount() {
      setError(null);
      try {
        const Desmos = await loadDesmos();
        if (cancelled || !hostRef.current) return;

        calcRef.current?.destroy();
        hostRef.current.innerHTML = "";
        calcRef.current = Desmos.GraphingCalculator(hostRef.current, {
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          keypad: true,
        });

        // Resize after the slide-open transition settles
        window.setTimeout(() => {
          if (!cancelled) calcRef.current?.resize();
        }, 560);
        requestAnimationFrame(() => calcRef.current?.resize());
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load Desmos calculator.");
      }
    }

    void mount();

    return () => {
      cancelled = true;
      calcRef.current?.destroy();
      calcRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <aside
      aria-hidden={!open}
      className={`explanation-panel z-40 flex shrink-0 flex-col overflow-hidden bg-white ${
        open ? "explanation-panel--open" : ""
      }`}
      style={{ ["--panel-w" as string]: CALC_PANEL_W }}
    >
      <div className="explanation-panel__inner flex h-full min-h-0 flex-col border-l border-arc-line">
        <div className="flex shrink-0 items-center justify-between border-b border-arc-line px-5">
          <p className="py-3.5 text-sm font-semibold text-arc-ink">Calculator</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calculator"
            className="rounded-md p-1.5 text-arc-muted transition hover:bg-[#F3F4F6] hover:text-arc-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {error ? (
          <p className="p-6 text-sm text-arc-incorrect">{error}</p>
        ) : (
          <div ref={hostRef} className="min-h-0 w-full flex-1" />
        )}
      </div>
    </aside>
  );
}

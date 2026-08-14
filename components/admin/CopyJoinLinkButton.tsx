"use client";

import { useState } from "react";

export default function CopyJoinLinkButton({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false);

  const path = `/join/${joinCode}`;

  async function copy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-lg bg-[#F4F4F5] px-3 py-2 font-mono text-sm text-arc-ink">
        {path}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border-2 border-[#E5E7EB] bg-white px-4 py-2 font-sans text-sm font-semibold text-arc-ink transition hover:bg-[#F7F7F7]"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

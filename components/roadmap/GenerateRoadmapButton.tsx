"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateNextRoadmapAssignment } from "@/app/actions/bootcamp";

export default function GenerateRoadmapButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          setError(null);
          const result = await generateNextRoadmapAssignment();
          if (!result.ok) setError(result.error);
          else router.refresh();
        })}
        className="arc-btn-primary min-h-11 px-5"
      >
        {pending ? "Building your Question Set..." : "Build my next Question Set"}
      </button>
      {error ? <p className="mt-2 font-sans text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

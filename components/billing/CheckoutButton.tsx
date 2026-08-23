"use client";

import { useState } from "react";
import type { PricingPlanId } from "@/lib/pricing";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function CheckoutButton({
  planId,
  testDate,
}: {
  planId: PricingPlanId;
  testDate: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function beginCheckout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, testDate }),
      });
      const result = (await response.json()) as {
        url?: string;
        loginUrl?: string;
        error?: string;
      };

      if (response.status === 401 && result.loginUrl) {
        window.location.assign(result.loginUrl);
        return;
      }
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to start Checkout.");
      }

      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start Checkout.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={beginCheckout}
        disabled={loading}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1BB1F6] px-4 font-sans text-base font-semibold text-white transition hover:bg-[#079FDF] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Opening secure checkout…" : "Get Pro"}
        {!loading ? <ArrowIcon /> : null}
      </button>
      {error ? <p className="mt-2 font-sans text-xs text-red-600">{error}</p> : null}
    </>
  );
}


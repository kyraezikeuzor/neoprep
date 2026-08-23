"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Unable to open billing.");
      window.location.assign(result.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Unable to open billing.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border-2 border-arc-line bg-white p-5">
      <h2 className="font-dm text-xl font-medium tracking-normal text-arc-ink">Billing</h2>
      <p className="mt-2 font-sans text-sm leading-6 text-arc-muted">
        Update your payment method, view invoices, or cancel a recurring Pro plan securely in Stripe.
      </p>
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className="mt-4 min-h-10 rounded-xl bg-[#1BB1F6] px-5 font-sans text-sm font-semibold text-white transition hover:bg-[#079FDF] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Opening billing…" : "Manage billing"}
      </button>
      {error ? <p className="mt-2 font-sans text-xs text-red-600">{error}</p> : null}
    </div>
  );
}


"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ManyPrepLogo from "@/components/ManyPrepLogo";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(
    searchParams.get("error") === "auth" ? "Google sign-in failed. Try again." : ""
  );

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setGoogleError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGoogleError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="rounded-arc border border-arc-line bg-white p-6">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-arc-line bg-white px-4 py-2 text-sm font-medium text-arc-ink transition hover:bg-arc-bg disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting..." : "Sign in with Google"}
      </button>
      {googleError && (
        <p className="mt-3 text-center text-sm text-arc-incorrect">{googleError}</p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-arc-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <ManyPrepLogo className="h-14 w-14" priority />
          </div>
          <h1 className="font-sans text-3xl font-bold text-arc-ink">ManyPrep</h1>
          <p className="mt-2 text-base font-normal leading-[1.6] text-arc-muted">
            Sign in to open the question bank.
          </p>
        </div>
        <Suspense fallback={<div className="h-24 rounded-arc border border-arc-line bg-white p-6" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

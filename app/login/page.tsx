"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(
    searchParams.get("error") === "auth" ? "Google sign-in failed. Try again." : ""
  );

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setGoogleError("");

    // Keep redirectTo free of query params so it matches Supabase allow-list entries.
    // Stash the post-login destination in a short-lived cookie for /auth/callback.
    document.cookie = `auth_next=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setGoogleError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#F4F4F5] px-5 py-3.5 transition hover:bg-[#EBEBED] disabled:opacity-60"
      >
        <GoogleIcon className="h-5 w-5" />
        <span className="text-base font-medium text-[#52525B]">
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </span>
      </button>

      {googleError && (
        <p className="mt-4 text-center text-sm text-[#C4372D]">{googleError}</p>
      )}

      <p className="mt-10 text-center text-sm text-[#71717A]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="font-semibold text-[#18181B] transition hover:underline disabled:opacity-60"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-[22rem]">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/neoprep-logo.png"
              alt="NeoPrep"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
              priority
            />
            <span className="text-2xl font-semibold tracking-tight text-[#18181B]">
              NeoPrep
            </span>
          </Link>

          <h1 className="mt-10 text-3xl font-bold tracking-tight text-[#18181B]">
            Create your free account
          </h1>
          <p className="mt-2 text-base text-[#71717A]">
            Join NeoPrep with Google to start practicing.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mt-8 h-28 animate-pulse rounded-2xl bg-[#F4F4F5]" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

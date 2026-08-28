"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { joinBootcamp } from "@/app/actions/bootcamp";

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
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

export default function JoinBootcampClient({
  bootcampId,
  bootcampName,
  joinCode,
  isLoggedIn,
}: {
  bootcampId: number;
  bootcampName: string;
  joinCode: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [joining, setJoining] = useState(isLoggedIn);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const joinStarted = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || joinStarted.current) return;
    joinStarted.current = true;

    (async () => {
      setJoining(true);
      setError("");
      const result = await joinBootcamp(bootcampId);
      if (!result.ok) {
        setError(result.error);
        setJoining(false);
        joinStarted.current = false;
        return;
      }
      if (result.bookingFailed) {
        console.warn("Cal.com booking failed after join:", result.bookingError);
      }
      setJoined(true);
      setJoining(false);
      router.refresh();
    })();
  }, [isLoggedIn, bootcampId, router]);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");

    const next = `/join/${encodeURIComponent(joinCode)}`;
    document.cookie = `auth_next=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax`;

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  if (joined) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#18181B]">
          You&apos;re in!
        </h1>
        <p className="mt-2 text-base text-[#71717A]">
          Welcome to {bootcampName}.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#71717A]">
          Your Study Planner is ready in the sidebar.
        </p>
        <Link
          href="/assignments"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-arc-accent px-5 py-3.5 text-base font-semibold text-white transition hover:bg-arc-accentDeep"
        >
          Go to Study Planner
        </Link>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#F4F4F5] px-5 py-3.5 text-base font-medium text-[#52525B] transition hover:bg-[#EBEBED]"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#18181B]">
          Join {bootcampName}
        </h1>
        <p className="mt-2 text-base text-[#71717A]">
          {joining
            ? "Adding you to the bootcamp…"
            : "Finish joining to unlock your Study Planner."}
        </p>
        {error ? (
          <div className="mt-8">
            <p className="text-sm text-[#C4372D]">{error}</p>
            <button
              type="button"
              onClick={() => {
                joinStarted.current = false;
                setError("");
                setJoining(true);
                joinStarted.current = true;
                void (async () => {
                  const result = await joinBootcamp(bootcampId);
                  if (!result.ok) {
                    setError(result.error);
                    setJoining(false);
                    joinStarted.current = false;
                    return;
                  }
                  if (result.bookingFailed) {
                    console.warn("Cal.com booking failed after join:", result.bookingError);
                  }
                  setJoined(true);
                  setJoining(false);
                  router.refresh();
                })();
              }}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-arc-accent px-5 py-3.5 text-base font-semibold text-white transition hover:bg-arc-accentDeep"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="mt-10 h-12 animate-pulse rounded-xl bg-[#F4F4F5]" />
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold tracking-tight text-[#18181B]">
        Join {bootcampName}
      </h1>
      <p className="mt-2 text-base text-[#71717A]">
        Sign in with Google to join this bootcamp and get your Study Planner.
      </p>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#F4F4F5] px-5 py-3.5 transition hover:bg-[#EBEBED] disabled:opacity-60"
        >
          <GoogleIcon />
          <span className="text-base font-medium text-[#52525B]">
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </span>
        </button>

        {error ? (
          <p className="mt-4 text-center text-sm text-[#C4372D]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

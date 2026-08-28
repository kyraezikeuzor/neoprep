"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() { return <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8c4.3-2 6.9-5.1 6.9-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-2.6 1.8-7.3.5-9.9-3.4l-3.7 2.8C4 20.5 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.7 6.7 0 010-4.2V7.1H2.2a11 11 0 000 9.9l3.7-2.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.1C15.4.2 7.7 1.3 2.2 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>; }
function AuthForm() {
  const params = useSearchParams();
  const nextParam = params.get("next"); const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function google() { setLoading(true); setMessage(""); document.cookie = `auth_next=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax`; const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } }); if (error) { setMessage(error.message); setLoading(false); } }
  return <div className="mt-7 w-full"><h1 className="text-center text-3xl font-semibold tracking-[-0.05em] text-[#111] sm:text-[34px]">Welcome to Tutormigo</h1><p className="mt-3 text-center text-base text-[#777]">Sign in to continue your SAT prep journey.</p><button type="button" onClick={google} disabled={loading} className="mt-10 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#171717] text-base font-medium text-white transition hover:bg-black disabled:opacity-60"><GoogleIcon /><span>{loading ? "Redirecting…" : "Continue with Google"}</span></button>{message && <p className="mt-4 text-center text-sm text-[#c4372d]">{message}</p>}</div>;
}

export default function LoginPage() { return <main className="min-h-[100dvh] bg-white p-3 sm:p-6"><div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1550px] items-center gap-10 lg:grid-cols-[minmax(0,.9fr)_minmax(33rem,1.1fr)] lg:gap-16"><section className="mx-auto flex w-full max-w-[33rem] flex-col items-center py-10 lg:py-0"><Link href="/" className="mb-12 inline-flex items-center gap-3"><Image src="/neoprep-logo.png" alt="Tutormigo" width={44} height={44} className="h-11 w-11 rounded-xl object-cover" priority/><span className="text-3xl font-bold tracking-[-.06em] text-[#062820]">Tutormigo</span></Link><Suspense fallback={<div className="h-44 w-full animate-pulse rounded-2xl bg-[#f5f5f5]"/>}><AuthForm/></Suspense></section><aside className="relative hidden min-h-[min(92vh,850px)] overflow-hidden rounded-[2rem] bg-[#061d38] lg:block"><Image src="/auth-study-journey.png" alt="A student following a glowing path toward their learning goals" fill priority className="object-cover" sizes="55vw"/></aside></div></main>; }

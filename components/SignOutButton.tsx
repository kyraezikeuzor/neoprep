"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg border border-arc-line bg-white px-4 py-2.5 font-sans text-sm font-medium text-arc-heading transition hover:bg-arc-soft"
    >
      Sign out
    </button>
  );
}

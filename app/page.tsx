import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NeoPrep · Get better at the SAT, one question at a time",
  description: "Get better at the SAT, one question at a time.",
};

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Returning / signed-in users skip the landing page and go straight in.
  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}

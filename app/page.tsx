import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { createClient } from "@/lib/supabase/server";

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

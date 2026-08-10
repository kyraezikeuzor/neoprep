import { createClient } from "@supabase/supabase-js";

/** Service-role client for trusted server-only operations (e.g. ensuring a profile row). */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

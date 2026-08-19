import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cache } from "react";
import type {
  ProfileRole,
  StudentBootcampMembership,
} from "@/app/actions/bootcamp/types";

/**
 * Shares the server client and verified user for the current React request.
 * Do not use this for cross-request caching: the result is session-specific.
 */
export const getAuthedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

export const getProfileRole = cache(async (): Promise<ProfileRole | null> => {
  const { user } = await getAuthedUser();
  if (!user) return null;

  // Use service role: profiles RLS can call is_admin(), which authenticated
  // users often cannot EXECUTE — blocking even "read own role".
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getProfileRole error:", error);
    return null;
  }

  const role = data?.role;
  if (role === "student" || role === "parent" || role === "admin") {
    return role;
  }
  return "student";
});

export async function requireAdmin(): Promise<{ userId: string }> {
  const { user } = await getAuthedUser();
  if (!user) throw new Error("Not signed in");

  if ((await getProfileRole()) !== "admin") {
    throw new Error("Forbidden");
  }

  return { userId: user.id };
}

export const getStudentBootcamp = cache(async (): Promise<StudentBootcampMembership | null> => {
  const { user } = await getAuthedUser();
  if (!user) return null;

  // Service role: students/bootcamps RLS often blocks the user client from
  // reading their own membership (or joining bootcamps for the name).
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .select("bootcamp_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getStudentBootcamp error:", error);
    return null;
  }
  if (!data?.bootcamp_id) return null;

  const bootcampId = Number(data.bootcamp_id);
  if (!Number.isFinite(bootcampId)) return null;

  const { data: bootcamp, error: bootcampError } = await admin
    .from("bootcamps")
    .select("id, name")
    .eq("id", bootcampId)
    .maybeSingle();

  if (bootcampError || !bootcamp?.name) {
    console.error("getStudentBootcamp bootcamp error:", bootcampError);
    return null;
  }

  return { bootcampId, name: bootcamp.name as string };
});

import DashboardShell from "@/components/DashboardShell";
import { getAttemptCount } from "@/app/actions";
import { getProfileRole, getStudentBootcamp } from "@/app/bootcamp-actions";
import { createClient } from "@/lib/supabase/server";

function getInitials(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";

  if (fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
    return (first + last).toUpperCase() || "U";
  }

  const email = user.email ?? "";
  if (email.length >= 2) return email.slice(0, 2).toUpperCase();
  if (email.length === 1) return email.toUpperCase();
  return "U";
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [attemptCount, role, bootcamp] = await Promise.all([
    getAttemptCount(),
    getProfileRole(),
    getStudentBootcamp(),
  ]);

  return (
    <DashboardShell
      attemptCount={attemptCount}
      userInitials={user ? getInitials(user) : "U"}
      bootcampName={bootcamp?.name ?? null}
      isAdmin={role === "admin"}
    >
      {children}
    </DashboardShell>
  );
}

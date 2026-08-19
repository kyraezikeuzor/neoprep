import DashboardShell from "@/components/DashboardShell";
import { getDashboardShellStats } from "@/app/actions";
import { getAuthedUser, getProfileRole, getStudentBootcamp } from "@/app/actions/bootcamp/auth";

function getDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";

  if (fullName.trim()) return fullName.trim();

  const email = user.email ?? "";
  if (email.includes("@")) return email.split("@")[0] || "User";
  return email || "User";
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, shellStats, role, bootcamp] = await Promise.all([
    getAuthedUser(),
    getDashboardShellStats(),
    getProfileRole(),
    getStudentBootcamp(),
  ]);

  return (
    <DashboardShell
      xpTotal={shellStats.xpTotal}
      streak={shellStats.streak}
      userName={user ? getDisplayName(user) : "User"}
      bootcampName={bootcamp?.name ?? null}
      isAdmin={role === "admin"}
    >
      {children}
    </DashboardShell>
  );
}

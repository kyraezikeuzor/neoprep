import DashboardShell from "@/components/DashboardShell";
import { getDashboardShellStats } from "@/app/actions";
import {
  getAuthedUser,
  getProfileRole,
  getStudentBootcamp,
} from "@/app/actions/bootcamp/auth";
import { getStudentNextSession } from "@/app/actions/bootcamp";
import { isLocalStudentPreview } from "@/lib/devPreview";

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

const SESSION_LABEL_ABBREVIATIONS: Record<string, string> = {
  Sunday: "Sun",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  January: "Jan",
  February: "Feb",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Jun",
  July: "Jul",
  August: "Aug",
  September: "Sep",
  October: "Oct",
  November: "Nov",
  December: "Dec",
};

function compactSessionLabel(value: string) {
  return value
    .replace(
      /\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|January|February|March|April|May|June|July|August|September|October|November|December)\b/g,
      (label) => SESSION_LABEL_ABBREVIATIONS[label] ?? label
    )
    .replace(/\b(\d{1,2}):00 (?=(?:AM|PM)\b)/g, "$1 ")
    .replace(/\bCentral(?: Time)?\b/g, "CT");
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, shellStats, role, bootcamp, nextSession] = await Promise.all([
    getAuthedUser(),
    getDashboardShellStats(),
    getProfileRole(),
    getStudentBootcamp(),
    getStudentNextSession(),
  ]);
  const previewStudent = !user && isLocalStudentPreview;
  const nextClassLabel = nextSession
    ? `Next: ${compactSessionLabel(nextSession.dateLabel)} · ${compactSessionLabel(nextSession.timeLabel)}`
    : previewStudent
      ? "Next: Sat · 11 AM CT"
      : "Next live class coming up — open Live Classes";

  return (
    <DashboardShell
      xpTotal={previewStudent ? 480 : shellStats.xpTotal}
      streak={previewStudent ? 3 : shellStats.streak}
      userName={user ? getDisplayName(user) : previewStudent ? "Preview Student" : "User"}
      bootcampName={bootcamp?.name ?? (previewStudent ? "preview" : null)}
      isAdmin={role === "admin"}
      nextClassLabel={nextClassLabel}
    >
      {children}
    </DashboardShell>
  );
}

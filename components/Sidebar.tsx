"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { typography } from "@/lib/typography";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M11.2 3.35a1.3 1.3 0 011.6 0l7.35 5.95c.55.45.22 1.35-.48 1.35H18.5v8.1c0 .72-.58 1.3-1.3 1.3h-3.45v-5.35c0-.66-.54-1.2-1.2-1.2h-1.1c-.66 0-1.2.54-1.2 1.2V20.05H6.8c-.72 0-1.3-.58-1.3-1.3v-8.1H4.33c-.7 0-1.03-.9-.48-1.35L11.2 3.35z" />
      <path d="M15.85 4.1c0-.55.45-1 1-1h.55c.55 0 1 .45 1 1v2.35l-2.55-2.05V4.1z" />
    </svg>
  );
}

function BooksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="6" y="4" width="14" height="16" rx="2.25" />
      <path d="M6 7H5.25A2.25 2.25 0 003 9.25v8.5A2.25 2.25 0 005.25 20H8" />
      <path strokeLinecap="round" d="M11 9.4a2.15 2.15 0 114.3 0c0 1.65-2.15 1.8-2.15 3.15" />
      <circle cx="13.15" cy="15.8" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 3.75a7.25 7.25 0 105.03 12.47l3.12 3.13a1.15 1.15 0 001.63-1.63l-3.13-3.12A7.25 7.25 0 0011 3.75zm-4.95 7.25a4.95 4.95 0 119.9 0 4.95 4.95 0 01-9.9 0z"
      />
    </svg>
  );
}

function MistakesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19zm3.4 5.75a1 1 0 011.4 1.4L13.42 12l3.38 3.35a1 1 0 11-1.4 1.4L12 13.42l-3.35 3.38a1 1 0 11-1.4-1.4L10.58 12 7.2 8.65a1 1 0 011.4-1.4L12 10.58l3.4-3.33z" />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M7.25 3.5A2.25 2.25 0 005 5.75v14.1c0 .9 1.02 1.42 1.74.9l4.76-3.45a.75.75 0 01.85 0l4.76 3.45c.72.52 1.74 0 1.74-.9v-14.1A2.25 2.25 0 0016.6 3.5H7.25z" />
    </svg>
  );
}

function AssignmentsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M8.25 2.5a.9.9 0 01.9.9V4.5h5.7V3.4a.9.9 0 111.8 0V4.5h.6A2.75 2.75 0 0120 7.25v11A2.75 2.75 0 0117.25 21H6.75A2.75 2.75 0 014 18.25v-11A2.75 2.75 0 016.75 4.5h.6V3.4a.9.9 0 01.9-.9zM5.8 9.4v8.85c0 .52.43.95.95.95h10.5c.52 0 .95-.43.95-.95V9.4H5.8zm2.7 2.15h2.1v2.1h-2.1v-2.1zm4.35 0h2.1v2.1h-2.1v-2.1z" />
    </svg>
  );
}

function PracticeTestsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="5" y="4.5" width="14" height="16" rx="2.25" />
      <path d="M9 3.5h6v3H9z" fill="white" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11.5l1.4 1.4 2.4-2.6M14.5 11.5h2M8.5 16h8" />
    </svg>
  );
}

function VocabularyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="4" width="17" height="16" rx="3" />
      <path strokeLinecap="round" d="M7.3 16l2.6-7 2.6 7M8.2 13.7h3.4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.2 12.2c.7-.55 2.6-.65 2.6.8v3M16.8 14.15c-2.8-.45-3.2 2.2-1 2.2.5 0 .85-.15 1-.35" />
    </svg>
  );
}

function UpgradeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 3.2l1.55 4.05 4.3.35-3.28 2.78 1 4.18L12 12.7 8.43 14.56l1-4.18-3.28-2.78 4.3-.35L12 3.2zm-6.2 14.05h12.4v1.7H5.8v-1.7z" />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M4.75 5.5A2.25 2.25 0 002.5 7.75v8.5A2.25 2.25 0 004.75 18.5h9.1a2.25 2.25 0 002.25-2.25v-8.5A2.25 2.25 0 0013.85 5.5H4.75zM10.2 9.15l3.35 2.2a.9.9 0 010 1.5l-3.35 2.2a.9.9 0 01-1.4-.75v-4.4a.9.9 0 011.4-.75z" />
      <path d="M18.35 8.4c.62.52 1 1.28 1 2.1v3c0 .82-.38 1.58-1 2.1l1.4 1.4A.75.75 0 0021 16.45V7.55a.75.75 0 00-1.25-.55l-1.4 1.4z" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 2.5l7.5 3.2v5.1c0 4.7-3.1 8.9-7.5 10.2-4.4-1.3-7.5-5.5-7.5-10.2V5.7L12 2.5zm0 2.3L6.5 7v3.8c0 3.6 2.3 6.8 5.5 7.9 3.2-1.1 5.5-4.3 5.5-7.9V7L12 4.8z" />
    </svg>
  );
}

function PlaygroundIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M6.5 4.25A2.25 2.25 0 004.25 6.5v11A2.25 2.25 0 006.5 19.75h11a2.25 2.25 0 002.25-2.25v-11A2.25 2.25 0 0017.5 4.25h-11zm0 1.5h11c.41 0 .75.34.75.75v1.3H5.75V6.5c0-.41.34-.75.75-.75zm-.75 3.55h12.5v8.2c0 .41-.34.75-.75.75h-11a.75.75 0 01-.75-.75V9.3zm2.1 1.95a.9.9 0 10-.9-.9c0 .5.4.9.9.9zm2.65 0a.9.9 0 10-.9-.9c0 .5.4.9.9.9zm2.4 2.1a.75.75 0 011.04-.22l2.45 1.65a.75.75 0 010 1.24l-2.45 1.65A.75.75 0 0112 17.95V14a.75.75 0 01.9-.65z" />
    </svg>
  );
}

function StagingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M7 3.75A1.75 1.75 0 005.25 5.5v13A1.75 1.75 0 007 20.25h10A1.75 1.75 0 0018.75 18.5v-13A1.75 1.75 0 0017 3.75H7zm1.25 3h7.5v1.5h-7.5v-1.5zm0 3.25h7.5v1.5h-7.5V10zm0 3.25h4.25v1.5H8.25v-1.5zm7.17-1.53l2.12 2.12a.75.75 0 01-1.06 1.06l-1.59-1.59-.97.97a.75.75 0 01-1.06 0l-.97-.97a.75.75 0 111.06-1.06l.44.44 1.5-1.5a.75.75 0 011.06 0z" />
    </svg>
  );
}

function SkillsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 3.25a.75.75 0 01.69.45l1.87 4.22 4.58.42a.75.75 0 01.43 1.31l-3.45 3.04 1.01 4.49a.75.75 0 01-1.12.81L12 15.52l-3.99 2.32a.75.75 0 01-1.12-.81l1.01-4.49-3.45-3.04a.75.75 0 01.43-1.31l4.58-.42 1.87-4.22a.75.75 0 01.69-.45z" />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M6.25 4.25A2.25 2.25 0 004 6.5v7A2.25 2.25 0 006.25 15.75h2.6l2.42 2.76a1 1 0 001.46 0l2.42-2.76h2.6A2.25 2.25 0 0020 13.5v-7a2.25 2.25 0 00-2.25-2.25h-11.5zm2.5 4.5h6.5v1.5h-6.5v-1.5zm0 3h4.5v1.5h-4.5v-1.5z" />
    </svg>
  );
}

function LeaderboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 20.25h17M5 20v-5.5h4V20M10 20V9.5h4V20M15 20v-8h4v8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.25l.7 1.45 1.6.23-1.15 1.12.27 1.58L12 6.88l-1.42.75.27-1.58L9.7 4.93l1.6-.23.7-1.45z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M19.14 12.94c.04-.3.06-.62.06-.94s-.02-.64-.06-.94l1.68-1.31a.5.5 0 00.12-.64l-1.6-2.76a.5.5 0 00-.61-.22l-1.98.8a7.9 7.9 0 00-1.63-.94l-.3-2.1A.5.5 0 0014.33 3h-3.2a.5.5 0 00-.49.42l-.3 2.1c-.58.24-1.12.55-1.63.94l-1.98-.8a.5.5 0 00-.61.22L4.52 8.64a.5.5 0 00.12.64l1.68 1.31c-.04.3-.06.62-.06.94s.02.64.06.94l-1.68 1.31a.5.5 0 00-.12.64l1.6 2.76c.14.24.43.34.61.22l1.98-.8c.5.39 1.05.7 1.63.94l.3 2.1c.05.24.25.42.49.42h3.2c.24 0 .44-.18.49-.42l.3-2.1c.58-.24 1.12-.55 1.63-.94l1.98.8c.2.08.47-.02.61-.22l1.6-2.76a.5.5 0 00-.12-.64l-1.68-1.31zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ExamSelector() {
  return (
    <div className="shrink-0 px-3 pb-2 pt-1">
      <div
        className="flex h-11 items-center rounded-full bg-arc-soft p-1"
        aria-label="Exam selection"
      >
        <button
          type="button"
          aria-pressed="true"
          className="flex h-9 flex-1 items-center justify-center rounded-full bg-white font-sans text-sm font-medium text-[#0B0B0B] shadow-sm"
        >
          SAT
        </button>

        {(["ACT", "AP"] as const).map((exam) => (
          <div key={exam} className="group relative flex h-9 flex-1">
            <button
              type="button"
              disabled
              aria-label={`${exam} prep is coming soon`}
              className="flex h-9 w-full cursor-not-allowed items-center justify-center rounded-full font-sans text-sm font-medium text-[#747474]/65"
            >
              {exam}
            </button>
            <div
              role="tooltip"
              className={`pointer-events-none absolute top-[calc(100%+0.45rem)] z-40 w-40 rounded-xl border border-arc-line bg-white px-3 py-2 text-center font-sans text-xs font-normal leading-relaxed text-[#525252] opacity-0 shadow-[0_8px_24px_rgba(24,24,27,0.10)] transition duration-150 group-hover:opacity-100 ${
                exam === "AP" ? "right-0" : "left-1/2 -translate-x-1/2"
              }`}
            >
              {exam} prep is coming soon.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match?: "exact" | "prefix";
  badge?: string;
};

const BASE_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "HOME",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <HomeIcon />, match: "exact" },
      { href: "/assignments", label: "Study Planner", icon: <AssignmentsIcon /> },
    ],
  },
  {
    title: "PRACTICE",
    items: [
      { href: "/question-bank", label: "Question Bank", icon: <BooksIcon /> },
      { href: "/practice-tests", label: "Practice Tests", icon: <PracticeTestsIcon /> },
      { href: "/vocabulary", label: "Vocabulary", icon: <VocabularyIcon />, badge: "New" },
    ],
  },
  {
    title: "LEARN",
    items: [
      { href: "/sessions", label: "Live Classes", icon: <SessionsIcon />, badge: "PRO" },
    ],
  },
  {
    title: "COMMUNITY",
    items: [
      { href: "/leaderboard", label: "Leaderboard", icon: <LeaderboardIcon /> },
    ],
  },
  {
    title: "TRACK",
    items: [
      { href: "/skill-progress", label: "Skill Progress", icon: <SkillsIcon /> },
      { href: "/mistakes", label: "Mistakes", icon: <MistakesIcon /> },
      { href: "/saved", label: "Saved", icon: <SavedIcon /> },
    ],
  },
];

function navLinkClass(active: boolean) {
  return `flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition [&>svg]:h-[1.35rem] [&>svg]:w-[1.35rem] ${typography.navItem} ${
    active
      ? "bg-[#F5F5F5] text-arc-heading"
      : "text-[#747474]/85 hover:bg-arc-soft hover:text-[#525252]/85"
  }`;
}

function isActive(pathname: string | null, item: NavItem) {
  if (!pathname) return false;
  if (item.match === "exact") {
    return pathname === item.href || pathname === `${item.href}/`;
  }
  if (item.href === "/admin/generate-questions") {
    return (
      pathname === "/admin/generate-questions" ||
      pathname === "/admin/skills" ||
      pathname?.startsWith("/admin/generate-questions/")
    );
  }
  if (item.href === "/admin/sandbox") {
    return (
      pathname === "/admin/sandbox" ||
      pathname?.startsWith("/admin/sandbox/")
    );
  }
  if (item.href === "/admin/playground") {
    return (
      pathname === "/admin/playground" ||
      pathname === "/admin/tools" ||
      pathname?.startsWith("/admin/playground/")
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function Sidebar({
  hideBrand = false,
  bootcampName = null,
  isAdmin = false,
  userName = "User",
  onNavigate,
  onClose,
  showCloseButton = false,
}: {
  hideBrand?: boolean;
  bootcampName?: string | null;
  isAdmin?: boolean;
  userName?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const settingsActive = pathname?.startsWith("/settings");

  const studentSections = BASE_SECTIONS.map((section) => ({
    ...section,
    items: [...section.items],
  }));

  let sections = studentSections.filter((section) => section.items.length > 0);
  if (isAdmin) {
    sections = [
      {
        title: "ADMIN",
        items: [
          { href: "/admin", label: "Dashboard", icon: <HomeIcon />, match: "exact" },
          { href: "/admin/students", label: "Students", icon: <AdminIcon /> },
          { href: "/admin/classes", label: "Live Classes", icon: <SessionsIcon /> },
          { href: "/admin/leaderboard", label: "Leaderboard", icon: <LeaderboardIcon /> },
          { href: "/admin/question-search", label: "Lookup", icon: <SearchIcon /> },
          { href: "/admin/generate-questions", label: "Generate", icon: <SkillsIcon /> },
          { href: "/admin/sandbox", label: "Editor", icon: <StagingIcon /> },
          { href: "/admin/playground", label: "Playground", icon: <PlaygroundIcon /> },
          { href: "/admin/feedback", label: "Feedback", icon: <FeedbackIcon /> },
        ],
      },
      {
        title: "PRACTICE",
        items: [{ href: "/question-bank", label: "Question Bank", icon: <BooksIcon /> }],
      },
    ];
  }

  async function handleSignOut() {
    onNavigate?.();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="flex h-full w-full min-w-[14rem] max-w-[18rem] flex-col bg-white text-[#747474] lg:w-56 lg:max-w-none"
    >
      {!hideBrand && (
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#1BB1F6]">
            <Image src="/neoprep-mark-white.png" alt="Tutormigo" width={22} height={22} className="h-[22px] w-[22px] object-contain" priority />
          </span>
          <span className="min-w-0 flex-1 truncate font-sans text-xl font-medium tracking-normal text-[#0A0A0A]">
            Tutormigo
          </span>
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#747474] transition hover:bg-arc-soft hover:text-[#525252]"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>
      )}
      {!hideBrand ? <ExamSelector /> : null}
      <nav className={`flex-1 space-y-2 overflow-y-auto px-3 pb-3 ${hideBrand ? "pt-3" : "mt-1"}`}>
        {sections.map((section) => (
          <div key={section.title}>
            <p className={`mb-1 px-3 ${typography.navSection}`}>
              {section.title}
            </p>
            <div className="space-y-0">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={navLinkClass(isActive(pathname, item))}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white ${
                        item.badge === "PRO" ? "bg-[#EC4899]" : "bg-[#1BB1F6]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t border-[#ECECEC] px-3 py-3">
        <div>
            <p className={`mb-1 px-3 ${typography.navSection}`}>
            ACCOUNT
          </p>
          <Link
            href="/pricing"
            onClick={onNavigate}
            className={navLinkClass(pathname?.startsWith("/pricing") ?? false)}
            style={{ color: "#E54D96" }}
          >
            <UpgradeIcon />
            <span className="min-w-0 flex-1 truncate">Upgrade</span>
          </Link>
        </div>
        <div className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5">
          <span className="min-w-0 truncate font-sans text-sm font-medium text-[#525252]">
            {userName}
          </span>
          <Link
            href="/settings"
            onClick={onNavigate}
            aria-label="Settings"
            title="Settings"
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${
              settingsActive
                ? "bg-[#F4F4F4] text-[#0A0A0A]"
                : "text-[#747474] hover:bg-arc-soft hover:text-[#525252]"
            }`}
          >
            <SettingsIcon />
          </Link>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-11 w-full items-center rounded-lg px-2.5 py-2 text-left text-[15px] font-medium text-[#747474] transition hover:bg-arc-soft hover:text-[#525252]"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

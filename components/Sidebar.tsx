"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M5.2 4.4c-.72 0-1.3.58-1.3 1.3v12.6c0 .72.58 1.3 1.3 1.3h2.05c.72 0 1.3-.58 1.3-1.3V5.7c0-.72-.58-1.3-1.3-1.3H5.2z" />
      <path d="M9.55 4.55c-.7-.18-1.4.35-1.4 1.08v12.55c0 .58.4 1.08.97 1.22l4.55 1.15c.72.18 1.43-.36 1.43-1.1V6.9c0-.58-.4-1.08-.97-1.22l-4.58-1.13z" />
      <path d="M15.35 5.85c-.55-.35-1.25.05-1.25.7v11.95c0 .5.3.95.76 1.15l3.95 1.7c.78.34 1.64-.23 1.64-1.08V8.35c0-.42-.23-.8-.6-1.02l-4.5-1.48z" />
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
      <path d="M7 3.5A1.5 1.5 0 005.5 5v14A1.5 1.5 0 007 20.5h10a1.5 1.5 0 001.5-1.5V8.2L13.8 3.5H7zm6 1.2l3.8 3.8H13V4.7zM8.5 12h7v1.5h-7V12zm0 3.5h7V17h-7v-1.5z" />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M7 3.75A1.75 1.75 0 005.25 5.5v13A1.75 1.75 0 007 20.25h10A1.75 1.75 0 0018.75 18.5v-13A1.75 1.75 0 0017 3.75H7zm.75 3.5h8.5v1.5h-8.5V7.25zm0 3.5h8.5V12h-8.5v-1.25zm0 3.5h5.5v1.5h-5.5V14.25z" />
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
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M7 4h10v3h3v2.2c0 2.4-1.6 4.4-3.8 5.1L15.5 20h-7l-.7-5.7C5.6 13.6 4 11.6 4 9.2V7h3V4zm2 2v1H6v2.2c0 1.6 1 3 2.5 3.5l.4.1.5 4.2h5.2l.5-4.2.4-.1C16 12.2 17 10.8 17 9.2V7h-3V6H9z" />
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

type NavItem = { href: string; label: string; icon: ReactNode; match?: "exact" | "prefix" };

const BASE_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "HOME",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <HomeIcon />, match: "exact" },
    ],
  },
  {
    title: "PRACTICE",
    items: [
      { href: "/question-bank", label: "Question Bank", icon: <BooksIcon /> },
    ],
  },
  {
    title: "LEARN",
    items: [],
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
      { href: "/mistakes", label: "Mistakes", icon: <MistakesIcon /> },
      { href: "/saved", label: "Saved", icon: <SavedIcon /> },
    ],
  },
];

function navLinkClass(active: boolean) {
  return `flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${
    active
      ? "bg-white/20 text-white"
      : "text-white/70 hover:bg-white/10 hover:text-white/90"
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

  if (bootcampName) {
    studentSections.find((section) => section.title === "PRACTICE")?.items.unshift({
      href: "/assignments",
      label: "Roadmap",
      icon: <AssignmentsIcon />,
    });
    studentSections.find((section) => section.title === "LEARN")?.items.push({
      href: "/sessions",
      label: "Live Lessons",
      icon: <SessionsIcon />,
    });
  }

  let sections = studentSections.filter((section) => section.items.length > 0);
  if (isAdmin) {
    sections = [
      {
        title: "ADMIN",
        items: [
          { href: "/admin", label: "Dashboard", icon: <HomeIcon />, match: "exact" },
          { href: "/admin/bootcamps", label: "Bootcamps", icon: <AdminIcon /> },
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
    <aside className="flex h-full w-full min-w-[14rem] max-w-[18rem] flex-col bg-arc-sidebar text-white lg:w-56 lg:max-w-none">
      {!hideBrand && (
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/20 px-4">
          <Image
            src="/neoprep-mark-white.png"
            alt="Tutormigo"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 object-contain"
            priority
          />
          <span className="min-w-0 flex-1 truncate font-sans text-lg font-semibold tracking-tight text-white">
            Tutormigo
          </span>
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>
      )}
      <nav className={`flex-1 space-y-4 overflow-y-auto px-3 pb-3 ${hideBrand ? "pt-3" : "mt-4"}`}>
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.08em] text-white/50">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={navLinkClass(isActive(pathname, item))}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/20 px-3 py-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="min-w-0 truncate font-sans text-sm font-medium text-white">
            {userName}
          </span>
          <Link
            href="/settings"
            onClick={onNavigate}
            aria-label="Settings"
            title="Settings"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition ${
              settingsActive
                ? "text-white"
                : "text-white/55 hover:bg-white/10 hover:text-white/85"
            }`}
          >
            <SettingsIcon />
          </Link>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-11 w-full items-center rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white/90"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

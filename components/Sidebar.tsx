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

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 2.5l7.5 3.2v5.1c0 4.7-3.1 8.9-7.5 10.2-4.4-1.3-7.5-5.5-7.5-10.2V5.7L12 2.5zm0 2.3L6.5 7v3.8c0 3.6 2.3 6.8 5.5 7.9 3.2-1.1 5.5-4.3 5.5-7.9V7L12 4.8z" />
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: ReactNode; match?: "exact" | "prefix" };

const BASE_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "HOME",
    items: [{ href: "/dashboard", label: "Dashboard", icon: <HomeIcon />, match: "exact" }],
  },
  {
    title: "LEARN",
    items: [
      { href: "/question-bank", label: "Question Bank", icon: <BooksIcon /> },
      { href: "/question-viewer", label: "Question Search", icon: <SearchIcon /> },
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
  return `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-base font-medium transition ${
    active
      ? "bg-white/20 text-white"
      : "text-white/75 hover:bg-white/10 hover:text-white"
  }`;
}

function isActive(pathname: string | null, item: NavItem) {
  if (!pathname) return false;
  if (item.match === "exact") {
    return pathname === item.href || pathname === `${item.href}/`;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function Sidebar({
  hideBrand = false,
  bootcampName = null,
  isAdmin = false,
}: {
  hideBrand?: boolean;
  bootcampName?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const settingsActive = pathname?.startsWith("/settings");

  const sections = BASE_SECTIONS.map((section) => {
    if (section.title !== "LEARN" || isAdmin) return section;
    return {
      ...section,
      items: section.items.filter((item) => item.href !== "/question-viewer"),
    };
  });
  if (bootcampName) {
    sections.splice(1, 0, {
      title: "BOOTCAMP",
      items: [
        {
          href: "/assignments",
          label: "Assignments",
          icon: <AssignmentsIcon />,
        },
      ],
    });
  }
  if (isAdmin) {
    sections.push({
      title: "ADMIN",
      items: [{ href: "/admin", label: "Bootcamps", icon: <AdminIcon /> }],
    });
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-[#007AFF]">
      {!hideBrand && (
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <Image
            src="/tutormigo-logo.png"
            alt="Tutormigo"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-lg object-cover"
            priority
          />
          <span className="font-sans text-xl font-bold text-white">Tutormigo</span>
        </div>
      )}
      <nav className={`flex-1 space-y-5 overflow-y-auto px-3 pb-3 ${hideBrand ? "pt-3" : "mt-3"}`}>
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.08em] text-white">
              {section.title}
            </p>
            {section.title === "BOOTCAMP" && bootcampName && (
              <p className="mb-1.5 truncate px-3 font-sans text-xs text-white/70">
                {bootcampName}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
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
      <div className="space-y-1 p-3">
        <Link href="/settings" className={navLinkClass(!!settingsActive)}>
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-base text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

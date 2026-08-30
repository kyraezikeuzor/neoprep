"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NotificationsMenu from "@/components/NotificationsMenu";
import NavbarSearch from "@/components/NavbarSearch";
import Sidebar from "@/components/Sidebar";
import { PracticeSessionProvider, usePracticeSession } from "@/components/PracticeSessionProvider";

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
      <path
        fill="#EA580C"
        d="M12 2.2c1.6 2.2 3.9 3.6 4.6 6.1.6 2.1-.1 3.8-1.2 5.1 1.1-.3 2-.9 2.6-1.9.3 3.4-1.7 6.6-5.1 7.9-3.4-1.3-5.4-4.5-5.1-7.9.6 1 1.5 1.6 2.6 1.9-1.1-1.3-1.8-3-1.2-5.1C9.9 5.8 11 4 12 2.2z"
      />
      <path
        fill="#FFFFFF"
        d="M12 14.2c.7.2 1.2.8 1.2 1.5 0 .9-.7 1.5-1.2 1.5s-1.2-.6-1.2-1.5c0-.7.5-1.3 1.2-1.5z"
      />
    </svg>
  );
}

function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#0EA5E9" />
      <path
        d="M12 21a9 9 0 008.6-6.5C19.2 17.8 15.9 20 12 20s-7.2-2.2-8.6-5.5A9 9 0 0012 21z"
        fill="#0284C7"
        opacity="0.9"
      />
      <circle cx="9.2" cy="8.6" r="1.4" fill="#FFFFFF" opacity="0.95" />
      <rect
        x="10.2"
        y="10.2"
        width="3.6"
        height="3.6"
        rx="0.4"
        fill="#FFFFFF"
        transform="rotate(45 12 12)"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden>
      <path d="M8.5 11.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM15.75 12a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5zM3.75 18.5c0-2.4 2.35-4.25 4.75-4.25h.5c1.55 0 2.95.75 3.85 1.9.7-.7 1.65-1.15 2.7-1.15h.5c2.15 0 4.2 1.55 4.2 3.75v.75c0 .55-.45 1-1 1H4.75c-.55 0-1-.45-1-1v-1z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden>
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0c-.14-.34-.37-.76-.54-1.09a.09.09 0 00-.07-.03c-1.5.26-2.93.71-4.27 1.33a.08.08 0 00-.04.03C2.2 9.12 1.4 12.8 1.8 16.43a.1.1 0 00.04.07c1.8 1.32 3.53 2.12 5.24 2.65a.1.1 0 00.1-.03c.4-.55.76-1.13 1.07-1.74a.09.09 0 00-.05-.12 10.7 10.7 0 01-1.52-.73.09.09 0 01-.01-.15c.1-.08.2-.16.3-.24a.09.09 0 01.09-.01c3.2 1.46 6.66 1.46 9.82 0a.09.09 0 01.1.01c.1.08.2.17.3.25a.09.09 0 01-.01.14c-.48.29-.99.53-1.52.73a.09.09 0 00-.05.13c.32.61.68 1.19 1.07 1.74a.09.09 0 00.1.03c1.72-.53 3.45-1.33 5.25-2.65a.1.1 0 00.04-.07c.48-4.21-.8-7.86-3.38-11.07a.07.07 0 00-.03-.03zM8.52 14.91c-.97 0-1.77-.89-1.77-1.98 0-1.09.79-1.98 1.77-1.98 1 0 1.78.9 1.77 1.98 0 1.09-.79 1.98-1.77 1.98zm6.97 0c-.97 0-1.77-.89-1.77-1.98 0-1.09.79-1.98 1.77-1.98 1 0 1.78.9 1.77 1.98 0 1.09-.77 1.98-1.77 1.98z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function DashboardShellInner({
  children,
  xpTotal = 0,
  streak = 0,
  userName = "User",
  bootcampName = null,
  isAdmin = false,
  nextClassLabel = null,
}: {
  children: React.ReactNode;
  xpTotal?: number;
  streak?: number;
  userName?: string;
  bootcampName?: string | null;
  isAdmin?: boolean;
  nextClassLabel?: string | null;
}) {
  const { practiceActive } = usePracticeSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    if (mobileNavOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    function onChange(e: MediaQueryListEvent) {
      if (e.matches) setMobileNavOpen(false);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (practiceActive) {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-white font-sans">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white lg:rounded-tl-[28px] lg:border-l-2 lg:border-t-2 lg:border-arc-line">
          {children}
        </div>
      </div>
    );
  }

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white font-sans">
      {/* Desktop sidebar — only from lg (1024px) so mid widths use the drawer */}
      <div className="hidden h-full w-56 shrink-0 overflow-hidden lg:block">
        <Sidebar
          bootcampName={bootcampName}
          isAdmin={isAdmin}
          userName={userName}
        />
      </div>

      {/* Mobile / tablet drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileNav}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileNavOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] transform transition-transform duration-300 ease-out ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <Sidebar
            bootcampName={bootcampName}
            isAdmin={isAdmin}
            userName={userName}
            onNavigate={closeMobileNav}
            onClose={closeMobileNav}
            showCloseButton
          />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 bg-white px-3 py-1 sm:px-5 lg:px-1">
          <div className="w-full">
            <div className="flex h-12 w-full items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-arc-heading transition hover:bg-arc-soft lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
            >
              <MenuIcon />
            </button>

            <NavbarSearch />

            <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-2.5">
              {nextClassLabel ? (
                <Link
                  href="/sessions"
                  className="hidden h-10 min-w-0 max-w-[22rem] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0BAA5A] to-[#62C934] px-2.5 text-white shadow-sm transition hover:brightness-[0.98] md:flex lg:max-w-[26rem] lg:px-3"
                  title={nextClassLabel}
                >
                  <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    <span className="absolute h-2 w-2 animate-ping rounded-full bg-white/70" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-xs font-semibold lg:text-[13px]">
                    {nextClassLabel}
                  </span>
                  <span className="hidden h-7 shrink-0 items-center rounded-xl bg-[#E1FF91] px-2.5 font-sans text-xs font-semibold text-[#164E2B] xl:inline-flex">
                    View session
                  </span>
                </Link>
              ) : null}

              <Link href="/leaderboard" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#8A8A8A] transition hover:bg-arc-soft hover:text-[#0A0A0A]" title="Leaderboard">
                <PeopleIcon />
              </Link>

              <a
                href="https://discord.gg/fbC6DmmNNt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#A78BFA] transition hover:bg-[#F5F3FF]"
                title="Discord"
              >
                <DiscordIcon />
              </a>

              <NotificationsMenu />

              <div
                className="inline-flex h-10 shrink-0 items-stretch overflow-hidden rounded-full border border-[#E5E7EB] bg-transparent"
                aria-label={`${streak} day streak, ${xpTotal} XP`}
              >
                <div className="flex items-center gap-1 px-2.5 sm:gap-1.5 sm:px-3.5" title="Study streak">
                  <FlameIcon />
                  <span className="font-sans text-sm font-bold tabular-nums text-[#EA580C] sm:text-base">
                    {streak}
                  </span>
                </div>
                <div className="w-px self-stretch bg-[#E5E7EB]" aria-hidden />
                <div className="flex items-center gap-1 px-2.5 sm:gap-1.5 sm:px-3.5" title="XP">
                  <GemIcon />
                  <span className="font-sans text-sm font-bold tabular-nums text-[#0EA5E9] sm:text-base">
                    {xpTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white lg:mx-1 lg:mb-1.5 lg:rounded-t-[28px] lg:border-2 lg:border-arc-line">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  xpTotal = 0,
  streak = 0,
  userName = "User",
  bootcampName = null,
  isAdmin = false,
  nextClassLabel = null,
}: {
  children: React.ReactNode;
  xpTotal?: number;
  streak?: number;
  userName?: string;
  bootcampName?: string | null;
  isAdmin?: boolean;
  nextClassLabel?: string | null;
}) {
  return (
    <PracticeSessionProvider>
      <DashboardShellInner
        xpTotal={xpTotal}
        streak={streak}
        userName={userName}
        bootcampName={bootcampName}
        isAdmin={isAdmin}
        nextClassLabel={nextClassLabel}
      >
        {children}
      </DashboardShellInner>
    </PracticeSessionProvider>
  );
}

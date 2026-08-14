"use client";

import Link from "next/link";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PracticeSessionProvider, usePracticeSession } from "@/components/PracticeSessionProvider";

function PanelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2.25" />
      <path strokeLinecap="round" d="M9.25 5v14" />
    </svg>
  );
}

function QuestionCountIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.6 9.5a2.4 2.4 0 014.55.8c0 1.6-2.35 2.2-2.35 3.7"
      />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DashboardShellInner({
  children,
  attemptCount = 0,
  userInitials = "U",
  bootcampName = null,
  isAdmin = false,
}: {
  children: React.ReactNode;
  attemptCount?: number;
  userInitials?: string;
  bootcampName?: string | null;
  isAdmin?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { practiceActive } = usePracticeSession();

  if (practiceActive) {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-white font-sans">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white font-sans">
      {sidebarOpen ? (
        <div className="h-full w-56 shrink-0 overflow-hidden">
          <Sidebar bootcampName={bootcampName} isAdmin={isAdmin} />
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[3.25rem] shrink-0 items-center justify-between border-b border-[#E8E8E6] bg-white px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-expanded={sidebarOpen}
            className="flex h-8 w-8 items-center justify-center rounded-md text-arc-ink transition hover:bg-[#F4F4F5]"
          >
            <PanelIcon />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 text-arc-muted"
              title="Questions attempted"
              aria-label={`${attemptCount} questions attempted`}
            >
              <QuestionCountIcon />
              <span className="font-sans text-sm font-medium tabular-nums">
                {attemptCount}
              </span>
            </div>

            <Link
              href="/settings"
              aria-label="Profile and settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] font-sans text-xs font-semibold tracking-wide text-[#3F3F46] transition hover:bg-[#E8E8E6]"
            >
              {userInitials}
            </Link>
          </div>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  attemptCount = 0,
  userInitials = "U",
  bootcampName = null,
  isAdmin = false,
}: {
  children: React.ReactNode;
  attemptCount?: number;
  userInitials?: string;
  bootcampName?: string | null;
  isAdmin?: boolean;
}) {
  return (
    <PracticeSessionProvider>
      <DashboardShellInner
        attemptCount={attemptCount}
        userInitials={userInitials}
        bootcampName={bootcampName}
        isAdmin={isAdmin}
      >
        {children}
      </DashboardShellInner>
    </PracticeSessionProvider>
  );
}

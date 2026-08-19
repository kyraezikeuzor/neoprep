import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudentSessionsPageData } from "@/app/actions/bootcamp";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import { isLocalStudentPreview } from "@/lib/devPreview";

export const metadata: Metadata = {
  title: "Weekly Classes · Tutormigo",
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none" aria-hidden>
      <rect x="18" y="22" width="44" height="40" rx="4" stroke="currentColor" strokeWidth="3" />
      <path d="M18 34h44M30 16v10M50 16v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default async function SessionsPage() {
  const data = await getStudentSessionsPageData();
  const previewStudent = !data && isLocalStudentPreview;
  if (!data && !previewStudent) redirect("/dashboard");

  const { next, upcoming, bootcampName } = data ?? {
    next: {
      dateLabel: "Saturday",
      timeLabel: "11:00 AM CT",
      meetingUrl: null,
    },
    upcoming: [
      {
        id: "local-preview-session",
        dateLabel: "Saturday",
        timeLabel: "11:00 AM CT",
        status: "scheduled",
        hasMeetingLink: false,
      },
    ],
    bootcampName: "Live instruction",
  };
  const canJoin = Boolean(next.meetingUrl);

  return (
    <DashboardPageShell>
      <PageHeader title="Weekly Classes" />

      <div className="arc-card mt-8 grid divide-y divide-arc-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="relative min-h-[9.5rem] overflow-hidden px-6 py-5">
          <p className="arc-card-label">Next session</p>
          <p className="mt-3 font-sans text-xl font-normal leading-snug tracking-tight text-arc-heading sm:text-2xl">
            {next.dateLabel}
          </p>
          <p className="arc-card-hint mt-2">{next.timeLabel}</p>
          <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line sm:hidden">
            <CalendarIcon />
          </div>
        </div>

        <div className="relative min-h-[9.5rem] overflow-hidden px-6 py-5">
          <p className="arc-card-label">Bootcamp</p>
          <p className="mt-3 font-sans text-xl font-normal leading-snug tracking-tight text-arc-heading">
            {bootcampName}
          </p>
          <p className="arc-card-hint mt-2">Live class meeting</p>
        </div>

        <div className="relative flex min-h-[9.5rem] flex-col overflow-hidden px-6 py-5">
          <p className="arc-card-label">Join</p>
          <div className="relative z-10 mt-3">
            {canJoin ? (
              <a
                href={next.meetingUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-arc-line bg-white px-3 py-1 font-sans text-xs font-medium text-[#8F8F98] transition hover:bg-arc-soft"
              >
                Join session
              </a>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-arc-line bg-arc-soft px-3 py-1 font-sans text-xs font-medium text-[#8F8F98]"
                >
                  Join session
                </button>
                <p className="arc-card-hint mt-2">
                  Meeting link not yet available.
                </p>
              </>
            )}
          </div>
          <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line">
            <CalendarIcon />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-sans text-base font-medium text-arc-heading">
          Upcoming sessions
        </h2>
        {upcoming.length === 0 ? (
          <div className="arc-card relative mt-4 min-h-[8rem] overflow-hidden px-6 py-5">
            <p className="arc-card-label">Upcoming</p>
            <p className="mt-3 font-sans text-xl font-normal text-arc-heading">None scheduled</p>
            <p className="arc-card-hint mt-2">Check back for new session times.</p>
            <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line">
              <CalendarIcon />
            </div>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {upcoming.map((session, index) => (
              <li
                key={session.id ?? `computed-${index}`}
                className="arc-card grid divide-y divide-arc-line sm:grid-cols-2 sm:divide-x sm:divide-y-0"
              >
                <div className="relative min-h-[8rem] overflow-hidden px-6 py-5">
                  <p className="arc-card-label">Date</p>
                  <p className="mt-3 font-sans text-xl font-normal leading-snug tracking-tight text-arc-heading">
                    {session.dateLabel}
                  </p>
                  <p className="arc-card-hint mt-2">{session.timeLabel}</p>
                </div>
                <div className="relative min-h-[8rem] overflow-hidden px-6 py-5">
                  <p className="arc-card-label">Status</p>
                  <p className="mt-3 font-sans text-xl font-normal capitalize leading-snug tracking-tight text-arc-heading">
                    {session.status || "Scheduled"}
                  </p>
                  <div className="pointer-events-none absolute -bottom-3 -right-2 text-arc-line">
                    <CalendarIcon />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardPageShell>
  );
}

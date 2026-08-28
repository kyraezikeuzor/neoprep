"use client";

import Image from "next/image";
import Link from "next/link";
import type { StudentSessionListItem } from "@/app/actions/bootcamp/types";
import { typography } from "@/lib/typography";
import { getLiveSessionMeta } from "@/lib/live-sessions";

type Props = {
  next: { sessionId: string | null; dateLabel: string; timeLabel: string; meetingUrl: string | null };
  upcoming: StudentSessionListItem[];
  bootcampName?: string | null;
};

function nextWeekdayDate(weekdayName: string, weeksAhead = 0) {
  const names = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const target = names.indexOf(weekdayName.toLowerCase());
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const delta = target >= 0 ? (target - date.getDay() + 7) % 7 : 0;
  date.setDate(date.getDate() + delta + weeksAhead * 7);
  return date;
}

function previewUpcoming(next: Props["next"]): StudentSessionListItem[] {
  return [0, 1, 2, 3].map((week) => {
    const date = nextWeekdayDate(next.dateLabel, week);
    const datePart = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
    }).format(date);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
      date
    );
    const timePart = next.timeLabel.includes(" · ")
      ? next.timeLabel.split(" · ").slice(1).join(" · ")
      : next.timeLabel || "11:00 AM CT";
    return {
      id: `preview-${week}`,
      sessionDate: null,
      dateLabel: weekday,
      timeLabel: `${datePart} · ${timePart}`,
      status: null,
      hasMeetingLink: false,
    };
  });
}

function parseSessionWhen(item: StudentSessionListItem) {
  const parts = item.timeLabel
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      dateHeading: `${item.dateLabel}, ${parts[0]}`,
      timePart: parts.slice(1).join(" · "),
    };
  }
  return { dateHeading: item.dateLabel, timePart: item.timeLabel };
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 11V8a4 4 0 118 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstructorCard() {
  return (
    <section className="arc-card p-4 sm:p-5">
      <h2 className={typography.cardTitle}>
        Meet your instructor
      </h2>

      <div className="relative mt-3 h-28 w-28 overflow-hidden rounded-full">
        <Image
          src="/landing/kyra-hero.jpg"
          alt="Kyra, Tutormigo tutor"
          fill
          sizes="112px"
          className="object-cover object-[center_20%]"
        />
      </div>

      <h3 className={`mt-2.5 ${typography.sectionTitle}`}>
        Kyra Ezikeuzor
      </h3>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-medium text-[#166534]">
          1560 SAT
        </span>
        <span className="rounded-full bg-[#FCE7F3] px-2.5 py-1 text-[11px] font-medium text-[#9D174D]">
          Columbia University
        </span>
      </div>

      <p className={`mt-2 ${typography.cardBody}`}>
        Kyra is an undergraduate at Columbia University studying Computer
        Science and Biology who earned a 1560 on the SAT (790 Math). She has
        spent hundreds of hours mentoring students for the SAT and college
        applications.
      </p>
    </section>
  );
}

export default function LiveLessonsHub({
  next,
  upcoming,
  bootcampName,
}: Props) {
  const sessions = upcoming.length > 0 ? upcoming : previewUpcoming(next);
  const groups: { heading: string; items: { session: StudentSessionListItem; index: number }[] }[] =
    [];

  sessions.forEach((session, index) => {
    const { dateHeading } = parseSessionWhen(session);
    const existing = groups.find((group) => group.heading === dateHeading);
    if (existing) {
      existing.items.push({ session, index });
      return;
    }
    groups.push({ heading: dateHeading, items: [{ session, index }] });
  });

  return (
    <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        <section
          className="rounded-[28px] bg-[#EC4899] px-5 py-6 sm:px-7"
          aria-label="Unlock Weekly Live Classes with Pro"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-[#FDE7F4] px-3 py-1 font-sans text-xs font-bold tracking-wide text-[#EC4899]">
                  PRO
                </span>
                <h2 className="font-dm text-xl font-medium tracking-normal text-[#FDE7F4] sm:text-2xl">
                  Unlock Weekly Live Classes with Pro
                </h2>
              </div>

              <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[#FDE7F4] sm:text-base">
                Learn from Kyra live, ask questions, and work through SAT
                concepts with other students in real time.
              </p>

              <p className="mt-3 font-sans text-sm font-semibold text-[#FDE7F4]">
                4 lessons scheduled this month
              </p>

            </div>

            <Link
              href="/pricing"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-6 py-2.5 font-sans text-base font-semibold text-[#EC4899] transition hover:bg-[#FDE7F4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Upgrade
            </Link>
          </div>
        </section>

        <section className="arc-card overflow-hidden">
          <div className="border-b border-arc-line px-5 py-4">
            <h2 className={typography.cardTitle}>
              Upcoming sessions
            </h2>
            {bootcampName ? (
              <p className="arc-card-hint mt-1 text-sm">{bootcampName}</p>
            ) : null}
          </div>

          {groups.length === 0 ? (
            <p className={`px-5 py-10 text-center ${typography.cardHint}`}>
              No upcoming live sessions yet.
            </p>
          ) : (
            <ol className="divide-y divide-arc-line">
              {groups.map((group) => (
                <li key={group.heading} className="px-5 py-4 sm:px-6">
                  <p className={typography.eyebrow}>
                    {group.heading}
                  </p>
                  <div className="mt-3 space-y-3">
                    {group.items.map(({ session, index }) => {
                      const { timePart } = parseSessionWhen(session);
                      const { title, duration } = getLiveSessionMeta(index);
                      const isNext =
                        Boolean(next.meetingUrl) &&
                        (next.sessionId
                          ? session.id === next.sessionId
                          : index === 0);
                      return (
                        <article
                          key={session.id ?? `${group.heading}-${index}`}
                          className="flex items-start gap-3"
                        >
                          <div className="flex w-[6.5rem] shrink-0 flex-col pt-0.5">
                            <span className="font-sans text-sm font-normal tabular-nums text-arc-heading">
                              {timePart || next.timeLabel}
                            </span>
                            <span className={`mt-0.5 ${typography.metadata}`}>
                              {duration}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 rounded-xl border border-arc-line bg-white px-3.5 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={typography.cardItemTitle}>
                                  {title}
                                </p>
                                <p className={`mt-0.5 ${typography.metadata}`}>
                                  Live with Kyra
                                </p>
                              </div>
                              {isNext ? (
                                <a
                                  href={next.meetingUrl!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => {
                                    if (!next.sessionId) return;
                                    void fetch("/api/live-sessions/attendance", {
                                      method: "POST",
                                      headers: { "content-type": "application/json" },
                                      body: JSON.stringify({
                                        sessionId: next.sessionId,
                                        sessionTitle: title,
                                        timeLabel: timePart || next.timeLabel,
                                      }),
                                      keepalive: true,
                                    });
                                  }}
                                  className="arc-btn-primary shrink-0 rounded-full px-3.5 py-1.5 text-xs"
                                >
                                  Join
                                </a>
                              ) : (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-arc-line px-2.5 py-1 font-sans text-[11px] font-medium text-arc-muted">
                                  <LockIcon />
                                  Pro
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="lg:sticky lg:top-4">
        <InstructorCard />
      </div>
    </div>
  );
}

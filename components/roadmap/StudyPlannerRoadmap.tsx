import Link from "next/link";
import type {
  AssignmentListItem,
  RoadmapSessionData,
} from "@/app/actions/bootcamp/types";
import { typography } from "@/lib/typography";
import GenerateRoadmapButton from "@/components/roadmap/GenerateRoadmapButton";

function focusTitle(title: string) {
  return title.replace(/^(?:Focus Questions|Question Set):\s*/i, "");
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function suggestedWeekLabel(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", {
    month: start.getMonth() === end.getMonth() ? undefined : "short",
    day: "numeric",
  });
  return `${startLabel} to ${endLabel}`;
}

export function previewStudyDates(now = new Date()) {
  return [0, 2, 5, 8, 11, 15]
    .map((offset) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset))
    .filter((date) => date.getMonth() === now.getMonth())
    .map(toDateKey);
}

function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="m5.5 12.5 4 4 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function RoadmapNode({ state }: { state: "complete" | "current" | "available" | "optional" | "locked" }) {
  const styles = {
    complete: "border-[#86D7AA] bg-[#ECFDF3] text-[#15803D]",
    current: "border-[#1BB1F6] bg-[#1BB1F6] text-white ring-4 ring-[#DDF4FF]",
    available: "border-[#1BB1F6] bg-white text-[#0890D4]",
    optional: "border-[#86D7AA] bg-[#ECFDF3] text-[#15803D]",
    locked: "border-[#D4D4D4] bg-[#F4F4F4] text-[#A3A3A3]",
  }[state];

  return (
    <span className={`absolute -left-9 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 sm:-left-11 sm:h-8 sm:w-8 ${styles}`} aria-hidden>
      {state === "complete" ? <CheckIcon className="h-4 w-4" /> : null}
      {state === "locked" ? <LockIcon className="h-3.5 w-3.5" /> : null}
      {state !== "complete" && state !== "locked" ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
    </span>
  );
}

function StudyRhythmCalendar({ activeDates }: { activeDates: string[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(now);
  const active = new Set(activeDates);

  return (
    <aside className="arc-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={typography.eyebrow}>Study rhythm</p>
          <h2 className={`mt-1.5 ${typography.sectionTitle}`}>{monthLabel}</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F7FF] text-[#0890D4]">
          <CalendarIcon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className={`mt-2 ${typography.cardHint}`}>Each blue square marks a day you practiced.</p>

      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center" aria-label={`${monthLabel} study activity`}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`} className={typography.caption}>{day}</span>
        ))}
        {Array.from({ length: firstDayOffset }, (_, index) => <span key={`blank-${index}`} aria-hidden />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const key = toDateKey(new Date(year, month, day));
          const studied = active.has(key);
          const isToday = key === todayKey;
          return (
            <span
              key={key}
              title={studied ? `Studied on ${key}` : undefined}
              aria-label={`${monthLabel.split(" ")[0]} ${day}${studied ? ", studied" : ""}${isToday ? ", today" : ""}`}
              className={`flex aspect-square min-h-7 items-center justify-center rounded-lg font-sans text-xs font-medium ${studied ? "bg-[#1BB1F6] text-white" : "bg-[#F4F4F4] text-[#747474]"} ${isToday ? "ring-2 ring-[#075985] ring-offset-2" : ""}`}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[#BDEBFF] bg-[#F3FBFF] p-4">
        <p className={typography.cardTitle}>{active.size} study day{active.size === 1 ? "" : "s"} this month</p>
        <p className={`mt-1 ${typography.cardHint}`}>Your Roadmap moves with your progress, even when your schedule changes.</p>
      </div>
    </aside>
  );
}

function RoadmapInsights({ activeDates }: { activeDates: string[] }) {
  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      <Link
        href="/skill-progress"
        className="arc-btn-secondary flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5"
      >
        Go to Skill Progress
        <span aria-hidden>→</span>
      </Link>
      <StudyRhythmCalendar activeDates={activeDates} />
    </div>
  );
}

export function EmptyRoadmap({ activeDates }: { activeDates: string[] }) {
  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="arc-card px-6 py-8">
        <p className={typography.cardTitle}>Your Roadmap will appear here soon.</p>
        <p className={`mt-2 ${typography.cardBody}`}>Your next Question Set will be added based on your recent practice.</p>
      </div>
      <RoadmapInsights activeDates={activeDates} />
    </div>
  );
}

export default function StudyPlannerRoadmap({ assignments, previewStudent, activeDates, liveSessions }: { assignments: AssignmentListItem[]; previewStudent: boolean; activeDates: string[]; liveSessions: RoadmapSessionData }) {
  const current = assignments.find((assignment) => assignment.question_count > 0 && assignment.completed_count < assignment.question_count) ?? assignments.find((assignment) => assignment.question_count > 0) ?? assignments[0];
  const currentIndex = assignments.findIndex((assignment) => assignment.id === current.id);
  const upNext = assignments.slice(currentIndex + 1).find((assignment) => assignment.question_count > 0);
  const completedFocuses = assignments.filter((assignment) => assignment.id !== current.id && assignment.question_count > 0 && assignment.completed_count >= assignment.question_count);
  const total = current.question_count;
  const completed = Math.min(current.completed_count, total);
  const remaining = Math.max(total - completed, 0);
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const currentHref = previewStudent ? "/question-bank?practice=1&subject=math&tier=2&count=10" : `/assignments/${current.id}`;
  const topic = focusTitle(current.title);
  const completedStepCount = completedFocuses.length + liveSessions.attended.length;

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div>
        <div className="relative pl-9 [&>div+div]:mt-4 sm:pl-11">
          <span className="absolute bottom-7 left-[13px] top-7 w-0.5 rounded-full bg-[#BDEBFF] sm:left-[15px]" aria-hidden />

          {completedStepCount > 0 ? (
            <div className="relative">
              <RoadmapNode state="complete" />
              <details className="arc-card px-5 py-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={typography.cardLabel}>Completed</p>
                      <p className={`mt-1 ${typography.cardTitle}`}>{completedStepCount} completed step{completedStepCount === 1 ? "" : "s"}</p>
                    </div>
                    <span className="rounded-full bg-[#ECFDF3] px-3 py-1 font-sans text-xs font-medium text-[#15803D]">Review anytime</span>
                  </div>
                </summary>
                <div className="mt-4 space-y-3 border-t border-arc-line pt-4">
                  {completedFocuses.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between gap-4">
                      <div>
                        <p className={typography.cardItemTitle}>{focusTitle(assignment.title)}</p>
                        <p className={`mt-0.5 ${typography.caption}`}>{assignment.question_count} of {assignment.question_count} complete</p>
                      </div>
                      <CheckIcon className="h-4 w-4 shrink-0 text-[#15803D]" />
                    </div>
                  ))}
                  {liveSessions.attended.map((session) => (
                    <div key={`attended-${session.id ?? session.sessionDate}`} className="flex items-center justify-between gap-4">
                      <div>
                        <p className={typography.cardItemTitle}>{session.title}</p>
                        <p className={`mt-0.5 ${typography.caption}`}>{session.dateLabel} · {session.timeLabel}</p>
                      </div>
                      <span className="rounded-full bg-[#ECFDF3] px-3 py-1 font-sans text-xs font-medium text-[#15803D]">Attended</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ) : null}

          <div className="relative" id="current-roadmap-step">
            <RoadmapNode state="current" />
            <section className="arc-card scroll-mt-24 border-2 border-dotted border-[#A9E6FF] px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={typography.cardLabel}>Current Question Set</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F7FF] px-3 py-1.5 font-sans text-xs font-medium text-[#087EBA]">
                  <CalendarIcon className="h-3.5 w-3.5" /> Suggested {suggestedWeekLabel()}
                </span>
              </div>
              <h2 className={`mt-3 ${typography.sectionTitle}`}>{topic}</h2>
              <p className={`mt-1.5 ${typography.cardBody}`}>{remaining === 0 ? "You finished this set. Review it to reinforce the pattern." : `${remaining} question${remaining === 1 ? "" : "s"} left. Your next set unlocks when this one is complete.`}</p>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="h-2 max-w-md overflow-hidden rounded-full bg-[#E5F7FF]"><div className="h-full rounded-full bg-[#1BB1F6] transition-[width]" style={{ width: `${pct}%` }} /></div>
                  <p className={`mt-2 ${typography.caption}`}>{completed} of {total} complete</p>
                </div>
                <Link href={currentHref} className="arc-btn-primary min-h-11 shrink-0 px-6 py-2.5">{completed > 0 ? "Continue set" : "Start set"}</Link>
              </div>
              {remaining === 0 && !previewStudent ? <GenerateRoadmapButton /> : null}
            </section>
          </div>

          {liveSessions.next ? (
            <div className="relative">
              <RoadmapNode state="available" />
              <section className="arc-card flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className={typography.cardLabel}>Next live class</p>
                  <h2 className={`mt-1.5 ${typography.cardTitle}`}>{liveSessions.next.title}</h2>
                  <p className={`mt-1 ${typography.cardHint}`}>{liveSessions.next.dateLabel} · {liveSessions.next.timeLabel}</p>
                  <p className={`mt-1 ${typography.caption}`}>Bring questions from your current Question Set.</p>
                </div>
                <Link href="/sessions" className="arc-btn-secondary min-h-11 shrink-0 px-5 py-2.5">View live lesson</Link>
              </section>
            </div>
          ) : null}

          <div className="relative">
            <RoadmapNode state="optional" />
            <section className="arc-card flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className={typography.cardLabel}>Optional boost</p><h2 className={`mt-1.5 ${typography.cardTitle}`}>Question Drill: {topic}</h2><p className={`mt-1 ${typography.cardHint}`}>10 questions based on your recent misses.</p></div>
              <Link href="/question-bank?practice=1&subject=math&tier=2&count=10" className="arc-btn-secondary min-h-11 shrink-0 px-5 py-2.5">Start drill</Link>
            </section>
          </div>

          {upNext ? (
            <div className="relative">
              <RoadmapNode state="locked" />
              <section className="arc-card flex flex-col gap-4 border-dashed px-5 py-5 opacity-75 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div><p className={typography.cardLabel}>Up next</p><h2 className={`mt-1.5 ${typography.cardTitle}`}>{focusTitle(upNext.title)}</h2><p className={`mt-1 ${typography.cardHint}`}>Unlocks when your current Question Set is complete.</p></div>
                <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#F4F4F4] px-4 py-2 font-sans text-xs font-medium text-[#747474]"><LockIcon className="h-3.5 w-3.5" /> Locked</span>
              </section>
            </div>
          ) : null}
        </div>
      </div>

      <RoadmapInsights activeDates={activeDates} />
    </div>
  );
}

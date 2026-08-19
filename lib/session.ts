/** Pure helpers for bootcamp "next session" display (no Cal.com). */

const WEEKDAY_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const TZ_SHORT_LABEL: Record<string, string> = {
  "America/Chicago": "Central",
  "America/New_York": "Eastern",
  "America/Denver": "Mountain",
  "America/Los_Angeles": "Pacific",
  "America/Phoenix": "Arizona",
};

/** Calendar y/m/d + hour/minute in a given IANA timezone. */
export function getZonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  ) as Record<string, string>;

  const weekdayShort = (parts.weekday || "").toLowerCase();
  const weekdayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: weekdayMap[weekdayShort] ?? 0,
  };
}

function parseStartTime(startTime: string): { hour: number; minute: number } | null {
  const m = startTime.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Build a UTC Date for a wall-clock time on a calendar day in `timeZone`.
 * Iterates from a UTC noon guess so DST is handled by Intl.
 */
function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  let utc = Date.UTC(year, month - 1, day, 12, 0, 0);
  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(new Date(utc), timeZone);
    const desiredAsMinutes = hour * 60 + minute;
    const actualAsMinutes = parts.hour * 60 + parts.minute;
    const dayDelta =
      Date.UTC(year, month - 1, day) -
      Date.UTC(parts.year, parts.month - 1, parts.day);
    const dayDeltaMinutes = dayDelta / 60000;
    utc += (desiredAsMinutes - actualAsMinutes + dayDeltaMinutes) * 60 * 1000;
  }
  return new Date(utc);
}

export type NextSessionComputed = {
  sessionAt: Date;
  dateLabel: string;
  timeLabel: string;
};

/**
 * Next occurrence of `dayOfWeek` at `startTime` in `timeZone`.
 * If that day is today and start_time hasn't passed, use today; else next week.
 */
export function computeNextSession(params: {
  dayOfWeek: string;
  startTime: string;
  timezone: string;
  now?: Date;
}): NextSessionComputed | null {
  const timeZone = params.timezone?.trim() || "America/Chicago";
  const targetWeekday = WEEKDAY_TO_INDEX[params.dayOfWeek.trim().toLowerCase()];
  if (targetWeekday == null) return null;

  const start = parseStartTime(params.startTime);
  if (!start) return null;

  const now = params.now ?? new Date();
  const nowParts = getZonedParts(now, timeZone);

  let delta = (targetWeekday - nowParts.weekday + 7) % 7;
  if (delta === 0) {
    const nowMinutes = nowParts.hour * 60 + nowParts.minute;
    const startMinutes = start.hour * 60 + start.minute;
    if (nowMinutes >= startMinutes) delta = 7;
  }

  const baseUtc = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 12, 0, 0);
  const targetNoon = new Date(baseUtc + delta * 24 * 60 * 60 * 1000);
  const targetParts = getZonedParts(targetNoon, timeZone);

  const sessionAt = zonedWallTimeToUtc(
    targetParts.year,
    targetParts.month,
    targetParts.day,
    start.hour,
    start.minute,
    timeZone
  );

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(sessionAt);

  const monthDayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
  }).format(sessionAt);

  const timeCore = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(sessionAt);

  const tzLabel =
    TZ_SHORT_LABEL[timeZone] ||
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    })
      .formatToParts(sessionAt)
      .find((p) => p.type === "timeZoneName")?.value ||
    timeZone;

  return {
    sessionAt,
    dateLabel,
    timeLabel: `${monthDayLabel} · ${timeCore} ${tzLabel}`,
  };
}

/**
 * Cal.com API v2 helpers (server-only).
 * Auth: Authorization: Bearer CAL_API_KEY
 * Version: cal-api-version: 2024-08-13
 */

const CAL_API_BASE = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-08-13";
const ATTENDEE_TIMEZONE = "America/Chicago";

export type CalBookingResult =
  | { ok: true; calBookingId: string; occurrenceCount: number }
  | { ok: false; error: string; bookingFailed: true };

type CalRecurringBooking = {
  id?: number;
  uid?: string;
  recurringBookingUid?: string | null;
  recurringEventId?: string | null;
  start?: string;
  status?: string;
};

function getCalApiKey(): string | null {
  const key = process.env.CAL_API_KEY?.trim();
  return key || null;
}

async function calFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const apiKey = getCalApiKey();
  if (!apiKey) {
    return { ok: false, error: "CAL_API_KEY is not configured", status: 0 };
  }

  const res = await fetch(`${CAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": CAL_API_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    let message = `Cal.com request failed (${res.status})`;
    if (body && typeof body === "object") {
      const errObj =
        "error" in body && body.error && typeof body.error === "object"
          ? (body.error as { message?: unknown })
          : null;
      if (typeof errObj?.message === "string" && errObj.message.trim()) {
        message = errObj.message;
      } else if (
        "message" in body &&
        typeof (body as { message?: unknown }).message === "string" &&
        (body as { message: string }).message.trim()
      ) {
        message = (body as { message: string }).message;
      }
    }
    return { ok: false, error: message, status: res.status };
  }

  return { ok: true, data: body as T };
}

/** Earliest available slot start (UTC ISO) for an event type over the next ~90 days. */
export async function getNextEventTypeSlotStart(
  eventTypeId: number
): Promise<{ ok: true; start: string } | { ok: false; error: string }> {
  const startTime = new Date();
  const endTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const result = await calFetch<{
    data?: {
      slots?: Record<string, { time: string }[]>;
    };
    status?: string;
  }>(
    `/slots/available?eventTypeId=${encodeURIComponent(String(eventTypeId))}` +
      `&startTime=${encodeURIComponent(startTime.toISOString())}` +
      `&endTime=${encodeURIComponent(endTime.toISOString())}`
  );

  if (!result.ok) return { ok: false, error: result.error };

  const slotsByDay = result.data?.data?.slots ?? {};
  const times: string[] = [];
  for (const day of Object.keys(slotsByDay).sort()) {
    for (const slot of slotsByDay[day] ?? []) {
      if (slot?.time) times.push(slot.time);
    }
  }

  if (times.length === 0) {
    return {
      ok: false,
      error: `No available Cal.com slots for event type ${eventTypeId} in the next 90 days`,
    };
  }

  times.sort();
  // Cal booking `start` expects UTC without timezone suffix per API docs.
  const start = times[0]!.replace(/\.\d{3}Z$/, "").replace(/Z$/, "");
  return { ok: true, start };
}

/**
 * Extract a stable series id from a recurring booking response.
 * Prefers recurringBookingUid / recurringEventId, else first booking uid.
 */
export function pickCalBookingIdFromResponse(payload: unknown): {
  calBookingId: string | null;
  occurrenceCount: number;
} {
  const root =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: unknown }).data
      : payload;

  const bookings: CalRecurringBooking[] = Array.isArray(root)
    ? (root as CalRecurringBooking[])
    : root && typeof root === "object"
      ? [root as CalRecurringBooking]
      : [];

  if (bookings.length === 0) {
    return { calBookingId: null, occurrenceCount: 0 };
  }

  const first = bookings[0]!;
  const seriesId =
    first.recurringBookingUid ||
    first.recurringEventId ||
    bookings.find((b) => b.recurringBookingUid)?.recurringBookingUid ||
    bookings.find((b) => b.recurringEventId)?.recurringEventId ||
    first.uid ||
    null;

  return {
    calBookingId: seriesId ? String(seriesId) : null,
    occurrenceCount: bookings.length,
  };
}

export async function createCalRecurringBooking(params: {
  eventTypeId: number;
  start: string;
  attendeeName: string;
  attendeeEmail: string;
}): Promise<CalBookingResult> {
  const result = await calFetch<unknown>("/bookings", {
    method: "POST",
    body: JSON.stringify({
      eventTypeId: params.eventTypeId,
      start: params.start,
      attendee: {
        name: params.attendeeName,
        email: params.attendeeEmail,
        timeZone: ATTENDEE_TIMEZONE,
        language: "en",
      },
    }),
  });

  if (!result.ok) {
    return { ok: false, error: result.error, bookingFailed: true };
  }

  const picked = pickCalBookingIdFromResponse(result.data);
  if (!picked.calBookingId) {
    return {
      ok: false,
      error: "Cal.com returned bookings but no uid/recurringBookingUid to store",
      bookingFailed: true,
    };
  }

  return {
    ok: true,
    calBookingId: picked.calBookingId,
    occurrenceCount: picked.occurrenceCount,
  };
}

/** Best-effort meeting link lookup for a Cal booking uid. Returns null if unavailable. */
export async function getCalBookingMeetingUrl(
  bookingUid: string
): Promise<string | null> {
  const uid = bookingUid.trim();
  if (!uid) return null;

  const result = await calFetch<{
    status?: string;
    data?: {
      meetingUrl?: string | null;
      location?: string | null;
      videoCallUrl?: string | null;
    };
  }>(`/bookings/${encodeURIComponent(uid)}`);

  if (!result.ok) {
    console.warn("getCalBookingMeetingUrl failed:", result.error);
    return null;
  }

  const data = result.data?.data ?? null;
  const candidates = [data?.meetingUrl, data?.videoCallUrl, data?.location];
  for (const value of candidates) {
    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) {
      return value.trim();
    }
  }
  return null;
}

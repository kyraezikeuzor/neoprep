import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCalRecurringBooking,
  getCalBookingMeetingUrl,
  getNextEventTypeSlotStart,
} from "@/lib/cal/bookings";
import { computeNextSession, getZonedParts } from "@/lib/session";
import {
  normalizeQuestion,
  QUESTION_SELECT,
  type Question,
} from "@/lib/questions";
import {
  getAuthedUser,
  getStudentBootcamp,
  requireAdmin,
} from "@/app/actions/bootcamp/auth";
import type {
  AssignmentDetail,
  AssignmentListItem,
  AssignmentProgressEntry,
  BookStudentResult,
  StudentNextSession,
  RoadmapSessionData,
  StudentSessionListItem,
  StudentSessionsPageData,
} from "@/app/actions/bootcamp/types";
import { getLiveSessionMeta } from "@/lib/live-sessions";
import { createAdaptiveAssignmentForStudent } from "@/app/actions/bootcamp/adaptive";

/**
 * Next live session for the student's active enrollment.
 * Uses enrollments (status=active); falls back to students.bootcamp_id.
 * Pure date math from bootcamps.day_of_week / start_time / timezone — no Cal.com.
 */
export async function getStudentNextSession(): Promise<StudentNextSession | null> {
  const { user } = await getAuthedUser();
  if (!user) return null;

  const admin = createAdminClient();
  let bootcampId: number | null = null;

  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .select("bootcamp_id, status")
    .eq("student_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollmentError) {
    console.error("getStudentNextSession enrollment error:", enrollmentError);
  } else if (enrollment?.bootcamp_id != null) {
    bootcampId = Number(enrollment.bootcamp_id);
  }

  if (bootcampId == null || !Number.isFinite(bootcampId)) {
    const { data: student } = await admin
      .from("students")
      .select("bootcamp_id")
      .eq("id", user.id)
      .maybeSingle();
    if (student?.bootcamp_id != null) {
      bootcampId = Number(student.bootcamp_id);
    }
  }

  if (bootcampId == null || !Number.isFinite(bootcampId)) return null;

  const { data: bootcamp, error: bootcampError } = await admin
    .from("bootcamps")
    .select("id, name, day_of_week, start_time, timezone")
    .eq("id", bootcampId)
    .maybeSingle();

  if (bootcampError || !bootcamp) {
    console.error("getStudentNextSession bootcamp error:", bootcampError);
    return null;
  }

  const dayOfWeek = (bootcamp.day_of_week as string | null)?.trim();
  const startTime = (bootcamp.start_time as string | null)?.trim();
  const timezone =
    (bootcamp.timezone as string | null)?.trim() || "America/Chicago";

  if (!dayOfWeek || !startTime) return null;

  const next = computeNextSession({ dayOfWeek, startTime, timezone });
  if (!next) return null;

  return {
    bootcampId: Number(bootcamp.id),
    bootcampName: bootcamp.name as string,
    dateLabel: next.dateLabel,
    timeLabel: next.timeLabel,
    dayOfWeek,
  };
}

function formatSessionDateLabel(
  sessionDate: string,
  timeZone: string,
  timeLabelFallback: string
): { dateLabel: string; timeLabel: string } | null {
  const m = sessionDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const approx = new Date(Date.UTC(year, month - 1, day, 17, 0, 0));

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(approx);

  const monthDayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
  }).format(approx);

  const timeOnly = timeLabelFallback.includes("·")
    ? timeLabelFallback.split("·").slice(1).join("·").trim()
    : timeLabelFallback.trim();

  return {
    dateLabel,
    timeLabel: timeOnly ? `${monthDayLabel} · ${timeOnly}` : monthDayLabel,
  };
}

/**
 * Sessions page payload: join card + upcoming list.
 * Meeting URL only when sessions.cal_event_id resolves to a real https link.
 */
export async function getStudentSessionsPageData(): Promise<StudentSessionsPageData | null> {
  // Standalone classes are the source of truth for the Roadmap. Keep the
  // legacy bootcamp path below as a compatibility fallback for existing rows.
  const standaloneAdmin = createAdminClient();
  const { data: standaloneRows, error: standaloneError } = await standaloneAdmin
    .from("sessions")
    .select("id, title, starts_at, meeting_url, duration_minutes, timezone, status")
    .not("starts_at", "is", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (standaloneError) console.error("getStudentSessionsPageData standalone error:", standaloneError);
  if (standaloneRows?.length) {
    const format = (row: Record<string, unknown>) => {
      const at = new Date(String(row.starts_at));
      const timezone = String(row.timezone || "America/Chicago");
      return {
        id: String(row.id),
        sessionDate: at.toISOString().slice(0, 10),
        dateLabel: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: timezone }).format(at),
        timeLabel: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone, timeZoneName: "short" }).format(at),
        status: (row.status as string | null) ?? null,
        hasMeetingLink: Boolean(row.meeting_url),
      };
    };
    const upcoming = standaloneRows.map((row) => format(row as Record<string, unknown>));
    const first = standaloneRows[0] as Record<string, unknown>;
    return { bootcampId: null, bootcampName: null, next: { sessionId: String(first.id), dateLabel: upcoming[0]!.dateLabel, timeLabel: upcoming[0]!.timeLabel, meetingUrl: typeof first.meeting_url === "string" ? first.meeting_url : null }, upcoming };
  }
  const next = await getStudentNextSession();
  if (!next) return null;

  const admin = createAdminClient();
  const { data: bootcamp } = await admin
    .from("bootcamps")
    .select("id, name, day_of_week, start_time, timezone")
    .eq("id", next.bootcampId)
    .maybeSingle();

  if (!bootcamp) return null;

  const startTime = (bootcamp.start_time as string | null)?.trim() || "16:00:00";
  const timezone =
    (bootcamp.timezone as string | null)?.trim() || "America/Chicago";

  const todayParts = getZonedParts(new Date(), timezone);
  const todayIso = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}-${String(todayParts.day).padStart(2, "0")}`;

  const { data: sessionRows, error: sessionsError } = await admin
    .from("sessions")
    .select("id, session_date, status, cal_event_id, recording_url")
    .eq("bootcamp_id", next.bootcampId)
    .gte("session_date", todayIso)
    .order("session_date", { ascending: true });

  if (sessionsError) {
    console.error("getStudentSessionsPageData sessions error:", sessionsError);
  }

  const rows = sessionRows ?? [];
  const nextDateKey = (() => {
    const full = computeNextSession({
      dayOfWeek: next.dayOfWeek,
      startTime,
      timezone,
    });
    if (!full) return null;
    const parts = getZonedParts(full.sessionAt, timezone);
    return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  })();

  // A session earlier today can still be returned by the date-only query after
  // computeNextSession has already advanced to next week. Keep the roadmap and
  // Live Classes page anchored to the computed next occurrence.
  const effectiveRows = nextDateKey
    ? rows.filter(
        (row) => String(row.session_date).slice(0, 10) >= nextDateKey
      )
    : rows;

  const matched =
    (nextDateKey &&
      effectiveRows.find(
        (row) => String(row.session_date).slice(0, 10) === nextDateKey
      )) ||
    effectiveRows[0] ||
    null;

  let meetingUrl: string | null = null;
  const calEventId =
    typeof matched?.cal_event_id === "string" ? matched.cal_event_id.trim() : "";
  if (calEventId) {
    meetingUrl = await getCalBookingMeetingUrl(calEventId);
  }

  const upcoming: StudentSessionListItem[] = [];
  if (effectiveRows.length) {
    for (const row of effectiveRows) {
      const formatted = formatSessionDateLabel(
        String(row.session_date),
        timezone,
        next.timeLabel
      );
      if (!formatted) continue;

      upcoming.push({
        id: String(row.id),
        sessionDate: String(row.session_date).slice(0, 10),
        dateLabel: formatted.dateLabel,
        timeLabel: formatted.timeLabel || next.timeLabel,
        status: (row.status as string | null) ?? null,
        hasMeetingLink: Boolean(
          typeof row.cal_event_id === "string" && row.cal_event_id.trim()
        ),
      });
    }
  } else {
    upcoming.push({
      id: null,
      sessionDate: null,
      dateLabel: next.dateLabel,
      timeLabel: next.timeLabel,
      status: null,
      hasMeetingLink: Boolean(meetingUrl),
    });
  }

  return {
    bootcampId: next.bootcampId,
    bootcampName: next.bootcampName,
    next: {
      sessionId: matched?.id != null ? String(matched.id) : null,
      dateLabel: next.dateLabel,
      timeLabel: next.timeLabel,
      meetingUrl,
    },
    upcoming,
  };
}

export async function getStudentRoadmapSessions(): Promise<RoadmapSessionData> {
  const { user } = await getAuthedUser();
  if (!user) return { next: null, attended: [] };

  const pageData = await getStudentSessionsPageData();
  const nextIndex = pageData
    ? Math.max(
        0,
        pageData.upcoming.findIndex(
          (session) => session.id === pageData.next.sessionId
        )
      )
    : -1;
  const upcoming = pageData?.upcoming[nextIndex] ?? null;
  const nextSession = upcoming
    ? {
        id: upcoming.id,
        title: getLiveSessionMeta(nextIndex).title,
        sessionDate: upcoming.sessionDate,
        dateLabel: upcoming.dateLabel,
        timeLabel: upcoming.timeLabel,
      }
    : null;

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: attendanceRows, error } = await admin
    .from("live_session_attendance")
    .select("session_id, session_date, session_title, time_label")
    .eq("student_id", user.id)
    .in("status", ["joined", "attended"])
    .lt("session_date", today)
    .order("session_date", { ascending: false })
    .limit(8);

  if (error && error.code !== "42P01") {
    console.error("getStudentRoadmapSessions attendance error:", error);
  }

  return {
    next: nextSession,
    attended: (attendanceRows ?? []).map((row) => {
      const formatted = formatSessionDateLabel(
        String(row.session_date),
        "America/Chicago",
        String(row.time_label ?? "")
      );
      return {
        id: String(row.session_id),
        title: String(row.session_title || "Live class"),
        sessionDate: String(row.session_date).slice(0, 10),
        dateLabel: formatted?.dateLabel ?? "Live class",
        timeLabel: formatted?.timeLabel ?? String(row.session_date),
      };
    }),
  };
}

export async function getBootcampByJoinCode(code: string): Promise<{
  id: number;
  name: string;
  join_code: string;
} | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  // Public invite lookup — use service role so guests can see the bootcamp name.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bootcamps")
    .select("id, name, join_code")
    .ilike("join_code", normalized)
    .maybeSingle();

  if (error) {
    console.error("getBootcampByJoinCode error:", error);
    return null;
  }
  if (!data) return null;

  return {
    id: Number(data.id),
    name: data.name as string,
    join_code: data.join_code as string,
  };
}

/**
 * Create a Cal.com recurring series booking for a student in a bootcamp.
 * Failures are logged and returned — callers must not block enrollment on this.
 */
export async function bookStudentIntoBootcamp(
  studentId: string,
  bootcampId: number
): Promise<BookStudentResult> {
  const admin = createAdminClient();

  const [{ data: bootcamp, error: bootcampError }, { data: profile, error: profileError }] =
    await Promise.all([
      admin
        .from("bootcamps")
        .select("id, name, cal_event_type_id")
        .eq("id", bootcampId)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", studentId)
        .maybeSingle(),
    ]);

  if (bootcampError || !bootcamp) {
    const error = bootcampError?.message || "Bootcamp not found";
    console.error("bookStudentIntoBootcamp bootcamp error:", {
      studentId,
      bootcampId,
      error,
    });
    return { ok: false, error, bookingFailed: true };
  }

  const eventTypeRaw = (bootcamp.cal_event_type_id as string | null)?.trim();
  if (!eventTypeRaw) {
    const error = `Bootcamp ${bootcampId} has no cal_event_type_id — skipping Cal.com booking`;
    console.warn("bookStudentIntoBootcamp:", error);
    return { ok: false, error, bookingFailed: true, skipped: true };
  }

  const eventTypeId = Number(eventTypeRaw);
  if (!Number.isFinite(eventTypeId)) {
    const error = `Invalid cal_event_type_id "${eventTypeRaw}" on bootcamp ${bootcampId}`;
    console.error("bookStudentIntoBootcamp:", error);
    return { ok: false, error, bookingFailed: true };
  }

  if (profileError || !profile?.email) {
    const error =
      profileError?.message ||
      "Student profile email is required for Cal.com booking";
    console.error("bookStudentIntoBootcamp profile error:", {
      studentId,
      bootcampId,
      error,
    });
    return { ok: false, error, bookingFailed: true };
  }

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, cal_booking_id, status")
    .eq("student_id", studentId)
    .eq("bootcamp_id", bootcampId)
    .maybeSingle();

  if (enrollment?.cal_booking_id) {
    return {
      ok: true,
      calBookingId: enrollment.cal_booking_id as string,
      skipped: true,
    };
  }

  const slot = await getNextEventTypeSlotStart(eventTypeId);
  if (!slot.ok) {
    console.error("bookStudentIntoBootcamp slot error:", {
      studentId,
      bootcampId,
      eventTypeId,
      error: slot.error,
    });
    return { ok: false, error: slot.error, bookingFailed: true };
  }

  const attendeeName =
    (typeof profile.full_name === "string" && profile.full_name.trim()) ||
    String(profile.email).split("@")[0] ||
    "Student";

  const booking = await createCalRecurringBooking({
    eventTypeId,
    start: slot.start,
    attendeeName,
    attendeeEmail: String(profile.email),
  });

  if (!booking.ok) {
    console.error("bookStudentIntoBootcamp Cal.com booking failed:", {
      studentId,
      bootcampId,
      eventTypeId,
      start: slot.start,
      error: booking.error,
      booking_failed: true,
    });
    return booking;
  }

  if (enrollment?.id) {
    const { error: updateError } = await admin
      .from("enrollments")
      .update({ cal_booking_id: booking.calBookingId })
      .eq("id", enrollment.id);

    if (updateError) {
      console.error("bookStudentIntoBootcamp enrollment update error:", {
        studentId,
        bootcampId,
        calBookingId: booking.calBookingId,
        error: updateError,
      });
      return {
        ok: true,
        calBookingId: booking.calBookingId,
      };
    }
  }

  console.info("bookStudentIntoBootcamp success:", {
    studentId,
    bootcampId,
    calBookingId: booking.calBookingId,
    occurrenceCount: booking.occurrenceCount,
  });

  return { ok: true, calBookingId: booking.calBookingId };
}

/** Ensure students.bootcamp_id + enrollments(status=active) for a student/bootcamp. */
async function ensureActiveEnrollment(
  studentId: string,
  bootcampId: number
): Promise<
  | { ok: true; enrollmentId: string; created: boolean }
  | { ok: false; error: string }
> {
  const admin = createAdminClient();

  const { data: bootcamp, error: bootcampError } = await admin
    .from("bootcamps")
    .select("id")
    .eq("id", bootcampId)
    .maybeSingle();

  if (bootcampError || !bootcamp) {
    return { ok: false, error: "Invalid or expired invite link." };
  }

  // Keep legacy students.bootcamp_id in sync (sidebar / assignment membership).
  const { data: existingStudent, error: studentLookupError } = await admin
    .from("students")
    .select("id, bootcamp_id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentLookupError) {
    console.error("ensureActiveEnrollment student lookup error:", studentLookupError);
    return { ok: false, error: "Could not join bootcamp. Try again." };
  }

  if (existingStudent) {
    if (Number(existingStudent.bootcamp_id) !== bootcampId) {
      const { error: updateError } = await admin
        .from("students")
        .update({ bootcamp_id: bootcampId })
        .eq("id", studentId);
      if (updateError) {
        console.error("ensureActiveEnrollment student update error:", updateError);
        return { ok: false, error: "Could not join bootcamp. Try again." };
      }
    }
  } else {
    const { error: insertError } = await admin.from("students").insert({
      id: studentId,
      bootcamp_id: bootcampId,
    });
    if (insertError) {
      console.error("ensureActiveEnrollment student insert error:", insertError);
      return { ok: false, error: "Could not join bootcamp. Try again." };
    }
  }

  const { data: existingEnrollment, error: enrollmentLookupError } = await admin
    .from("enrollments")
    .select("id, status, cal_booking_id")
    .eq("student_id", studentId)
    .eq("bootcamp_id", bootcampId)
    .maybeSingle();

  if (enrollmentLookupError) {
    console.error("ensureActiveEnrollment enrollment lookup error:", enrollmentLookupError);
    return { ok: false, error: "Could not join bootcamp. Try again." };
  }

  if (existingEnrollment?.id) {
    if (existingEnrollment.status !== "active") {
      const { error: reactivateError } = await admin
        .from("enrollments")
        .update({ status: "active" })
        .eq("id", existingEnrollment.id);
      if (reactivateError) {
        console.error("ensureActiveEnrollment reactivate error:", reactivateError);
        return { ok: false, error: "Could not join bootcamp. Try again." };
      }
    }
    return {
      ok: true,
      enrollmentId: existingEnrollment.id as string,
      created: false,
    };
  }

  const { data: inserted, error: insertEnrollmentError } = await admin
    .from("enrollments")
    .insert({
      student_id: studentId,
      bootcamp_id: bootcampId,
      status: "active",
    })
    .select("id")
    .single();

  if (insertEnrollmentError || !inserted?.id) {
    console.error("ensureActiveEnrollment enrollment insert error:", insertEnrollmentError);
    return { ok: false, error: "Could not join bootcamp. Try again." };
  }

  return { ok: true, enrollmentId: inserted.id as string, created: true };
}

export async function joinBootcamp(
  bootcampId: number
): Promise<
  | { ok: true; bookingFailed?: boolean; bookingError?: string }
  | { ok: false; error: string }
> {
  const { user } = await getAuthedUser();
  if (!user) return { ok: false, error: "You must sign in first." };

  const enrolled = await ensureActiveEnrollment(user.id, bootcampId);
  if (!enrolled.ok) return { ok: false, error: enrolled.error };

  const booking = await bookStudentIntoBootcamp(user.id, bootcampId);
  if (!booking.ok && !booking.skipped) {
    console.error("joinBootcamp booking_failed (enrollment kept):", {
      studentId: user.id,
      bootcampId,
      enrollmentId: enrolled.enrollmentId,
      error: booking.error,
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/assignments");
  revalidatePath("/admin");

  if (!booking.ok) {
    return {
      ok: true,
      bookingFailed: true,
      bookingError: booking.error,
    };
  }

  return { ok: true };
}

/**
 * Admin/tutor path to enroll a student in a bootcamp (same side effects as join).
 * No separate admin UI currently calls this; exported for roster tools / future use.
 */
export async function enrollStudentIntoBootcamp(params: {
  studentId: string;
  bootcampId: number;
}): Promise<
  | { ok: true; bookingFailed?: boolean; bookingError?: string }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden" };
  }

  const studentId = params.studentId.trim();
  if (!studentId) return { ok: false, error: "Student id is required." };

  const enrolled = await ensureActiveEnrollment(studentId, params.bootcampId);
  if (!enrolled.ok) return { ok: false, error: enrolled.error };

  const booking = await bookStudentIntoBootcamp(studentId, params.bootcampId);
  if (!booking.ok && !booking.skipped) {
    console.error("enrollStudentIntoBootcamp booking_failed (enrollment kept):", {
      studentId,
      bootcampId: params.bootcampId,
      enrollmentId: enrolled.enrollmentId,
      error: booking.error,
    });
  }

  revalidatePath("/", "layout");
  revalidatePath(`/admin/bootcamps/${params.bootcampId}`);
  revalidatePath("/admin");
  revalidatePath("/assignments");

  if (!booking.ok) {
    return {
      ok: true,
      bookingFailed: true,
      bookingError: booking.error,
    };
  }

  return { ok: true };
}

export async function listStudentAssignments(): Promise<AssignmentListItem[]> {
  const { user } = await getAuthedUser();
  if (!user) return [];
  const membership = await getStudentBootcamp();

  const admin = createAdminClient();
  // Prefer start_date when present; fall back without it if the column is missing.
  let rows: {
    id: string;
    title: string;
    due_date: string | null;
    created_at: string | null;
    start_date?: string | null;
  }[] = [];

  const withStart = await admin
    .from("assignments")
    .select("id, title, due_date, created_at, start_date")
    .or(`student_id.eq.${user.id},bootcamp_id.eq.${membership?.bootcampId ?? -1}`)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (withStart.error) {
    const withoutStart = await admin
      .from("assignments")
      .select("id, title, due_date, created_at")
      .or(`student_id.eq.${user.id},bootcamp_id.eq.${membership?.bootcampId ?? -1}`)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (withoutStart.error) {
      console.error("listStudentAssignments error:", withoutStart.error);
      return [];
    }
    rows = (withoutStart.data ?? []) as typeof rows;
  } else {
    rows = (withStart.data ?? []) as typeof rows;
  }

  if (rows.length === 0) return [];

  const ids = rows.map((assignment) => String(assignment.id));

  const { data: aq, error: aqError } = await admin
    .from("problems")
    .select("assignment_id, question_id")
    .in("assignment_id", ids);

  if (aqError) {
    console.error("listStudentAssignments questions error:", aqError);
    throw new Error(
      `Could not load assignment questions: ${aqError.message || "unknown error"}`
    );
  }

  const { data: progress } = await admin
    .from("attempts")
    .select("assignment_id, question_id")
    .eq("user_id", user.id)
    .in("assignment_id", ids);

  const countByAssignment = new Map<string, Set<string>>();
  for (const row of aq ?? []) {
    const aid = String(row.assignment_id);
    if (!countByAssignment.has(aid)) countByAssignment.set(aid, new Set());
    countByAssignment.get(aid)!.add(String(row.question_id));
  }

  const completedByAssignment = new Map<string, Set<string>>();
  for (const row of progress ?? []) {
    const aid = String(row.assignment_id);
    if (!completedByAssignment.has(aid)) {
      completedByAssignment.set(aid, new Set());
    }
    completedByAssignment.get(aid)!.add(String(row.question_id));
  }

  return rows.map((assignment) => {
    const id = String(assignment.id);
    const questionIds = countByAssignment.get(id) ?? new Set();
    const completedIds = completedByAssignment.get(id) ?? new Set();
    let completed = 0;

    for (const qid of completedIds) {
      if (questionIds.has(qid)) completed += 1;
    }

    const startDate =
      (assignment.start_date as string | null | undefined) ??
      (assignment.created_at as string | null) ??
      null;

    return {
      id,
      title: assignment.title as string,
      due_date: (assignment.due_date as string | null) ?? null,
      created_at: (assignment.created_at as string | null) ?? null,
      start_date: startDate,
      question_count: questionIds.size,
      completed_count: completed,
    };
  });
}

export async function getAssignmentForPractice(
  assignmentId: string
): Promise<AssignmentDetail | null> {
  const { user } = await getAuthedUser();
  if (!user) return null;
  const membership = await getStudentBootcamp();

  const admin = createAdminClient();
  const { data: assignment, error } = await admin
    .from("assignments")
    .select("id, title, due_date, bootcamp_id")
    .eq("id", assignmentId)
    .or(`student_id.eq.${user.id},bootcamp_id.eq.${membership?.bootcampId ?? -1}`)
    .maybeSingle();

  if (error || !assignment) {
    console.error("getAssignmentForPractice error:", error);
    return null;
  }

  const { data: links, error: linkError } = await admin
    .from("problems")
    .select("question_id")
    .eq("assignment_id", assignmentId);

  if (linkError) {
    console.error("getAssignmentForPractice links error:", linkError);
    return null;
  }

  const questionIds = (links ?? [])
    .map((row) => row.question_id as string)
    .filter(Boolean);

  if (questionIds.length === 0) {
    return {
      id: String(assignment.id),
      title: assignment.title as string,
      due_date: (assignment.due_date as string | null) ?? null,
      bootcamp_id: assignment.bootcamp_id == null ? null : Number(assignment.bootcamp_id),
      questions: [],
      progress: [],
    };
  }

  const { data: questions, error: qError } = await admin
    .from("questions")
    .select(QUESTION_SELECT)
    .in("question_id", questionIds);

  if (qError) {
    console.error("getAssignmentForPractice questions error:", qError);
    return null;
  }

  const byId = new Map(
    (questions ?? []).map((question) => [
      question.question_id as string,
      normalizeQuestion(question as Record<string, unknown>),
    ])
  );
  const ordered = questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question));

  type ProgressRow = {
    question_id: string;
    is_correct: boolean | null;
    selected_answer?: string | null;
    attempted_at?: string | null;
  };
  const { data: attemptRows, error: progressError } = await admin
    .from("attempts")
    .select("question_id, is_correct, selected_answer, attempted_at")
    .eq("assignment_id", assignmentId)
    .eq("user_id", user.id)
    .order("attempted_at", { ascending: false });

  if (progressError) {
    console.error("getAssignmentForPractice progress error:", progressError);
  }

  const latestByQuestion = new Map<string, ProgressRow>();
  for (const row of (attemptRows ?? []) as ProgressRow[]) {
    const qid = row.question_id;
    if (!qid || latestByQuestion.has(qid)) continue;
    latestByQuestion.set(qid, row);
  }

  const progress: AssignmentProgressEntry[] = [...latestByQuestion.values()]
    .filter((row) => row.is_correct === true || row.is_correct === false)
    .map((row) => ({
      question_id: row.question_id,
      is_correct: Boolean(row.is_correct),
      selected_answer: (row.selected_answer as string | null) ?? null,
    }));

  return {
    id: String(assignment.id),
    title: assignment.title as string,
    due_date: (assignment.due_date as string | null) ?? null,
    bootcamp_id: assignment.bootcamp_id == null ? null : Number(assignment.bootcamp_id),
    questions: ordered,
    progress,
  };
}

export async function submitAssignmentProgress(params: {
  assignmentId: string;
  questionId: string;
  isCorrect: boolean;
  selectedAnswer?: string;
  timeSpentSec?: number;
}): Promise<void> {
  const { user } = await getAuthedUser();
  if (!user) throw new Error("Not signed in");

  const admin = createAdminClient();
  const membership = await getStudentBootcamp();
  const { data: assignment } = await admin
    .from("assignments")
    .select("id")
    .eq("id", params.assignmentId)
    .or(`student_id.eq.${user.id},bootcamp_id.eq.${membership?.bootcampId ?? -1}`)
    .maybeSingle();

  if (!assignment) throw new Error("Assignment not found");

  const payload: Record<string, unknown> = {
    user_id: user.id,
    question_id: params.questionId,
    is_correct: params.isCorrect,
    assignment_id: params.assignmentId,
    selected_answer: params.selectedAnswer ?? null,
    time_spent_sec: params.timeSpentSec ?? null,
    attempted_at: new Date().toISOString(),
  };

  const { error } = await admin.from("attempts").insert(payload);
  if (error) {
    console.error("submitAssignmentProgress insert error:", error);
    throw new Error("Could not save assignment progress");
  }

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${params.assignmentId}`);
}

export async function generateNextRoadmapAssignment(): Promise<{ ok: true; assignmentId: string; created: boolean } | { ok: false; error: string }> {
  try {
    const { user } = await getAuthedUser();
    if (!user) return { ok: false, error: "You must sign in first." };
    const result = await createAdaptiveAssignmentForStudent({ studentId: user.id, createdBy: user.id });
    revalidatePath("/assignments");
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create a Question Set." };
  }
}

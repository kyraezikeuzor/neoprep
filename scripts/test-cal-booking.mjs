/**
 * End-to-end Cal.com auto-booking test (standalone).
 * Usage: node --env-file=.env.local scripts/test-cal-booking.mjs
 * Or:   node scripts/test-cal-booking.mjs  (loads .env.local manually)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "scripts/.cal-test-output");

function loadEnv() {
  const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"([^"]*)"\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
const CAL_API_KEY = env.CAL_API_KEY;
const CAL_API_VERSION = "2024-08-13";
const CAL_BASE = "https://api.cal.com/v2";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
  })
);

const TEST_EMAIL = "test+calbooking@neoprep.com";
const TEST_NAME = "TEST Cal Booking (do not use)";

if (!SUPABASE_URL || !SERVICE_KEY || !CAL_API_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, or CAL_API_KEY");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function calFetch(path, init = {}) {
  const res = await fetch(`${CAL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CAL_API_KEY}`,
      "cal-api-version": CAL_API_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, json, text };
}

function pickCalBookingId(payload) {
  const root = payload?.data ?? payload;
  const bookings = Array.isArray(root) ? root : root && typeof root === "object" ? [root] : [];
  if (!bookings.length) return { calBookingId: null, occurrenceCount: 0, bookings };
  const first = bookings[0];
  const seriesId =
    first.recurringBookingUid ||
    first.recurringEventId ||
    bookings.find((b) => b.recurringBookingUid)?.recurringBookingUid ||
    bookings.find((b) => b.recurringEventId)?.recurringEventId ||
    first.uid ||
    null;
  return { calBookingId: seriesId ? String(seriesId) : null, occurrenceCount: bookings.length, bookings };
}

function chicagoWeekday(isoUtc) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(isoUtc));
}

async function main() {
  const report = { steps: [] };

  // --- 0. Pick bootcamp with cal_event_type_id ---
  // Optional: --bootcampId=2 --eventTypeId=123456 [--writeEventTypeId=1]
  const { data: bootcamps, error: bootcampErr } = await admin
    .from("bootcamps")
    .select("id, name, cal_event_type_id, day_of_week");

  if (bootcampErr) throw bootcampErr;
  console.log("All bootcamps:", JSON.stringify(bootcamps, null, 2));

  let bootcamp = null;
  if (args.bootcampId) {
    bootcamp = (bootcamps || []).find((b) => String(b.id) === String(args.bootcampId));
    if (!bootcamp) {
      console.error("bootcampId not found:", args.bootcampId);
      process.exit(1);
    }
  } else {
    const candidates = (bootcamps || []).filter((b) => String(b.cal_event_type_id || "").trim());
    for (const c of candidates) {
      const { count } = await admin
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("bootcamp_id", c.id)
        .eq("status", "active");
      console.log(`Bootcamp ${c.id} (${c.name}) active enrollments:`, count);
      if ((count ?? 0) === 0) {
        bootcamp = c;
        break;
      }
    }
    if (!bootcamp && candidates.length) {
      bootcamp = candidates[0];
      console.warn(
        "WARNING: All cal-configured bootcamps have active enrollments. Using",
        bootcamp.id,
        "with TEST attendee only."
      );
    }
  }

  if (!bootcamp) {
    bootcamp =
      (bootcamps || []).find((b) => Number(b.id) === 2) ||
      (bootcamps || [])[0] ||
      null;
  }

  if (!bootcamp) {
    console.error("No bootcamp rows found.");
    process.exit(1);
  }

  if (args.eventTypeId) {
    bootcamp = { ...bootcamp, cal_event_type_id: String(args.eventTypeId) };
    if (args.writeEventTypeId) {
      const { error: writeErr } = await admin
        .from("bootcamps")
        .update({ cal_event_type_id: String(args.eventTypeId) })
        .eq("id", bootcamp.id);
      console.log(
        writeErr
          ? `Failed writing cal_event_type_id: ${writeErr.message}`
          : `Wrote cal_event_type_id=${args.eventTypeId} onto bootcamp ${bootcamp.id}`
      );
    }
  }

  if (!String(bootcamp.cal_event_type_id || "").trim()) {
    console.error(
      "\nBLOCKED: bootcamps.cal_event_type_id is still null in Supabase.\n" +
        "Re-run with: node scripts/test-cal-booking.mjs --bootcampId=2 --eventTypeId=YOUR_ID\n" +
        "Add --writeEventTypeId=1 to persist it on the bootcamp row."
    );
    process.exit(1);
  }

  const eventTypeId = Number(String(bootcamp.cal_event_type_id).trim());
  console.log("\n=== BOOTCAMP ===");
  console.log(JSON.stringify(bootcamp, null, 2));
  report.bootcamp = bootcamp;
  report.eventTypeId = eventTypeId;
  console.log(`Using bootcamp id=${bootcamp.id} eventTypeId=${eventTypeId}`);

  // --- 1. GET slots/available ---
  const startTime = new Date().toISOString();
  const endTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const slotsPath =
    `/slots/available?eventTypeId=${encodeURIComponent(String(eventTypeId))}` +
    `&startTime=${encodeURIComponent(startTime)}` +
    `&endTime=${encodeURIComponent(endTime)}`;

  console.log("\n=== 1. GET /v2/slots/available ===");
  console.log("path:", slotsPath);
  const slotsRes = await calFetch(slotsPath);
  writeFileSync(resolve(OUT_DIR, "slots-raw.json"), JSON.stringify(slotsRes.json, null, 2));
  console.log("HTTP", slotsRes.status);
  console.log(JSON.stringify(slotsRes.json, null, 2).slice(0, 8000));
  report.slotsStatus = slotsRes.status;
  report.slotsRaw = slotsRes.json;

  const slotsByDay = slotsRes.json?.data?.slots ?? {};
  const allTimes = [];
  for (const day of Object.keys(slotsByDay).sort()) {
    for (const s of slotsByDay[day] || []) {
      if (s?.time) allTimes.push(s.time);
    }
  }
  allTimes.sort();
  if (!allTimes.length) {
    console.error("No slots returned — aborting before booking.");
    writeFileSync(resolve(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const nextSlot = allTimes[0];
  const startForBooking = nextSlot.replace(/\.\d{3}Z$/, "").replace(/Z$/, "");
  console.log("\nNext slot UTC:", nextSlot);
  console.log("Chicago local:", chicagoWeekday(nextSlot));
  console.log("start for POST /bookings:", startForBooking);
  console.log("Sample of first 8 slots (Chicago):");
  for (const t of allTimes.slice(0, 8)) {
    console.log(" -", t, "=>", chicagoWeekday(t));
  }
  report.nextSlotUtc = nextSlot;
  report.nextSlotChicago = chicagoWeekday(nextSlot);
  report.startForBooking = startForBooking;

  // --- 2. Create / reuse test student ---
  console.log("\n=== 2. Ensure TEST student profile ===");
  let studentId = null;

  const { data: existingProfiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", TEST_EMAIL)
    .limit(5);

  if (existingProfiles?.length) {
    studentId = existingProfiles[0].id;
    console.log("Reusing existing test profile", studentId);
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      email_confirm: true,
      user_metadata: {
        full_name: TEST_NAME,
        name: TEST_NAME,
        test_account: true,
        purpose: "cal_booking_e2e",
      },
    });
    if (createErr || !created?.user?.id) {
      console.error("Failed creating auth user:", createErr);
      process.exit(1);
    }
    studentId = created.user.id;
    console.log("Created auth user", studentId);

    // Ensure profile row (trigger may create it; upsert to be safe)
    const { error: profileErr } = await admin.from("profiles").upsert({
      id: studentId,
      email: TEST_EMAIL,
      full_name: TEST_NAME,
      role: "student",
    });
    if (profileErr) {
      console.error("Profile upsert error:", profileErr);
      // continue — auth user exists; profile may already be there from trigger
    }
  }

  report.studentId = studentId;
  report.testEmail = TEST_EMAIL;

  // Ensure students + enrollment rows (without cal_booking_id)
  await admin.from("students").upsert({ id: studentId, bootcamp_id: bootcamp.id });

  const { data: existingEnroll } = await admin
    .from("enrollments")
    .select("id, cal_booking_id, status")
    .eq("student_id", studentId)
    .eq("bootcamp_id", bootcamp.id)
    .maybeSingle();

  let enrollmentId = existingEnroll?.id ?? null;
  if (enrollmentId && existingEnroll?.cal_booking_id) {
    console.log("Clearing prior cal_booking_id for clean retest:", existingEnroll.cal_booking_id);
    await admin.from("enrollments").update({ cal_booking_id: null }).eq("id", enrollmentId);
  }

  if (!enrollmentId) {
    const { data: inserted, error: enrollErr } = await admin
      .from("enrollments")
      .insert({
        student_id: studentId,
        bootcamp_id: bootcamp.id,
        status: "active",
      })
      .select("id")
      .single();
    if (enrollErr) {
      console.error("Enrollment insert failed:", enrollErr);
      process.exit(1);
    }
    enrollmentId = inserted.id;
  }
  report.enrollmentId = enrollmentId;
  console.log("Enrollment id:", enrollmentId);

  // --- 3. POST /v2/bookings (capture RAW response) ---
  console.log("\n=== 3. POST /v2/bookings (raw) ===");
  const bookingBody = {
    eventTypeId,
    start: startForBooking,
    attendee: {
      name: TEST_NAME,
      email: TEST_EMAIL,
      timeZone: "America/Chicago",
      language: "en",
    },
  };
  console.log("Request body:", JSON.stringify(bookingBody, null, 2));

  const bookingRes = await calFetch("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingBody),
  });
  writeFileSync(resolve(OUT_DIR, "booking-raw.json"), JSON.stringify(bookingRes.json, null, 2));
  console.log("HTTP", bookingRes.status);
  console.log("RAW RESPONSE:");
  console.log(JSON.stringify(bookingRes.json, null, 2));
  report.bookingHttpStatus = bookingRes.status;
  report.bookingRaw = bookingRes.json;

  const picked = pickCalBookingId(bookingRes.json);
  report.pickedCalBookingId = picked.calBookingId;
  report.occurrenceCountFromResponse = picked.occurrenceCount;
  console.log("\nPicked cal_booking_id:", picked.calBookingId);
  console.log("Occurrence count in response:", picked.occurrenceCount);
  console.log("Response shape:", Array.isArray(bookingRes.json?.data) ? "array" : typeof bookingRes.json?.data);

  if (!bookingRes.ok || !picked.calBookingId) {
    console.error("Booking failed — not writing cal_booking_id.");
    report.bookingSucceeded = false;
    writeFileSync(resolve(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const { error: updateErr } = await admin
    .from("enrollments")
    .update({ cal_booking_id: picked.calBookingId })
    .eq("id", enrollmentId);
  if (updateErr) {
    console.error("Failed updating enrollments.cal_booking_id:", updateErr);
    report.enrollmentUpdateError = updateErr;
  } else {
    console.log("Wrote enrollments.cal_booking_id =", picked.calBookingId);
  }
  report.bookingSucceeded = true;

  const { data: enrollAfter } = await admin
    .from("enrollments")
    .select("id, student_id, bootcamp_id, status, cal_booking_id")
    .eq("id", enrollmentId)
    .single();
  report.enrollmentAfter = enrollAfter;
  console.log("Enrollment row after write:", enrollAfter);

  // --- 4. Verify via GET /v2/bookings ---
  console.log("\n=== 4. Verify bookings for attendee ===");
  // Try several list filters Cal may support
  const verifyPaths = [
    `/bookings?attendeeEmail=${encodeURIComponent(TEST_EMAIL)}`,
    `/bookings?status=upcoming`,
  ];
  let verified = [];
  for (const p of verifyPaths) {
    const v = await calFetch(p);
    writeFileSync(
      resolve(OUT_DIR, `bookings-list-${p.replace(/[^a-z0-9]+/gi, "_")}.json`),
      JSON.stringify(v.json, null, 2)
    );
    console.log("GET", p, "HTTP", v.status);
    const data = v.json?.data;
    if (Array.isArray(data)) {
      const mine = data.filter((b) => {
        const emails = (b.attendees || []).map((a) => a.email).filter(Boolean);
        // some payloads omit email on list; match by uid / recurringBookingUid
        return (
          emails.includes(TEST_EMAIL) ||
          b.uid === picked.calBookingId ||
          b.recurringBookingUid === picked.calBookingId ||
          (Array.isArray(picked.bookings) && picked.bookings.some((x) => x.uid === b.uid))
        );
      });
      console.log(" matched rows:", mine.length, "/ total:", data.length);
      if (mine.length) verified = mine;
      if (!mine.length && data.length && p.includes("attendeeEmail")) {
        // dump a sample
        console.log(" sample item keys:", Object.keys(data[0] || {}));
      }
    } else {
      console.log(" body preview:", JSON.stringify(v.json).slice(0, 500));
    }
  }

  // Also fetch by each uid from create response
  const uids = (picked.bookings || []).map((b) => b.uid).filter(Boolean);
  const byUid = [];
  for (const uid of uids.slice(0, 20)) {
    const one = await calFetch(`/bookings/${encodeURIComponent(uid)}`);
    if (one.ok) byUid.push(one.json?.data ?? one.json);
  }
  writeFileSync(resolve(OUT_DIR, "bookings-by-uid.json"), JSON.stringify(byUid, null, 2));
  console.log("Fetched by uid:", byUid.length, "of", uids.length);
  if (byUid.length) {
    console.log(
      "Occurrences starts:",
      byUid.map((b) => `${b.start || b.startTime} (${b.status})`).join("\n  ")
    );
  }
  report.verifiedByUid = byUid.map((b) => ({
    uid: b.uid,
    start: b.start || b.startTime,
    status: b.status,
    recurringBookingUid: b.recurringBookingUid,
  }));
  report.verifiedList = verified;

  // --- 5. Cleanup: cancel bookings ---
  console.log("\n=== 5. Cleanup: cancel Cal bookings ===");
  const cancelResults = [];
  // Prefer canceling the series once via recurringBookingUid if endpoint supports it
  const seriesId = picked.calBookingId;
  for (const uid of uids) {
    // Cal v2 cancel: POST /v2/bookings/{uid}/cancel
    const cancel = await calFetch(`/bookings/${encodeURIComponent(uid)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancellationReason: "E2E test cleanup — test+calbooking@neoprep.com" }),
    });
    cancelResults.push({ uid, status: cancel.status, body: cancel.json });
    console.log("cancel", uid, "HTTP", cancel.status, JSON.stringify(cancel.json).slice(0, 200));
  }
  // If no uids but we have series id, try canceling that
  if (!uids.length && seriesId) {
    const cancel = await calFetch(`/bookings/${encodeURIComponent(seriesId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancellationReason: "E2E test cleanup" }),
    });
    cancelResults.push({ uid: seriesId, status: cancel.status, body: cancel.json });
    console.log("cancel series", seriesId, "HTTP", cancel.status);
  }
  report.cancelResults = cancelResults;
  writeFileSync(resolve(OUT_DIR, "cancel-results.json"), JSON.stringify(cancelResults, null, 2));

  // Flag test profile clearly, remove enrollment, clear student bootcamp link.
  await admin.from("enrollments").delete().eq("id", enrollmentId);
  await admin.from("students").update({ bootcamp_id: null }).eq("id", studentId);
  await admin
    .from("profiles")
    .update({
      full_name: `${TEST_NAME} [CLEANED]`,
      email: TEST_EMAIL,
    })
    .eq("id", studentId);

  // Soft-delete auth user so it can't be used as a real login path
  const { error: delUserErr } = await admin.auth.admin.deleteUser(studentId);
  console.log("Deleted auth test user:", delUserErr ? delUserErr.message : "ok");
  report.cleanup = {
    canceledBookings: cancelResults.length,
    deletedAuthUser: !delUserErr,
    enrollmentDeleted: true,
  };

  writeFileSync(resolve(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  console.log("\n=== DONE — artifacts in scripts/.cal-test-output/ ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

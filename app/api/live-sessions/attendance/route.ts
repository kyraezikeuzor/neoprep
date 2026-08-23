import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAuthedUser } from "@/app/actions/bootcamp/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim().slice(0, 160);
}

export async function POST(request: Request) {
  try {
  const { user } = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      sessionId?: unknown;
      sessionTitle?: unknown;
      timeLabel?: unknown;
    };
    const sessionId = cleanText(body.sessionId, "");
    if (!sessionId) {
      return NextResponse.json({ error: "A session ID is required." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from("sessions")
      .select("id, bootcamp_id, session_date, starts_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Live session not found." }, { status: 404 });
    }

    const { data: enrollment, error: enrollmentError } = session.bootcamp_id == null
      ? { data: { id: "standalone" }, error: null }
      : await admin.from("enrollments").select("id").eq("student_id", user.id).eq("bootcamp_id", session.bootcamp_id).eq("status", "active").maybeSingle();
    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this live session." },
        { status: 403 },
      );
    }

    const { error: attendanceError } = await admin
      .from("live_session_attendance")
      .upsert(
        {
          student_id: user.id,
          session_id: String(session.id),
          bootcamp_id: session.bootcamp_id == null ? null : Number(session.bootcamp_id),
          session_date: String(session.session_date ?? session.starts_at).slice(0, 10),
          session_title: cleanText(body.sessionTitle, "Live class"),
          time_label: cleanText(body.timeLabel, ""),
          status: "joined",
          joined_at: new Date().toISOString(),
        },
        { onConflict: "student_id,session_id" },
      );

    if (attendanceError) {
      console.error("live session attendance upsert error:", attendanceError);
      return NextResponse.json(
        { error: "Attendance could not be recorded." },
        { status: 500 },
      );
    }

    revalidatePath("/assignments");
    revalidatePath("/sessions");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("live session attendance route error:", error);
    return NextResponse.json(
      { error: "Attendance could not be recorded." },
      { status: 500 },
    );
  }
}

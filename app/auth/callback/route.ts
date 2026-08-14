import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function ensureProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("ensureProfile lookup error:", lookupError);
    return;
  }
  if (existing) return;

  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Student";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;

  const { error: insertError } = await admin.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    full_name: fullName,
    role: "student",
    avatar_url: avatarUrl,
  });

  if (insertError) {
    console.error("ensureProfile insert error:", insertError);
  }
}

function safeNextPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // keep raw
  }
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextFromQuery = searchParams.get("next");
  const nextFromCookie = request.cookies.get("auth_next")?.value ?? null;
  const next = safeNextPath(nextFromQuery ?? nextFromCookie);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Build the redirect response first so cookie writes from exchangeCodeForSession
  // attach to the response the browser actually receives.
  const redirectResponse = NextResponse.redirect(`${origin}${next}`);
  redirectResponse.cookies.set("auth_next", "", { path: "/", maxAge: 0 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Session exchange must succeed before any profile work.
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("exchangeCodeForSession error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Profile creation is best-effort and must never break auth.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await ensureProfile(user);
    }
  } catch (profileError) {
    console.error("ensureProfile failed after auth (non-fatal):", profileError);
  }

  return redirectResponse;
}

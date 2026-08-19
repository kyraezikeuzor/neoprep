import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookmarkedQuestion = {
  bookmark_id: string;
  question_id: string;
  created_at: string;
  stem: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
};

/** All question IDs the signed-in student has bookmarked. */
export async function getBookmarkedQuestionIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("bookmarks")
    .select("question_id")
    .eq("student_id", user.id);

  if (error) {
    console.error("getBookmarkedQuestionIds error:", error);
    return [];
  }

  return (data ?? [])
    .map((row) => row.question_id as string)
    .filter(Boolean);
}

/** Toggle bookmark for the current student. Returns the new bookmarked state. */
export async function toggleBookmark(
  questionId: string
): Promise<{ ok: true; bookmarked: boolean } | { ok: false; error: string }> {
  const id = questionId?.trim();
  if (!id) return { ok: false, error: "Missing question id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: existing, error: lookupError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("student_id", user.id)
    .eq("question_id", id)
    .maybeSingle();

  if (lookupError) {
    console.error("toggleBookmark lookup error:", lookupError);
    return {
      ok: false,
      error: lookupError.message || "Could not update bookmark",
    };
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", existing.id)
      .eq("student_id", user.id);

    if (error) {
      console.error("toggleBookmark delete error:", error);
      return {
        ok: false,
        error: error.message || "Could not remove bookmark",
      };
    }

    revalidatePath("/saved");
    return { ok: true, bookmarked: false };
  }

  const { error } = await supabase.from("bookmarks").insert({
    student_id: user.id,
    question_id: id,
  });
  if (error) {
    console.error("toggleBookmark insert error:", error);
    return { ok: false, error: error.message || "Could not save bookmark" };
  }

  revalidatePath("/saved");
  return { ok: true, bookmarked: true };
}

/** Bookmarked questions for the Saved page (newest first). */
export async function listBookmarks(): Promise<BookmarkedQuestion[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("bookmarks")
    .select("id, question_id, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listBookmarks error:", error);
    return [];
  }

  const bookmarks = rows ?? [];
  if (bookmarks.length === 0) return [];

  const questionIds = bookmarks.map((bookmark) => bookmark.question_id as string);
  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("question_id, domain, skill, tier, stem")
    .in("question_id", questionIds);

  if (qError) {
    console.error("listBookmarks questions error:", qError);
    return [];
  }

  const byId = new Map(
    (questions ?? []).map((question) => [question.question_id as string, question])
  );

  return bookmarks
    .map((bookmark) => {
      const question = byId.get(bookmark.question_id as string);
      if (!question) return null;

      return {
        bookmark_id: bookmark.id as string,
        question_id: bookmark.question_id as string,
        created_at: bookmark.created_at as string,
        stem: (question.stem as string) ?? "",
        domain: (question.domain as string | null) ?? null,
        skill: (question.skill as string | null) ?? null,
        tier: question.tier == null ? null : Number(question.tier),
      };
    })
    .filter((row): row is BookmarkedQuestion => row != null);
}

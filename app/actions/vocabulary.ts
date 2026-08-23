import { createAdminClient } from "@/lib/supabase/admin";
import {
  VOCABULARY_SELECT,
  type VocabularyEntry,
  type VocabularyTier,
  type VocabularyType,
} from "@/lib/vocabulary";

export type { VocabularyEntry };

export type VocabularyOverview = {
  completed: number;
  total: number;
  accuracy: number;
};

export type VocabularyListOptions = {
  type?: VocabularyType | "all";
  tier?: VocabularyTier | "all";
  query?: string;
  limit?: number;
};

function normalizeEntry(row: Record<string, unknown>): VocabularyEntry {
  const type = String(row.type ?? "n") as VocabularyType;
  const partOfSpeech = String(row.part_of_speech ?? "noun") as VocabularyEntry["part_of_speech"];
  return {
    id: String(row.id ?? ""),
    word: String(row.word ?? ""),
    type,
    part_of_speech: partOfSpeech,
    definition: String(row.definition ?? ""),
    example_sentence: (row.example_sentence as string | null) ?? null,
    synonyms: Array.isArray(row.synonyms) ? (row.synonyms as string[]) : [],
    antonyms: Array.isArray(row.antonyms) ? (row.antonyms as string[]) : [],
    word_family: Array.isArray(row.word_family) ? (row.word_family as string[]) : [],
    tier: row.tier == null ? null : (Number(row.tier) as VocabularyTier),
    frequency_rank: row.frequency_rank == null ? null : Number(row.frequency_rank),
    source: (row.source as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    verified: row.verified === true,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getVocabularyOverview(): Promise<VocabularyOverview> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("getVocabularyOverview error:", error);
  }

  return {
    completed: 0,
    total: count ?? 0,
    accuracy: 0,
  };
}

export async function listVocabulary(
  options: VocabularyListOptions = {}
): Promise<VocabularyEntry[]> {
  const supabase = createAdminClient();
  const type = options.type ?? "all";
  const tier = options.tier ?? "all";
  const query = options.query?.trim() ?? "";
  const limit = Math.min(Math.max(options.limit ?? 400, 1), 500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let request: any = supabase
    .from("vocabulary")
    .select(VOCABULARY_SELECT)
    .order("word", { ascending: true })
    .limit(limit);

  if (type !== "all") request = request.eq("type", type);
  if (tier !== "all") request = request.eq("tier", tier);
  if (query.length >= 1) {
    request = request.ilike("word", `%${query.replace(/[%_,]/g, "")}%`);
  }

  const { data, error } = await request;
  if (error) {
    console.error("listVocabulary error:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => normalizeEntry(row));
}

export async function getVocabularyPracticeSet(
  options: VocabularyListOptions & { count?: number } = {}
): Promise<VocabularyEntry[]> {
  const count = options.count === 20 || options.count === 30 ? options.count : 10;
  const pool = await listVocabulary({
    type: options.type,
    tier: options.tier,
    limit: 400,
  });
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

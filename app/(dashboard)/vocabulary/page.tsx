import type { Metadata } from "next";
import {
  getDashboardShellStats,
  getVocabularyOverview,
  getVocabularyPracticeSet,
  listVocabulary,
} from "@/app/actions";
import VocabPractice from "@/components/VocabPractice";
import VocabularyHub from "@/components/VocabularyHub";
import type { VocabularyTier, VocabularyType } from "@/lib/vocabulary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vocabulary · Tutormigo" };

function parseType(value: string | undefined): VocabularyType | "all" {
  if (value === "n" || value === "v" || value === "adj" || value === "adv") return value;
  return "all";
}

function parseTier(value: string | undefined): VocabularyTier | "all" {
  if (value === "1" || value === "2" || value === "3") return Number(value) as VocabularyTier;
  return "all";
}

function parseCount(value: string | undefined): number {
  const n = Number(value);
  if (n === 10 || n === 20 || n === 30) return n;
  return 10;
}

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams?: {
    tab?: string;
    practice?: string;
    type?: string;
    tier?: string;
    count?: string;
    ids?: string;
  };
}) {
  const inPractice = searchParams?.practice === "1";

  if (inPractice) {
    const type = parseType(searchParams?.type);
    const tier = parseTier(searchParams?.tier);
    const count = parseCount(searchParams?.count);
    const requestedIds = (searchParams?.ids ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const [pool, set] = await Promise.all([
      listVocabulary({ limit: 400 }),
      getVocabularyPracticeSet({ type, tier, count }),
    ]);

    const byId = new Map(pool.map((entry) => [entry.id, entry]));
    const queued =
      requestedIds.length > 0
        ? requestedIds.map((id) => byId.get(id)).filter(Boolean)
        : set;

    return (
      <VocabPractice
        words={queued as typeof set}
        pool={pool}
      />
    );
  }

  const [words, overview, stats] = await Promise.all([
    listVocabulary({ limit: 400 }),
    getVocabularyOverview(),
    getDashboardShellStats(),
  ]);

  return (
    <VocabularyHub
      words={words}
      overview={overview}
      streak={stats.streak}
      initialTab={searchParams?.tab === "library" ? "library" : "explore"}
    />
  );
}

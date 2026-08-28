export const VOCABULARY_TYPES = ["n", "v", "adj", "adv"] as const;

export type VocabularyType = (typeof VOCABULARY_TYPES)[number];

export const VOCABULARY_TYPE_LABELS: Record<VocabularyType, string> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
};

export const VOCABULARY_PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
] as const;

export type VocabularyPartOfSpeech =
  (typeof VOCABULARY_PARTS_OF_SPEECH)[number];

/** 1 Easy / 2 Medium / 3 Hard — same scale as questions.tier */
export type VocabularyTier = 1 | 2 | 3;

export type VocabularyEntry = {
  id: string;
  word: string;
  type: VocabularyType;
  part_of_speech: VocabularyPartOfSpeech;
  definition: string;
  example_sentence: string | null;
  synonyms: string[];
  antonyms: string[];
  word_family: string[];
  tier: VocabularyTier | null;
  frequency_rank: number | null;
  source: string | null;
  notes: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

export const VOCABULARY_SELECT =
  "id, word, type, part_of_speech, definition, example_sentence, synonyms, antonyms, word_family, tier, frequency_rank, source, notes, verified, created_at, updated_at";

const TYPE_PREFIX = /^(n|v|adj|adv)\.\s*/i;

export function parseVocabularyDefinition(raw: string): {
  type: VocabularyType;
  definition: string;
} | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(n|v|adj|adv)\.\s*(.+)$/i);
  if (!match) return null;
  return {
    type: match[1]!.toLowerCase() as VocabularyType,
    definition: match[2]!.trim(),
  };
}

export function stripVocabularyTypePrefix(raw: string) {
  return raw.replace(TYPE_PREFIX, "").trim();
}

/** Split SAT rationales so each new sentence starts on its own line. */
export function splitRationaleByChoices(text: string): string[] {
  let cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  cleaned = cleaned.replace(/([.!?])([A-Z])/g, "$1 $2");
  const parts = cleaned
    .split(
      /(?<=(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|approx))[.!?])(?=\s+[A-Z])/
    )
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts;

  const byChoice = cleaned
    .split(/(?=\bChoice\s+[A-D]\b)/i)
    .map((part) => part.trim())
    .filter(Boolean);
  return byChoice.length > 1 ? byChoice : [cleaned];
}

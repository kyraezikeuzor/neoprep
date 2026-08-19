/** XP for a single attempt: 1 base + tier bonus when correct. */
export function computeAttemptXp(
  isCorrect: boolean | null | undefined,
  tier: number | null | undefined
): number {
  let xp = 1;
  if (isCorrect) {
    if (tier === 1) xp += 5;
    else if (tier === 2) xp += 10;
    else if (tier === 3) xp += 15;
  }
  return xp;
}

export function formatLeaderboardName(
  fullName: string | null | undefined,
  email: string | null | undefined
): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]!;
    if (parts.length === 1) return first;
    const lastInitial = parts[parts.length - 1]![0]?.toUpperCase() ?? "";
    return lastInitial ? `${first} ${lastInitial}.` : first;
  }
  if (email?.includes("@")) return email.split("@")[0]!;
  return "Student";
}

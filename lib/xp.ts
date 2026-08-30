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

/** The total XP required to enter each of the app's 20 levels. */
export const LEVEL_START_XP = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850,
  4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
] as const;

export type XpLevelProgress = {
  level: number;
  currentLevelStartXp: number;
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpForLevel: number | null;
  xpToNextLevel: number | null;
  progressPercent: number;
};

/** Resolve a student's XP into a level and progress toward the next level. */
export function getXpLevelProgress(xp: number): XpLevelProgress {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  let levelIndex = 0;

  for (let index = LEVEL_START_XP.length - 1; index >= 0; index -= 1) {
    if (safeXp >= LEVEL_START_XP[index]!) {
      levelIndex = index;
      break;
    }
  }

  const currentLevelStartXp = LEVEL_START_XP[levelIndex]!;
  const nextLevelXp = LEVEL_START_XP[levelIndex + 1] ?? null;
  const xpIntoLevel = safeXp - currentLevelStartXp;
  const xpForLevel = nextLevelXp == null ? null : nextLevelXp - currentLevelStartXp;
  const xpToNextLevel = nextLevelXp == null ? null : Math.max(0, nextLevelXp - safeXp);
  const progressPercent =
    xpForLevel == null
      ? 100
      : Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100));

  return {
    level: levelIndex + 1,
    currentLevelStartXp,
    nextLevelXp,
    xpIntoLevel,
    xpForLevel,
    xpToNextLevel,
    progressPercent,
  };
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

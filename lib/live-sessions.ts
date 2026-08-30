const SESSION_TITLES = [
  "SAT Math Masterclass",
  "Weekly Office Hours",
  "SAT Reading & Writing Masterclass",
  "Weekly Office Hours",
] as const;

export function getLiveSessionMeta(index: number) {
  const title = SESSION_TITLES[index % SESSION_TITLES.length]!;
  return {
    title,
    duration: title.includes("Office Hours") ? "45 min" : "60 min",
  };
}

export const MATH_DOMAINS = [
  "Algebra",
  "Advanced Math",
  "Problem-Solving and Data Analysis",
  "Geometry and Trigonometry",
] as const;

export const READING_DOMAINS = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
] as const;

export type TierFilter = "all" | 1 | 2 | 3;
export type SubjectFilter = "all" | "math" | "reading_writing";

import type { Question } from "@/lib/questions";

export type ProfileRole = "student" | "parent" | "admin";

export type StudentBootcampMembership = {
  bootcampId: number;
  name: string;
};

export type BootcampSummary = {
  id: number;
  name: string;
  join_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
};

export type AssignmentListItem = {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string | null;
  start_date: string | null;
  question_count: number;
  completed_count: number;
};

export type AssignmentDetail = {
  id: string;
  title: string;
  due_date: string | null;
  bootcamp_id: number | null;
  questions: Question[];
  /** Existing progress for the current student (empty if none). */
  progress: AssignmentProgressEntry[];
};

export type AssignmentProgressEntry = {
  question_id: string;
  is_correct: boolean;
  selected_answer: string | null;
};

export type StudentNextSession = {
  bootcampId: number | null;
  bootcampName: string | null;
  dateLabel: string;
  timeLabel: string;
  dayOfWeek: string;
};

export type StudentSessionListItem = {
  id: string | null;
  sessionDate: string | null;
  dateLabel: string;
  timeLabel: string;
  status: string | null;
  hasMeetingLink: boolean;
};

export type StudentSessionsPageData = {
  bootcampId: number | null;
  bootcampName: string | null;
  next: {
    sessionId: string | null;
    dateLabel: string;
    timeLabel: string;
    meetingUrl: string | null;
  };
  upcoming: StudentSessionListItem[];
};

export type RoadmapLiveSession = {
  id: string | null;
  title: string;
  sessionDate: string | null;
  dateLabel: string;
  timeLabel: string;
};

export type RoadmapSessionData = {
  next: RoadmapLiveSession | null;
  attended: RoadmapLiveSession[];
};

export type BookStudentResult =
  | { ok: true; calBookingId: string; skipped?: boolean }
  | { ok: false; error: string; bookingFailed: true; skipped?: boolean };

export type AdminRosterRow = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  progress: {
    assignment_id: string;
    title: string;
    completed: number;
    total: number;
  }[];
};

export type AdminStudentIncorrectQuestion = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  stem: string;
  choices: Record<string, string> | null;
  correct_answer: string;
  selected_answer: string | null;
};

export type AdminStudentAssignmentDetail = {
  assignment_id: string;
  title: string;
  due_date: string | null;
  total: number;
  completed: number;
  correct: number;
  attempted: number;
  /** correct / attempted; null when nothing attempted */
  accuracy: number | null;
  incorrect: AdminStudentIncorrectQuestion[];
};

export type AdminStudentBootcampDetail = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  bootcamp_id: number;
  bootcamp_name: string;
  assignments: AdminStudentAssignmentDetail[];
};

export type AdminPracticeTestRunSummary = {
  run_id: string;
  test_id: string;
  title: string;
  status: "in_progress" | "completed";
  started_at: string;
  completed_at: string | null;
  answered: number;
  total: number;
  reported_questions: number;
};

export type AdminPracticeTestQuestion = {
  question_id: string;
  module: string;
  position: number;
  section: "reading_writing" | "math";
  domain: string | null;
  skill: string | null;
  stem: string;
  choices: Record<string, string> | null;
  correct_answer: string;
  selected_answer: string | null;
  answered_correctly: boolean;
  credited_for_report: boolean;
  reports: { issue_type: string; notes: string | null; created_at: string | null }[];
};

export type AdminPracticeTestRunDetail = {
  run: AdminPracticeTestRunSummary;
  raw: { reading_writing: number; math: number; total: number; total_lower: number; total_upper: number };
  adjusted: { reading_writing: number; math: number; total: number; total_lower: number; total_upper: number };
  questions: AdminPracticeTestQuestion[];
};

export type BankQuestionOption = {
  question_id: string;
  domain: string | null;
  skill: string | null;
  tier: number | null;
  stem: string;
};

export type AdminActiveSubscription = {
  id: string;
  student_name: string | null;
  student_email: string | null;
  plan: string;
  monthly_price: number;
  started_at: string | null;
};

export type AdminBusinessMetrics = {
  activeSubscribers: number;
  mrr: number;
  newThisMonth: number;
  canceledThisMonth: number;
  activeSubscriptions: AdminActiveSubscription[];
};

export type AdminEngagementMetrics = {
  questionsAnsweredThisWeek: number;
  accuracyThisWeekPercent: number | null;
  activeStudentsThisWeek: number;
  assignmentCompletionRatePercent: number | null;
};

export type AdminMetrics = {
  business: AdminBusinessMetrics;
  engagement: AdminEngagementMetrics;
};

"use server";

import * as bookmarks from "@/app/actions/bookmarks";
import * as progress from "@/app/actions/progress";
import * as questionBank from "@/app/actions/question-bank";
import * as stats from "@/app/actions/stats";
import * as submissions from "@/app/actions/submissions";
import * as vocabulary from "@/app/actions/vocabulary";
import * as tests from "@/app/actions/tests";

export type {
  BookmarkedQuestion,
} from "@/app/actions/bookmarks";
export type {
  BankOverview,
  SkillProgress,
  TopicProgress,
} from "@/app/actions/progress";
export type { MasteryOverview } from "@/lib/mastery";
export type {
  GetRandomQuestionOptions,
  Question,
  QuestionSearchHit,
} from "@/app/actions/question-bank";
export type {
  DashboardStats,
  DashboardShellStats,
  LeaderboardEntry,
  RecentError,
  WeeklyAttemptStats,
} from "@/app/actions/stats";
export type {
  QuestionReportIssueType,
} from "@/app/actions/submissions";
export type {
  VocabularyEntry,
  VocabularyOverview,
} from "@/app/actions/vocabulary";
export type { PracticeTest, PracticeTestPlayer } from "@/app/actions/tests";

export async function getRandomQuestion(
  ...args: Parameters<typeof questionBank.getRandomQuestion>
) {
  return questionBank.getRandomQuestion(...args);
}

export async function getQuestionById(
  ...args: Parameters<typeof questionBank.getQuestionById>
) {
  return questionBank.getQuestionById(...args);
}

export async function searchQuestions(
  ...args: Parameters<typeof questionBank.searchQuestions>
) {
  return questionBank.searchQuestions(...args);
}

export async function getWeeklyAttemptStats(
  ...args: Parameters<typeof stats.getWeeklyAttemptStats>
) {
  return stats.getWeeklyAttemptStats(...args);
}

export async function getRecentErrors(
  ...args: Parameters<typeof stats.getRecentErrors>
) {
  return stats.getRecentErrors(...args);
}

export async function getMistakeCount(
  ...args: Parameters<typeof stats.getMistakeCount>
) {
  return stats.getMistakeCount(...args);
}

export async function getAttemptCount(
  ...args: Parameters<typeof stats.getAttemptCount>
) {
  return stats.getAttemptCount(...args);
}

export async function getStudentXp(
  ...args: Parameters<typeof stats.getStudentXp>
) {
  return stats.getStudentXp(...args);
}

export async function getXpLeaderboard(
  ...args: Parameters<typeof stats.getXpLeaderboard>
) {
  return stats.getXpLeaderboard(...args);
}

export async function getDashboardStats(
  ...args: Parameters<typeof stats.getDashboardStats>
) {
  return stats.getDashboardStats(...args);
}

export async function getDashboardShellStats(
  ...args: Parameters<typeof stats.getDashboardShellStats>
) {
  return stats.getDashboardShellStats(...args);
}

export async function getGoalScore(
  ...args: Parameters<typeof stats.getGoalScore>
) {
  return stats.getGoalScore(...args);
}

export async function updateGoalScore(
  ...args: Parameters<typeof stats.updateGoalScore>
) {
  return stats.updateGoalScore(...args);
}

export async function getBankOverview(
  ...args: Parameters<typeof progress.getBankOverview>
) {
  return progress.getBankOverview(...args);
}

export async function getMasteryOverview(
  ...args: Parameters<typeof progress.getMasteryOverview>
) {
  return progress.getMasteryOverview(...args);
}

export async function getSkillProgress(
  ...args: Parameters<typeof progress.getSkillProgress>
) {
  return progress.getSkillProgress(...args);
}

export async function getTopicProgress(
  ...args: Parameters<typeof progress.getTopicProgress>
) {
  return progress.getTopicProgress(...args);
}

export async function submitAttempt(
  ...args: Parameters<typeof submissions.submitAttempt>
) {
  return submissions.submitAttempt(...args);
}

export async function submitQuestionReport(
  ...args: Parameters<typeof submissions.submitQuestionReport>
) {
  return submissions.submitQuestionReport(...args);
}

export async function getBookmarkedQuestionIds(
  ...args: Parameters<typeof bookmarks.getBookmarkedQuestionIds>
) {
  return bookmarks.getBookmarkedQuestionIds(...args);
}

export async function toggleBookmark(
  ...args: Parameters<typeof bookmarks.toggleBookmark>
) {
  return bookmarks.toggleBookmark(...args);
}

export async function listBookmarks(
  ...args: Parameters<typeof bookmarks.listBookmarks>
) {
  return bookmarks.listBookmarks(...args);
}

export async function getVocabularyOverview(
  ...args: Parameters<typeof vocabulary.getVocabularyOverview>
) {
  return vocabulary.getVocabularyOverview(...args);
}

export async function listVocabulary(
  ...args: Parameters<typeof vocabulary.listVocabulary>
) {
  return vocabulary.listVocabulary(...args);
}

export async function getVocabularyPracticeSet(
  ...args: Parameters<typeof vocabulary.getVocabularyPracticeSet>
) {
  return vocabulary.getVocabularyPracticeSet(...args);
}

export async function listPracticeTests(...args: Parameters<typeof tests.listPracticeTests>) { return tests.listPracticeTests(...args); }
export async function getPracticeTest(...args: Parameters<typeof tests.getPracticeTest>) { return tests.getPracticeTest(...args); }
export async function savePracticeTestAnswer(...args: Parameters<typeof tests.savePracticeTestAnswer>) { return tests.savePracticeTestAnswer(...args); }
export async function completePracticeTestRun(...args: Parameters<typeof tests.completePracticeTestRun>) { return tests.completePracticeTestRun(...args); }

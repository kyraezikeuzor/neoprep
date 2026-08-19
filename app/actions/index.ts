"use server";

import * as bookmarks from "@/app/actions/bookmarks";
import * as progress from "@/app/actions/progress";
import * as questionBank from "@/app/actions/question-bank";
import * as stats from "@/app/actions/stats";
import * as submissions from "@/app/actions/submissions";

export type {
  BookmarkedQuestion,
} from "@/app/actions/bookmarks";
export type {
  BankOverview,
  SkillProgress,
  TopicProgress,
} from "@/app/actions/progress";
export type {
  GetRandomQuestionOptions,
  Question,
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

"use server";

import * as admin from "@/app/actions/bootcamp/admin";
import * as auth from "@/app/actions/bootcamp/auth";
import * as student from "@/app/actions/bootcamp/student";
import * as adaptive from "@/app/actions/bootcamp/adaptive";

export type {
  AdminActiveSubscription,
  AdminBusinessMetrics,
  AdminEngagementMetrics,
  AdminMetrics,
  AdminRosterRow,
  AdminStudentAssignmentDetail,
  AdminStudentBootcampDetail,
  AdminStudentIncorrectQuestion,
  AdminPracticeTestRunDetail,
  AdminPracticeTestRunSummary,
  AssignmentDetail,
  AssignmentListItem,
  AssignmentProgressEntry,
  BankQuestionOption,
  BookStudentResult,
  BootcampSummary,
  ProfileRole,
  StudentNextSession,
  RoadmapLiveSession,
  RoadmapSessionData,
  StudentSessionListItem,
  StudentSessionsPageData,
} from "@/app/actions/bootcamp/types";

export async function getProfileRole(
  ...args: Parameters<typeof auth.getProfileRole>
) {
  return auth.getProfileRole(...args);
}

export async function requireAdmin(
  ...args: Parameters<typeof auth.requireAdmin>
) {
  return auth.requireAdmin(...args);
}

export async function getStudentBootcamp(
  ...args: Parameters<typeof auth.getStudentBootcamp>
) {
  return auth.getStudentBootcamp(...args);
}

export async function getStudentNextSession(
  ...args: Parameters<typeof student.getStudentNextSession>
) {
  return student.getStudentNextSession(...args);
}

export async function getStudentSessionsPageData(
  ...args: Parameters<typeof student.getStudentSessionsPageData>
) {
  return student.getStudentSessionsPageData(...args);
}

export async function getStudentRoadmapSessions(
  ...args: Parameters<typeof student.getStudentRoadmapSessions>
) {
  return student.getStudentRoadmapSessions(...args);
}

export async function getBootcampByJoinCode(
  ...args: Parameters<typeof student.getBootcampByJoinCode>
) {
  return student.getBootcampByJoinCode(...args);
}

export async function bookStudentIntoBootcamp(
  ...args: Parameters<typeof student.bookStudentIntoBootcamp>
) {
  return student.bookStudentIntoBootcamp(...args);
}

export async function joinBootcamp(
  ...args: Parameters<typeof student.joinBootcamp>
) {
  return student.joinBootcamp(...args);
}

export async function enrollStudentIntoBootcamp(
  ...args: Parameters<typeof student.enrollStudentIntoBootcamp>
) {
  return student.enrollStudentIntoBootcamp(...args);
}

export async function listStudentAssignments(
  ...args: Parameters<typeof student.listStudentAssignments>
) {
  return student.listStudentAssignments(...args);
}

export async function generateNextRoadmapAssignment(...args: Parameters<typeof student.generateNextRoadmapAssignment>) { return student.generateNextRoadmapAssignment(...args); }
export async function createAdaptiveAssignmentForStudent(...args: Parameters<typeof adaptive.createAdaptiveAssignmentForStudent>) { return adaptive.createAdaptiveAssignmentForStudent(...args); }

export async function getAssignmentForPractice(
  ...args: Parameters<typeof student.getAssignmentForPractice>
) {
  return student.getAssignmentForPractice(...args);
}

export async function submitAssignmentProgress(
  ...args: Parameters<typeof student.submitAssignmentProgress>
) {
  return student.submitAssignmentProgress(...args);
}

export async function listAdminBootcamps(
  ...args: Parameters<typeof admin.listAdminBootcamps>
) {
  return admin.listAdminBootcamps(...args);
}

export async function createBootcamp(
  ...args: Parameters<typeof admin.createBootcamp>
) {
  return admin.createBootcamp(...args);
}

export async function getAdminBootcamp(
  ...args: Parameters<typeof admin.getAdminBootcamp>
) {
  return admin.getAdminBootcamp(...args);
}

export async function listAdminAssignments(
  ...args: Parameters<typeof admin.listAdminAssignments>
) {
  return admin.listAdminAssignments(...args);
}

export async function createAssignment(
  ...args: Parameters<typeof admin.createAssignment>
) {
  return admin.createAssignment(...args);
}

export async function listQuestionsForPicker(
  ...args: Parameters<typeof admin.listQuestionsForPicker>
) {
  return admin.listQuestionsForPicker(...args);
}

export async function getBootcampRoster(
  ...args: Parameters<typeof admin.getBootcampRoster>
) {
  return admin.getBootcampRoster(...args);
}

export async function getAdminStudentBootcampDetail(
  ...args: Parameters<typeof admin.getAdminStudentBootcampDetail>
) {
  return admin.getAdminStudentBootcampDetail(...args);
}

export async function getAdminStudentDetail(
  ...args: Parameters<typeof admin.getAdminStudentDetail>
) {
  return admin.getAdminStudentDetail(...args);
}

export async function getAdminStudentPracticeTests(
  ...args: Parameters<typeof admin.getAdminStudentPracticeTests>
) {
  return admin.getAdminStudentPracticeTests(...args);
}

export async function getAdminPracticeTestRunDetail(
  ...args: Parameters<typeof admin.getAdminPracticeTestRunDetail>
) {
  return admin.getAdminPracticeTestRunDetail(...args);
}

export async function getAdminMetrics(
  ...args: Parameters<typeof admin.getAdminMetrics>
) {
  return admin.getAdminMetrics(...args);
}

export async function listAdminRoadmapStudents(...args: Parameters<typeof admin.listAdminRoadmapStudents>) { return admin.listAdminRoadmapStudents(...args); }
export async function generateAdminRoadmapAssignment(...args: Parameters<typeof admin.generateAdminRoadmapAssignment>) { return admin.generateAdminRoadmapAssignment(...args); }
export async function listAdminLiveClasses(...args: Parameters<typeof admin.listAdminLiveClasses>) { return admin.listAdminLiveClasses(...args); }
export async function createAdminLiveClass(...args: Parameters<typeof admin.createAdminLiveClass>) { return admin.createAdminLiveClass(...args); }

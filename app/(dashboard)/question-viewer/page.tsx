import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole } from "@/app/actions/bootcamp";

export const metadata: Metadata = {
  title: "Question Search · Tutormigo",
};

export default async function QuestionViewerPage({
  searchParams,
}: {
  searchParams?: { question?: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/question-bank");
  const requestedId = searchParams?.question?.trim();
  const destination = requestedId
    ? `/admin/question-search?question=${encodeURIComponent(requestedId)}`
    : "/admin/question-search";
  redirect(destination);
}

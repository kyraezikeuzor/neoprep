import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileRole } from "@/app/actions/bootcamp";
import QuestionViewer from "@/components/QuestionViewer";

export const metadata: Metadata = {
  title: "Admin Lookup · NeoPrep",
};

export default async function AdminQuestionSearchPage({
  searchParams,
}: {
  searchParams?: { question?: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const requestedId = searchParams?.question?.trim() ?? "";
  if (requestedId) {
    redirect(`/admin/question-search/view?question=${encodeURIComponent(requestedId)}`);
  }

  return (
    <div className="h-full min-h-0">
      <QuestionViewer
        headerTitle="Lookup"
      />
    </div>
  );
}

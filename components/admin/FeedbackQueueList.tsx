import Link from "next/link";
import type { FeedbackQueueEntry, SandboxIssueType } from "@/app/actions/tools";

function formatIssueLabel(issueType: SandboxIssueType): string {
  switch (issueType) {
    case "issue_with_explanation":
      return "Issue with explanation";
    case "wrong_answer_marked_correct":
      return "Wrong answer marked as correct";
    case "explanation_incorrect":
      return "Explanation is incorrect";
    case "formatting_display_issue":
      return "Formatting/display issue";
    default:
      return "Other issue";
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(text: string, max = 220): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

type FeedbackGroup = {
  questionId: string;
  question: FeedbackQueueEntry["question"];
  entries: FeedbackQueueEntry[];
};

function groupEntries(entries: FeedbackQueueEntry[]): FeedbackGroup[] {
  const groups = new Map<string, FeedbackGroup>();

  for (const entry of entries) {
    const existing = groups.get(entry.questionId);
    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    groups.set(entry.questionId, {
      questionId: entry.questionId,
      question: entry.question,
      entries: [entry],
    });
  }

  return Array.from(groups.values());
}

export default function FeedbackQueueList({
  entries,
}: {
  entries: FeedbackQueueEntry[];
}) {
  const groups = groupEntries(entries);

  if (groups.length === 0) {
    return (
      <div className="arc-card mt-8 p-6">
        <p className="font-sans text-sm text-arc-muted">
          No question issues have been reported yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {groups.map((group) => {
        const question = group.question;

        return (
          <section key={group.questionId} className="arc-card overflow-hidden">
            <div className="border-b border-arc-line px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-arc-muted">{group.questionId}</p>
                  <h2 className="mt-1 font-sans text-base font-semibold text-arc-ink">
                    {question?.skill ?? "Question with reported issue"}
                  </h2>
                  <p className="mt-1 text-sm text-arc-muted">
                    {[question?.domain, question?.tier != null ? `Tier ${question.tier}` : null]
                      .filter(Boolean)
                      .join(" · ") || "Question details unavailable"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      question?.verified
                        ? "bg-[#ECFDF3] text-[#166534]"
                        : "bg-[#FEF3F2] text-[#B42318]"
                    }`}
                  >
                    {question?.verified ? "Verified" : "Needs review"}
                  </span>
                  <Link
                    href={`/admin/sandbox/review?question=${encodeURIComponent(group.questionId)}`}
                    className="rounded-full border border-arc-line px-3 py-1 text-xs font-medium text-arc-accent hover:bg-[#F8FBFF]"
                  >
                    Open in Editor
                  </Link>
                </div>
              </div>

              {question?.stem ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-arc-heading">
                  {truncate(question.stem)}
                </p>
              ) : null}
            </div>

            <div className="divide-y divide-arc-line">
              {group.entries.map((entry, index) => (
                <article key={`${group.questionId}-${entry.createdAt ?? index}`} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-sm font-semibold text-arc-ink">
                      {formatIssueLabel(entry.issueType)}
                    </p>
                    <p className="text-xs text-arc-muted">{formatDate(entry.createdAt)}</p>
                  </div>

                  <p className="mt-1 text-sm text-arc-muted">
                    {entry.reporter?.fullName?.trim() ||
                      entry.reporter?.email ||
                      "Unknown reporter"}
                  </p>

                  <div className="mt-3 rounded-2xl border border-arc-line bg-[#FAFAFA] p-4">
                    <p className="font-sans text-sm leading-6 text-arc-heading">
                      {entry.notes?.trim() || "No notes added."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

import type { LeaderboardEntry } from "@/app/actions";

export default function LeaderboardTable({
  entries,
  label = "XP rankings",
  emptyTitle = "No attempts yet",
  emptyHint = "Practice questions to earn XP and appear on the board.",
}: {
  entries: LeaderboardEntry[];
  label?: string;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="arc-card mt-8 px-6 py-10 text-center">
        <p className="arc-card-label">{label}</p>
        <p className="mt-2 font-sans text-base text-arc-heading">{emptyTitle}</p>
        <p className="arc-card-hint mt-2">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="arc-card mt-8 overflow-hidden">
      <div className="grid grid-cols-[2.5rem_1fr_auto] gap-2 border-b border-arc-line px-4 py-3 sm:grid-cols-[3rem_1fr_auto] sm:gap-3 sm:px-6">
        <p className="arc-card-label">#</p>
        <p className="arc-card-label">Student</p>
        <p className="arc-card-label text-right">XP</p>
      </div>
      <ul className="divide-y divide-arc-line">
        {entries.map((entry) => (
          <li
            key={entry.student_id}
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 px-4 py-3.5 sm:grid-cols-[3rem_1fr_auto] sm:gap-3 sm:px-6"
          >
            <span className="font-sans text-sm tabular-nums text-[#8F8F98]">
              {entry.rank}
            </span>
            <span className="font-sans text-base font-normal text-arc-heading">
              {entry.display_name}
            </span>
            <span className="font-sans text-base font-normal tabular-nums text-arc-heading">
              {entry.xp.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

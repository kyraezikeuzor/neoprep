import Link from "next/link";
import { FREE_QUESTION_LIMIT } from "@/lib/access-policy";

type UpgradeToProCardProps = {
  usedQuestions: number;
  questionLimit: number | null;
  className?: string;
  compact?: boolean;
};

export default function UpgradeToProCard({
  usedQuestions,
  questionLimit,
  className = "",
  compact = false,
}: UpgradeToProCardProps) {
  const safeLimit = Math.max(1, questionLimit ?? FREE_QUESTION_LIMIT);
  const used = Math.min(Math.max(0, usedQuestions), safeLimit);
  const remaining = Math.max(0, safeLimit - used);
  const usedPercent = Math.round((used / safeLimit) * 100);

  const headline =
    remaining === 0
      ? `You’ve reached your ${safeLimit}-question Free limit`
      : remaining <= 25
        ? `Only ${remaining} free question${remaining === 1 ? "" : "s"} left`
        : `${remaining} free questions remaining`;

  return (
    <section
      className={`rounded-[28px] bg-[#EC4899] ${
        compact ? "px-5 py-5" : "px-5 py-6 sm:px-7"
      } ${className}`}
      aria-label="Free question allowance"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-[#FDE7F4] px-3 py-1 font-sans text-xs font-bold tracking-wide text-[#EC4899]">
              PRO
            </span>
            <p className="font-dm text-xl font-medium tracking-normal text-[#FDE7F4] sm:text-2xl">
              {headline}
            </p>
          </div>
          <p className="mt-2 font-sans text-sm leading-relaxed text-[#FDE7F4] sm:text-base">
            Unlock all 1,000+ questions, your Roadmap, and live lessons with Pro.
          </p>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-[#FDE7F4]/30"
            role="progressbar"
            aria-label={`${used} of ${safeLimit} free questions used`}
            aria-valuemin={0}
            aria-valuemax={safeLimit}
            aria-valuenow={used}
          >
            <div
              className="h-full rounded-full bg-[#FDE7F4] transition-[width] duration-300"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="mt-1.5 font-sans text-xs font-medium text-[#FDE7F4]">
            {used} of {safeLimit} free questions used
          </p>
        </div>

        <Link
          href="/pricing"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-6 py-2.5 font-sans text-base font-semibold text-[#EC4899] transition hover:bg-[#FDE7F4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Upgrade
        </Link>
      </div>
    </section>
  );
}

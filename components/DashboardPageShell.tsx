import type { ReactNode } from "react";

/** Shared inset for dashboard content pages — equal side margins. */
export default function DashboardPageShell({
  children,
  narrow = false,
}: {
  children: ReactNode;
  /** Constrain inner content (e.g. settings) while keeping the same outer margins */
  narrow?: boolean;
}) {
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto">
      <div
        className={`mx-auto w-full px-5 pb-14 pt-5 sm:px-10 sm:pb-16 sm:pt-6 md:px-16 lg:px-24 xl:px-32 ${
          narrow ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

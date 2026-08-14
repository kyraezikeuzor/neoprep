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
    <div className="h-full overflow-y-auto">
      <div
        className={`mx-auto w-full px-10 pb-12 pt-10 sm:px-14 lg:px-16 ${
          narrow ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

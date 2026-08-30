import type { ReactNode } from "react";

/** Shared inset for dashboard content pages — equal side margins. */
export default function DashboardPageShell({
  children,
  narrow = false,
  backgroundImage,
  fadeBackground = false,
}: {
  children: ReactNode;
  /** Constrain inner content (e.g. settings) while keeping the same outer margins */
  narrow?: boolean;
  /** Optional background for this page's main content canvas only. */
  backgroundImage?: string;
  /** Soften a page background and gradually transition it to white. */
  fadeBackground?: boolean;
}) {
  return (
    <div
      className="relative h-full overflow-x-hidden overflow-y-auto bg-white bg-cover bg-center bg-no-repeat"
      style={
        backgroundImage
          ? { backgroundImage: `url("${backgroundImage}")` }
          : undefined
      }
    >
      {backgroundImage && fadeBackground ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_52%,rgba(255,255,255,0.28)_68%,rgba(255,255,255,0.62)_80%,rgba(255,255,255,0.9)_92%,rgba(255,255,255,1)_100%)]"
          aria-hidden
        />
      ) : null}
      <div
        className={`relative z-10 mx-auto w-full px-4 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16 md:px-10 lg:px-12 xl:px-16 ${
          narrow ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

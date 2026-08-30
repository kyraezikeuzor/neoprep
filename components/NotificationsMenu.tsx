"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function BellIcon({
  className = "h-6 w-6 sm:h-7 sm:w-7",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.75A6.75 6.75 0 005.25 9.5c0 3.62-1.18 5.52-1.9 6.42A1.15 1.15 0 004.22 18h15.56a1.15 1.15 0 00.87-2.08c-.72-.9-1.9-2.8-1.9-6.42A6.75 6.75 0 0012 2.75z" />
      <path d="M9.05 19.15a2.95 2.95 0 005.9 0H9.05z" />
    </svg>
  );
}

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"notifications" | "changelog">("notifications");
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const unreadCount = 0;

  useEffect(() => {
    if (!open) return;

    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({
        top: rect.bottom + 10,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        rootRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    place();
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const emptyCopy =
    tab === "notifications"
      ? {
          title: "All caught up!",
          body: "No new notifications at the moment.",
        }
      : {
          title: "No updates yet",
          body: "New product changes will show up here.",
        };

  const panel =
    open && coords ? (
      <div
        ref={rootRef}
        role="dialog"
        aria-label="Notifications"
        className="fixed z-[80] w-[min(22.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.5rem] border border-[#ECECEE] bg-white shadow-[0_18px_50px_rgba(24,24,27,0.12)]"
        style={{ top: coords.top, right: coords.right }}
      >
        <div className="px-3 pt-3">
          <div className="grid grid-cols-2 rounded-xl bg-[#F3F4F6] p-1">
            <button
              type="button"
              onClick={() => setTab("notifications")}
              className={`rounded-lg px-3 py-2 font-sans text-sm font-semibold transition ${
                tab === "notifications"
                  ? "bg-white text-[#18181B] shadow-sm"
                  : "text-[#71717A]"
              }`}
            >
              Notifications
            </button>
            <button
              type="button"
              onClick={() => setTab("changelog")}
              className={`rounded-lg px-3 py-2 font-sans text-sm font-semibold transition ${
                tab === "changelog"
                  ? "bg-white text-[#18181B] shadow-sm"
                  : "text-[#71717A]"
              }`}
            >
              Changelog
            </button>
          </div>
        </div>

        <div className="mt-3 border-t border-[#ECECEE] px-4 pb-6 pt-3">
          <div className="flex justify-end">
            <button
              type="button"
              className="arc-btn-secondary px-3 py-1 text-xs"
            >
              Mark all as read
            </button>
          </div>

          <div className="flex flex-col items-center px-4 pb-4 pt-8 text-center">
            <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-[#F3F4F6] text-[#A1A1AA]">
              <BellIcon className="h-12 w-12" />
            </div>
            <p className="mt-5 font-sans text-lg font-semibold text-[#18181B]">
              {emptyCopy.title}
            </p>
            <p className="mt-1 font-sans text-sm text-[#8B8B93]">{emptyCopy.body}</p>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#A1A1AA] transition hover:text-[#8A8A93]"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-[#FF4B4B] px-1 font-sans text-[11px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}

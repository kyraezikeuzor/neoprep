"use client";

export type Highlight = {
  id: string;
  text: string;
  note: string;
};

const PANEL_W = "26rem";

function HighlightsNotesIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

export function HighlightsNotesButton({
  open,
  count,
  onClick,
}: {
  open: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={open}
      aria-label={open ? "Close highlights & notes" : "Open highlights & notes"}
      className={`relative inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition ${
        open
          ? "bg-[#F3F4F6] text-arc-ink"
          : "text-[#6B7280] hover:bg-arc-soft hover:text-arc-ink"
      }`}
    >
      <span className="relative">
        <HighlightsNotesIcon />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-arc-accent px-0.5 text-[9px] font-semibold leading-none text-white">
            {count}
          </span>
        )}
      </span>
      <span className="whitespace-nowrap text-[11px] font-medium leading-none">
        Highlights &amp; Notes
      </span>
    </button>
  );
}

export default function HighlightsNotesPanel({
  open,
  onClose,
  highlights,
  onUpdateNote,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  highlights: Highlight[];
  onUpdateNote: (id: string, note: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <aside
      aria-hidden={!open}
      className={`explanation-panel z-40 flex shrink-0 flex-col overflow-hidden bg-white ${
        open ? "explanation-panel--open" : ""
      }`}
      style={{ ["--panel-w" as string]: PANEL_W }}
    >
      <div className="explanation-panel__inner flex h-full min-h-0 flex-col border-l border-arc-line">
        <div className="flex shrink-0 items-center justify-between border-b border-arc-line px-5">
          <p className="py-3.5 text-sm font-semibold text-arc-ink">Highlights &amp; Notes</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close highlights & notes"
            className="rounded-md p-1.5 text-arc-muted transition hover:bg-arc-soft hover:text-arc-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="mb-4 text-sm text-arc-muted">
            Select text in the passage to highlight it, then add a note below.
          </p>

          {highlights.length === 0 ? (
            <p className="text-sm text-arc-muted/70">No highlights yet.</p>
          ) : (
            <div className="space-y-3">
              {highlights.map((h) => (
                <div key={h.id} className="rounded-2xl border border-arc-line p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 rounded-md bg-yellow-100 px-2 py-1 text-sm text-arc-ink">
                      &ldquo;{h.text}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(h.id)}
                      aria-label="Remove highlight"
                      className="shrink-0 rounded-md p-1 text-arc-muted transition hover:bg-arc-soft hover:text-arc-ink"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={h.note}
                    onChange={(e) => onUpdateNote(h.id, e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="w-full resize-none rounded-md border border-arc-line px-2.5 py-1.5 text-sm text-arc-ink outline-none transition focus:border-arc-accent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

import Link from "next/link";
import type { BootcampSummary } from "@/app/actions/bootcamp";
import CopyJoinLinkButton from "@/components/admin/CopyJoinLinkButton";
import CreateBootcampForm from "@/components/admin/CreateBootcampForm";

export default function AdminBootcampManager({
  bootcamps,
}: {
  bootcamps: BootcampSummary[];
}) {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <CreateBootcampForm />

      <div>
        <h2 className="font-sans text-base font-semibold text-arc-ink">Your bootcamps</h2>
        {bootcamps.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-arc-muted">No bootcamps yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bootcamps.map((bootcamp) => (
              <li
                key={bootcamp.id}
                className="arc-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/bootcamps/${bootcamp.id}`}
                      className="font-sans text-base font-semibold text-arc-ink hover:underline"
                    >
                      {bootcamp.name}
                    </Link>
                    <p className="mt-1 font-sans text-xs text-arc-muted">
                      {bootcamp.start_date ?? "—"} → {bootcamp.end_date ?? "—"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/bootcamps/${bootcamp.id}`}
                    className="font-sans text-sm font-medium text-arc-accent"
                  >
                    Manage →
                  </Link>
                </div>
                <div className="mt-3">
                  <CopyJoinLinkButton joinCode={bootcamp.join_code} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

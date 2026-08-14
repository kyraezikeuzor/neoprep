import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdminBootcamp,
  getBootcampRoster,
  getProfileRole,
  listAdminAssignments,
} from "@/app/bootcamp-actions";
import DashboardPageShell from "@/components/DashboardPageShell";
import PageHeader from "@/components/PageHeader";
import CopyJoinLinkButton from "@/components/admin/CopyJoinLinkButton";
import CreateAssignmentForm from "@/components/admin/CreateAssignmentForm";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const bootcampId = Number(params.id);
  if (!Number.isFinite(bootcampId)) return { title: "Admin · Tutormigo" };
  try {
    const bootcamp = await getAdminBootcamp(bootcampId);
    if (!bootcamp) return { title: "Admin · Tutormigo" };
    return { title: `${bootcamp.name} · Tutormigo` };
  } catch {
    return { title: "Admin · Tutormigo" };
  }
}

export default async function AdminBootcampDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const role = await getProfileRole();
  if (role !== "admin") redirect("/dashboard");

  const bootcampId = Number(params.id);
  if (!Number.isFinite(bootcampId)) notFound();

  const bootcamp = await getAdminBootcamp(bootcampId);
  if (!bootcamp) notFound();

  const [assignments, roster] = await Promise.all([
    listAdminAssignments(bootcampId),
    getBootcampRoster(bootcampId),
  ]);

  return (
    <DashboardPageShell>
      <Link
        href="/admin"
        className="mb-4 inline-block font-sans text-sm text-arc-muted hover:text-arc-ink"
      >
        ← All bootcamps
      </Link>
      <PageHeader title={bootcamp.name} description="Assignments, join link, and roster." />

      <div className="mt-6 rounded-2xl border-2 border-[#E5E7EB] bg-white p-4">
        <p className="font-sans text-xs font-medium uppercase tracking-wide text-arc-muted">
          Shareable join link
        </p>
        <div className="mt-2">
          <CopyJoinLinkButton joinCode={bootcamp.join_code} />
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <CreateAssignmentForm bootcampId={bootcampId} />

        <div>
          <h2 className="font-sans text-base font-semibold text-arc-ink">Assignments</h2>
          {assignments.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-arc-muted">No assignments yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
                >
                  <p className="font-sans text-sm font-semibold text-arc-ink">{a.title}</p>
                  <p className="mt-1 font-sans text-xs text-arc-muted">
                    Due {a.due_date ?? "—"} · {a.question_count} questions
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-sans text-base font-semibold text-arc-ink">Roster</h2>
        {roster.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-arc-muted">No students have joined yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-[#E5E7EB]">
            <table className="min-w-full text-left font-sans text-sm">
              <thead className="bg-[#FAFAFA] text-xs uppercase tracking-wide text-arc-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  {assignments.map((a) => (
                    <th key={a.id} className="px-4 py-3 font-medium">
                      {a.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map((row) => (
                  <tr
                    key={row.student_id}
                    className="border-t border-[#E5E7EB] transition-colors hover:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bootcamps/${bootcampId}/students/${row.student_id}`}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
                      >
                        <p className="font-medium text-arc-ink hover:underline">
                          {row.full_name || "Student"}
                        </p>
                        <p className="text-xs text-arc-muted">{row.email}</p>
                      </Link>
                    </td>
                    {row.progress.map((p) => (
                      <td key={p.assignment_id} className="px-4 py-3 tabular-nums text-arc-ink">
                        <Link
                          href={`/admin/bootcamps/${bootcampId}/students/${row.student_id}`}
                          className="block hover:underline"
                        >
                          {p.completed}/{p.total}
                        </Link>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardPageShell>
  );
}

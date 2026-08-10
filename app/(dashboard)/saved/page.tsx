import PageHeader from "@/components/PageHeader";

export default function SavedPage() {
  return (
    <div className="h-full overflow-y-auto px-8 pb-10 pt-8 sm:px-10">
      <PageHeader
        title="Saved"
        description="Questions you’ve bookmarked for later."
      />
      <div className="mt-10 rounded-arc border border-arc-line bg-white px-5 py-10 text-center font-sans text-sm text-arc-muted">
        No saved questions yet.
      </div>
    </div>
  );
}

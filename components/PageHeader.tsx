import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="font-sans">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-arc-muted">{icon}</span>}
        <h1 className="text-3xl font-semibold tracking-tight text-[#3F3F46]">{title}</h1>
      </div>
      {description && (
        <p className="mt-2 max-w-2xl text-base font-normal leading-[1.6] text-arc-muted">
          {description}
        </p>
      )}
    </div>
  );
}

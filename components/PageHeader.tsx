import type { ReactNode } from "react";
import { textColor, typography } from "@/lib/typography";

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
        {icon && <span className={textColor.muted}>{icon}</span>}
        <h1 className={typography.pageTitle}>{title}</h1>
      </div>
      {description && (
        <p className={`mt-2 max-w-2xl ${typography.pageDescription}`}>
          {description}
        </p>
      )}
    </div>
  );
}

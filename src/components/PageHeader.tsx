import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div
      className="
        mb-4 sm:mb-6
        flex flex-col gap-3
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

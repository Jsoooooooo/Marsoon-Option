import type { ReactNode } from "react";

export function SectionPlaceholder({
  code,
  title,
  description,
  endpoint,
  children,
}: {
  code: string;
  title: string;
  description: string;
  endpoint: string;
  children?: ReactNode;
}) {
  return (
    <div className="dashboard-grid min-h-screen p-3 sm:p-4">
      <header className="ms-panel mb-3 flex min-h-16 items-center justify-between px-4">
        <div>
          <p className="font-mono text-[8px] tracking-[0.16em] text-[var(--ms-brand)]">
            MODULE // {code}
          </p>
          <h1 className="mt-1 text-base font-medium text-[var(--ms-text-primary)]">{title}</h1>
        </div>
        <span className="font-mono text-[8px] tracking-[0.12em] text-[var(--ms-text-tertiary)]">
          ROUTE READY
        </span>
      </header>

      <section className="ms-panel grid min-h-[420px] place-items-center px-6 text-center">
        <div className="max-w-lg">
          <p className="font-mono text-[9px] tracking-[0.14em] text-[var(--ms-text-tertiary)]">{endpoint}</p>
          <h2 className="mt-4 text-lg font-medium text-[var(--ms-text-primary)]">{title}路由已就绪</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ms-text-secondary)]">{description}</p>
          {children}
        </div>
      </section>
    </div>
  );
}

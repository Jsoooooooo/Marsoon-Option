import { Suspense } from "react";

import { OptionsDashboard } from "@/features/options/OptionsDashboard";

function DashboardFallback() {
  return (
    <div className="dashboard-grid min-h-screen p-3 sm:p-4">
      <div className="h-16 animate-pulse rounded-[10px] border border-[var(--ms-separator)] bg-[var(--ms-panel-bg)]" />
      <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-[var(--ms-separator)] xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse bg-[var(--ms-card-bg)]" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <OptionsDashboard />
    </Suspense>
  );
}

import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--ms-app-bg)] text-[var(--ms-text-primary)]">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
    </div>
  );
}

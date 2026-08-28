"use client";

import {
  Activity,
  ChartNoAxesCombined,
  CircleGauge,
  Layers3,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "今日概览", code: "01", href: "/", icon: CircleGauge },
  { label: "Gamma 地图", code: "02", href: "/gamma", icon: Layers3 },
  { label: "0DTE", code: "03", href: "/zero-dte", icon: TimerReset },
  { label: "资金流", code: "04", href: "/flow", icon: Activity },
  { label: "波动率", code: "05", href: "/volatility", icon: ChartNoAxesCombined },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-44 shrink-0 border-r border-[var(--ms-separator)] bg-[var(--ms-panel-bg)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start">
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--ms-separator)] px-4">
          <span className="grid size-7 place-items-center rounded-lg border border-[var(--ms-brand)] text-[10px] font-semibold tracking-tight text-[var(--ms-brand)]">
            M/
          </span>
          <span className="text-[11px] font-medium tracking-[0.12em] text-[var(--ms-text-primary)]">
            MARSOON
            <span className="block text-[8px] tracking-[0.22em] text-[var(--ms-text-tertiary)]">OPTIONS</span>
          </span>
        </div>

        <nav className="space-y-1 px-2 py-5" aria-label="期权看板导航">
          {navigation.map(({ label, code, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex h-10 w-full items-center gap-2.5 rounded-lg border-l px-3 text-left text-xs transition-colors ${
                  active
                    ? "border-[var(--ms-brand)] bg-[var(--ms-brand-dim)] text-[var(--ms-text-primary)]"
                    : "border-transparent text-[var(--ms-text-tertiary)] hover:bg-[var(--ms-elevated-bg)] hover:text-[var(--ms-text-primary)]"
                }`}
              >
                <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <span className="font-mono text-[8px] text-[var(--ms-text-tertiary)]">{code}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--ms-separator)] px-4 py-4 font-mono text-[8px] leading-5 tracking-[0.12em] text-[var(--ms-text-tertiary)]">
          <p>MARSOON SYSTEM // V0.1</p>
          <p>OPTIONS DATA TERMINAL</p>
        </div>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-[var(--ms-separator)] bg-[var(--ms-panel-bg)] lg:hidden"
        aria-label="移动端期权看板导航"
      >
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[9px] ${
                active ? "text-[var(--ms-brand)]" : "text-[var(--ms-text-tertiary)]"
              }`}
            >
              <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

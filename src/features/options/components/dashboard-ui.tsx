import { AlertTriangle, Bell, RefreshCw, Search } from "lucide-react";
import type { ReactNode } from "react";

import {
  optionProductConfig,
  OptionsApiError,
  type OptionProduct,
  type OptionScope,
} from "@/api/options";
import { formatPrice, formatSnapshotTime } from "@/lib/formatters";
import type {
  DashboardStatus,
  DashboardViewModel,
} from "../dashboard-view-model";

const scopes: Array<{ value: OptionScope; label: string }> = [
  { value: "0dte", label: "0DTE" },
  { value: "nearest", label: "近月" },
  { value: "all", label: "全部" },
];

const statusLabels: Record<DashboardStatus, string> = {
  fresh: "FRESH",
  mixed: "MIXED",
  stale: "STALE",
  insufficient: "NO DATA",
};

const statusClasses: Record<DashboardStatus, string> = {
  fresh: "text-[var(--ms-buy)]",
  mixed: "text-[var(--ms-brand)]",
  stale: "text-[var(--ms-brand)]",
  insufficient: "text-[var(--ms-danger)]",
};

export function DashboardToolbar({
  product,
  scope,
  viewModel,
  isPending,
  isError,
  isFetching,
  onProductChange,
  onScopeChange,
  onRefresh,
}: {
  product: OptionProduct;
  scope: OptionScope;
  viewModel?: DashboardViewModel;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  onProductChange: (product: OptionProduct) => void;
  onScopeChange: (scope: OptionScope) => void;
  onRefresh: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[var(--ms-separator)] bg-[var(--ms-panel-bg)] px-3 py-2 sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <select
          value={product}
          onChange={(event) => onProductChange(event.target.value as OptionProduct)}
          aria-label="选择期权产品"
          className="ms-control h-9 min-w-32 px-2.5 text-xs font-medium text-[var(--ms-text-primary)] outline-none focus:border-[var(--ms-brand)]"
        >
          {(Object.keys(optionProductConfig) as OptionProduct[]).map((item) => (
            <option key={item} value={item}>
              {item} · {optionProductConfig[item].label}
            </option>
          ))}
        </select>

        <div className="font-mono text-sm font-medium tabular-nums text-[var(--ms-text-primary)]">
          {formatPrice(viewModel?.spot, optionProductConfig[product].tickSize)}
        </div>

        <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.08em]">
          <span
            className={`size-1.5 ${
              viewModel?.status === "fresh" ? "bg-[var(--ms-buy)]" : "bg-[var(--ms-brand)]"
            }`}
          />
          <span className={viewModel ? statusClasses[viewModel.status] : "text-[var(--ms-text-secondary)]"}>
            {viewModel?.source === "local-demo"
              ? "DEMO"
              : isPending
              ? "LOADING"
              : isError
                ? "ERROR"
                : viewModel
                  ? statusLabels[viewModel.status]
                  : "--"}
          </span>
          <span className="text-[var(--ms-text-tertiary)]">
            SNAPSHOT · {formatSnapshotTime(viewModel?.snapshotUnix)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="ms-control flex p-0.5" aria-label="数据范围">
          {scopes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onScopeChange(item.value)}
              aria-pressed={scope === item.value}
              className={`h-7 px-2.5 text-[10px] transition-colors ${
                  scope === item.value
                  ? "rounded-md bg-[var(--ms-brand-dim)] text-[var(--ms-brand)]"
                  : "text-[var(--ms-text-secondary)] hover:text-[var(--ms-text-primary)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="搜索"
          disabled
          className="ms-control grid size-9 cursor-not-allowed place-items-center text-[var(--ms-text-tertiary)]"
        >
          <Search size={15} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="提醒"
          disabled
          className="ms-control grid size-9 cursor-not-allowed place-items-center text-[var(--ms-text-tertiary)]"
        >
          <Bell size={15} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="刷新 Dashboard"
          onClick={onRefresh}
          disabled={isFetching}
          className="ms-control grid size-9 place-items-center text-[var(--ms-text-secondary)] transition-colors hover:border-[var(--ms-brand)] hover:text-[var(--ms-brand)] disabled:cursor-wait"
        >
          <RefreshCw
            size={15}
            strokeWidth={1.5}
            className={isFetching ? "animate-spin" : ""}
          />
        </button>
      </div>
    </header>
  );
}

export function MetricCard({
  label,
  meta,
  value,
  tone = "default",
}: {
  label: string;
  meta?: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const toneClass = {
    default: "text-[var(--ms-text-primary)]",
    positive: "text-[var(--ms-buy)]",
    negative: "text-[var(--ms-sell)]",
    warning: "text-[var(--ms-brand)]",
  }[tone];

  return (
    <article className="border-r border-[var(--ms-separator)] bg-[var(--ms-panel-bg)] p-3 last:border-r-0">
      <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ms-text-secondary)]">
        <span>{label}</span>
        {meta ? <span>{meta}</span> : null}
      </div>
      <div className={`text-lg font-medium tabular-nums tracking-tight ${toneClass}`}>{value}</div>
    </article>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ms-panel ${className}`}>
      <header className="flex min-h-11 items-center justify-between gap-3 border-b border-[var(--ms-separator)] px-3 py-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate text-xs font-medium text-[var(--ms-text-primary)]">{title}</h2>
          {subtitle ? (
            <span className="hidden truncate font-mono text-[9px] text-[var(--ms-text-secondary)] sm:inline">
              {subtitle}
            </span>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function LoadingDashboard() {
  return (
    <div className="space-y-3" aria-label="正在加载期权数据">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-[var(--ms-separator)] xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse bg-[var(--ms-card-bg)]" />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,.72fr)]">
        <div className="h-[470px] animate-pulse rounded-[10px] border border-[var(--ms-separator)] bg-[var(--ms-card-bg)]" />
        <div className="h-[470px] animate-pulse rounded-[10px] border border-[var(--ms-separator)] bg-[var(--ms-card-bg)]" />
      </div>
    </div>
  );
}

export function ErrorDashboard({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const status = error instanceof OptionsApiError ? error.status : undefined;
  return (
    <section className="ms-panel grid min-h-[420px] place-items-center border-[var(--ms-danger)] px-6 text-center">
      <div className="max-w-lg">
        <AlertTriangle className="mx-auto mb-4 text-[var(--ms-danger)]" size={24} strokeWidth={1.5} />
        <p className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[var(--ms-danger)]">
          OPTIONS API {status ? `// HTTP ${status}` : "// UNAVAILABLE"}
        </p>
        <h2 className="text-base font-medium text-[var(--ms-text-primary)]">Dashboard 数据加载失败</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ms-text-secondary)]">{error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="ms-control mt-5 px-4 py-2 text-xs text-[var(--ms-text-primary)] transition-colors hover:border-[var(--ms-brand)] hover:text-[var(--ms-brand)]"
        >
          重新请求
        </button>
      </div>
    </section>
  );
}

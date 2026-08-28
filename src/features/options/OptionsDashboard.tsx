"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import type { OptionProduct, OptionScope } from "@/api/options";
import { buildDashboardViewModel } from "./dashboard-view-model";
import { buildLevelsViewModel } from "./levels-view-model";
import { DashboardContent } from "./components/dashboard-panels";
import {
  DashboardToolbar,
  ErrorDashboard,
  LoadingDashboard,
} from "./components/dashboard-ui";
import { useOptionsDashboard } from "./use-options-dashboard";
import { useOptionsLevels } from "./use-options-levels";

const products = new Set<OptionProduct>(["NQ", "ES", "GC"]);
const scopes = new Set<OptionScope>(["0dte", "nearest", "all"]);

function parseProduct(value: string | null): OptionProduct {
  const candidate = value?.toUpperCase() as OptionProduct | undefined;
  return candidate && products.has(candidate) ? candidate : "NQ";
}

function parseScope(value: string | null): OptionScope {
  const candidate = value?.toLowerCase() as OptionScope | undefined;
  return candidate && scopes.has(candidate) ? candidate : "0dte";
}

export function OptionsDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const product = parseProduct(searchParams.get("product"));
  const scope = parseScope(searchParams.get("scope"));
  const dashboardQuery = useOptionsDashboard(product, scope);
  const levelsQuery = useOptionsLevels(product, scope);
  const viewModel = useMemo(
    () =>
      dashboardQuery.data
        ? buildDashboardViewModel(dashboardQuery.data, scope)
        : undefined,
    [dashboardQuery.data, scope],
  );
  const levelsViewModel = useMemo(
    () => (levelsQuery.data ? buildLevelsViewModel(levelsQuery.data) : undefined),
    [levelsQuery.data],
  );

  const updateQuery = useCallback(
    (key: "product" | "scope", value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(key, value);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <>
      <DashboardToolbar
        product={product}
        scope={scope}
        viewModel={viewModel}
        isPending={dashboardQuery.isPending}
        isError={dashboardQuery.isError}
        isFetching={dashboardQuery.isFetching || levelsQuery.isFetching}
        onProductChange={(nextProduct) => updateQuery("product", nextProduct)}
        onScopeChange={(nextScope) => updateQuery("scope", nextScope)}
        onRefresh={() => {
          void Promise.all([dashboardQuery.refetch(), levelsQuery.refetch()]);
        }}
      />

      <div className="dashboard-grid min-h-[calc(100vh-4rem)] p-3 sm:p-4">
        {dashboardQuery.isPending ? <LoadingDashboard /> : null}
        {dashboardQuery.isError ? (
          <ErrorDashboard
            error={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error
                : new Error("未知错误")
            }
            onRetry={() => void dashboardQuery.refetch()}
          />
        ) : null}
        {viewModel && !dashboardQuery.isError ? (
          <DashboardContent
            viewModel={viewModel}
            levelsViewModel={levelsViewModel}
            levelsLoading={levelsQuery.isPending}
            levelsError={levelsQuery.isError}
          />
        ) : null}
      </div>
    </>
  );
}

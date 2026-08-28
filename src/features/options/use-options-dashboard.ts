import { useQuery } from "@tanstack/react-query";

import {
  getOptionDashboard,
  type OptionProduct,
  type OptionScope,
} from "../../api/options";

export const optionsDashboardKeys = {
  all: ["options-dashboard"] as const,
  detail: (product: OptionProduct, scope: OptionScope) =>
    [...optionsDashboardKeys.all, product, scope, 20, 0.12] as const,
};

export function useOptionsDashboard(product: OptionProduct, scope: OptionScope) {
  return useQuery({
    queryKey: optionsDashboardKeys.detail(product, scope),
    queryFn: ({ signal }) => getOptionDashboard(product, scope, signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

import { useQuery } from "@tanstack/react-query";

import { getOptionLevels, type OptionProduct, type OptionScope } from "@/api/options";

export const optionsLevelsKeys = {
  all: ["options-levels"] as const,
  detail: (product: OptionProduct, scope: OptionScope) =>
    [...optionsLevelsKeys.all, product, scope, 300] as const,
};

export function useOptionsLevels(product: OptionProduct, scope: OptionScope) {
  return useQuery({
    queryKey: optionsLevelsKeys.detail(product, scope),
    queryFn: ({ signal }) => getOptionLevels(product, scope, signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

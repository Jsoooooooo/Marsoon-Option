import type {
  MarketState,
  OptionLevelPoint,
  OptionsLevelsResponse,
} from "@/api/options";

export interface MigrationPoint {
  unix: number;
  value: number;
}

export interface MigrationSeries {
  metric: "call_wall" | "put_wall" | "gamma_flip";
  label: string;
  points: MigrationPoint[];
  current?: number;
  change?: number;
}

export interface LevelsViewModel {
  latestUnix?: number;
  delta5m?: number;
  delta15m?: number;
  delta30m?: number;
  migrations: MigrationSeries[];
}

function finiteNumber(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function changeFrom(
  states: MarketState[],
  latestUnix: number,
  seconds: number,
): number | undefined {
  const latest = states.find((state) => state.unix === latestUnix);
  const previous = [...states]
    .reverse()
    .find((state) => state.unix <= latestUnix - seconds);
  const latestValue = finiteNumber(latest?.net_gex);
  const previousValue = finiteNumber(previous?.net_gex);
  if (latestValue === undefined || previousValue === undefined) return undefined;
  return latestValue - previousValue;
}

function normalizeMetric(metric: string): MigrationSeries["metric"] | undefined {
  const normalized = metric.toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "call_wall" || normalized === "put_wall" || normalized === "gamma_flip") {
    return normalized;
  }
  return undefined;
}

function levelValue(point: OptionLevelPoint): number | undefined {
  return finiteNumber(point.strike) ?? finiteNumber(point.value);
}

export function buildLevelsViewModel(response: OptionsLevelsResponse): LevelsViewModel {
  const states = [...response.states].sort((a, b) => a.unix - b.unix);
  const latestUnix = states.at(-1)?.unix;
  const grouped = new Map<MigrationSeries["metric"], MigrationPoint[]>();

  for (const point of response.levels) {
    if ((point.rank ?? 1) !== 1) continue;
    const metric = normalizeMetric(point.metric);
    const value = levelValue(point);
    if (!metric || value === undefined) continue;
    const points = grouped.get(metric) ?? [];
    points.push({ unix: point.unix, value });
    grouped.set(metric, points);
  }

  const definitions: Array<{
    metric: MigrationSeries["metric"];
    label: string;
  }> = [
    { metric: "call_wall", label: "Call Wall" },
    { metric: "gamma_flip", label: "Gamma Flip" },
    { metric: "put_wall", label: "Put Wall" },
  ];

  return {
    latestUnix,
    delta5m: latestUnix === undefined ? undefined : changeFrom(states, latestUnix, 5 * 60),
    delta15m: latestUnix === undefined ? undefined : changeFrom(states, latestUnix, 15 * 60),
    delta30m: latestUnix === undefined ? undefined : changeFrom(states, latestUnix, 30 * 60),
    migrations: definitions.map(({ metric, label }) => {
      const points = [...(grouped.get(metric) ?? [])].sort((a, b) => a.unix - b.unix);
      const first = points[0]?.value;
      const current = points.at(-1)?.value;
      return {
        metric,
        label,
        points,
        current,
        change:
          first === undefined || current === undefined ? undefined : current - first,
      };
    }),
  };
}

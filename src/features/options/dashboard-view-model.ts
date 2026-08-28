import {
  optionProductConfig,
  type OptionDashboardExpiry,
  type OptionProduct,
  type OptionScope,
  type OptionsDashboardResponse,
  type StrikeHeatmapCell,
} from "../../api/options";

export type DashboardStatus = "fresh" | "mixed" | "stale" | "insufficient";
export type GammaRegime = "positive" | "negative" | "neutral" | "insufficient";

export interface GammaRow {
  strike: number;
  callGEX: number;
  putGEX: number;
  netGEX: number;
  grossGEX: number;
  qualityFlags: number;
}

export interface DashboardViewModel {
  source?: string;
  product: OptionProduct;
  scope: OptionScope;
  multiplier: number;
  tickSize: number;
  status: DashboardStatus;
  snapshotUnix: number;
  surfaceMinUnix: number;
  surfaceMaxUnix: number;
  spot?: number;
  regime: GammaRegime;
  netGEX?: number;
  callWall?: number;
  putWall?: number;
  gammaFlip?: number;
  keyGammaStrike?: number;
  expectedMoveUpper?: number;
  expectedMoveLower?: number;
  atmIV?: number;
  putCallOIRatio?: number;
  zeroDTEGrossGEXShare?: number;
  gammaRows: GammaRow[];
  expiries: OptionDashboardExpiry[];
  hasQualityWarnings: boolean;
}

function finiteNumber(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeRegime(value: string | null | undefined): GammaRegime {
  if (!value) return "insufficient";
  const normalized = value.toLowerCase().replace(/[\s-]+/g, "_");
  if (
    normalized.includes("positive") ||
    normalized.includes("long") ||
    normalized === "pos"
  ) {
    return "positive";
  }
  if (
    normalized.includes("negative") ||
    normalized.includes("short") ||
    normalized === "neg"
  ) {
    return "negative";
  }
  if (normalized.includes("neutral") || normalized.includes("flat")) {
    return "neutral";
  }
  return "insufficient";
}

function cellsForSelectedState(response: OptionsDashboardResponse): StrikeHeatmapCell[] {
  const state = response.market_state;
  if (!state) return [];

  return response.heatmap.cells.filter((cell) => {
    if (
      state.underlying_symbol &&
      cell.underlying_symbol.toUpperCase() !== state.underlying_symbol.toUpperCase()
    ) {
      return false;
    }
    return state.expiration <= 0 || cell.expiration === state.expiration;
  });
}

function selectVisibleGammaRows(
  cells: StrikeHeatmapCell[],
  spot: number | undefined,
): GammaRow[] {
  const byStrike = new Map<number, GammaRow>();
  for (const cell of cells) {
    const existing = byStrike.get(cell.strike);
    const grossGEX =
      finiteNumber(cell.gross_gex) ?? Math.abs(cell.call_gex) + Math.abs(cell.put_gex);
    if (existing) {
      existing.callGEX += cell.call_gex;
      existing.putGEX += cell.put_gex;
      existing.netGEX += cell.call_gex + cell.put_gex;
      existing.grossGEX += grossGEX;
      existing.qualityFlags |= cell.quality_flags;
    } else {
      byStrike.set(cell.strike, {
        strike: cell.strike,
        callGEX: cell.call_gex,
        putGEX: cell.put_gex,
        netGEX: cell.call_gex + cell.put_gex,
        grossGEX,
        qualityFlags: cell.quality_flags,
      });
    }
  }

  return [...byStrike.values()]
    .filter((cell) => Number.isFinite(cell.strike))
    .sort((a, b) => {
      if (spot === undefined) return b.strike - a.strike;
      return Math.abs(a.strike - spot) - Math.abs(b.strike - spot);
    })
    .slice(0, 11)
    .sort((a, b) => b.strike - a.strike);
}

export function buildDashboardViewModel(
  response: OptionsDashboardResponse,
  requestedScope: OptionScope,
  nowUnix = Math.floor(Date.now() / 1000),
): DashboardViewModel {
  const summary = response.summary;
  const marketAge = response.snapshot_unix
    ? nowUnix - response.snapshot_unix
    : Number.POSITIVE_INFINITY;
  const surfaceAge = response.heatmap.observed_min_unix
    ? nowUnix - response.heatmap.observed_min_unix
    : Number.POSITIVE_INFINITY;
  const mixedSurface =
    response.heatmap.observed_max_unix - response.heatmap.observed_min_unix > 300;

  let status: DashboardStatus = "fresh";
  if (!response.market_state || !summary) status = "insufficient";
  else if (marketAge > 120 || surfaceAge > 600) status = "stale";
  else if (mixedSurface) status = "mixed";

  const spot = finiteNumber(summary?.underlying_price);
  const selectedCells = cellsForSelectedState(response);
  const expiries = [...(response.expiries ?? [])].sort(
    (a, b) => a.expiration - b.expiration,
  );
  const qualityValues = [
    response.market_state?.quality_flags ?? 0,
    summary?.quality_flags ?? 0,
    ...selectedCells.map((cell) => cell.quality_flags),
    ...expiries.map((expiry) => expiry.quality_flags ?? 0),
  ];

  return {
    source: response.source,
    product: response.product,
    scope: response.scope ?? requestedScope,
    multiplier: optionProductConfig[response.product].multiplier,
    tickSize: optionProductConfig[response.product].tickSize,
    status,
    snapshotUnix: response.snapshot_unix,
    surfaceMinUnix: response.heatmap.observed_min_unix,
    surfaceMaxUnix: response.heatmap.observed_max_unix,
    spot,
    regime: normalizeRegime(summary?.regime ?? response.market_state?.regime),
    netGEX: finiteNumber(summary?.net_gex),
    callWall: finiteNumber(summary?.call_wall),
    putWall: finiteNumber(summary?.put_wall),
    gammaFlip: finiteNumber(summary?.gamma_flip),
    keyGammaStrike: finiteNumber(summary?.key_gamma_strike),
    expectedMoveUpper: finiteNumber(summary?.expected_move_upper),
    expectedMoveLower: finiteNumber(summary?.expected_move_lower),
    atmIV: finiteNumber(summary?.atm_iv),
    putCallOIRatio: finiteNumber(summary?.visible_put_call_oi_ratio),
    zeroDTEGrossGEXShare: finiteNumber(summary?.zero_dte_gross_gex_share),
    gammaRows: selectVisibleGammaRows(selectedCells, spot),
    expiries,
    hasQualityWarnings: qualityValues.some((flags) => flags !== 0),
  };
}

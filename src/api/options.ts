export type OptionProduct = "NQ" | "ES" | "GC";
export type OptionScope = "0dte" | "nearest" | "all";
export type QueryValue = string | number | boolean | undefined;

export const optionProductConfig = {
  NQ: { label: "纳指期货", multiplier: 20, tickSize: 0.25 },
  ES: { label: "标普期货", multiplier: 50, tickSize: 0.25 },
  GC: { label: "黄金期货", multiplier: 100, tickSize: 0.1 },
} as const satisfies Record<
  OptionProduct,
  { label: string; multiplier: number; tickSize: number }
>;

export interface MarketState {
  unix: number;
  expiration: number;
  underlying_symbol?: string;
  underlying_price?: number | null;
  regime?: string | null;
  net_gex?: number | null;
  gross_gex?: number | null;
  quality_flags?: number;
}

export interface DashboardSummary {
  underlying_price?: number | null;
  regime?: string | null;
  call_wall?: number | null;
  put_wall?: number | null;
  gamma_flip?: number | null;
  key_gamma_strike?: number | null;
  net_gex?: number | null;
  gross_gex?: number | null;
  expected_move_upper?: number | null;
  expected_move_lower?: number | null;
  visible_put_call_oi_ratio?: number | null;
  zero_dte_gross_gex_share?: number | null;
  atm_iv?: number | null;
  quality_flags?: number;
}

export interface StrikeHeatmapCell {
  unix: number;
  expiration: number;
  underlying_symbol: string;
  strike: number;
  call_gex: number;
  put_gex: number;
  gross_gex?: number;
  call_oi?: number;
  put_oi?: number;
  call_iv?: number | null;
  put_iv?: number | null;
  quality_flags: number;
}

export interface SurfaceLevel {
  unix: number;
  expiration?: number;
  metric?: string;
  value?: number;
  strike?: number;
  rank?: number;
  quality_flags?: number;
}

export interface OptionLevelPoint {
  unix: number;
  metric: string;
  rank?: number;
  value?: number | null;
  strike?: number | null;
  quality_flags?: number;
}

export interface OptionsLevelsResponse {
  source?: "local-demo" | string;
  product: OptionProduct;
  scope: OptionScope;
  from: number;
  to: number;
  timeframe: number;
  states: MarketState[];
  levels: OptionLevelPoint[];
}

export interface OptionDashboardExpiry {
  expiration: number;
  call_oi?: number;
  put_oi?: number;
  total_oi?: number;
  call_gex?: number;
  put_gex?: number;
  net_gex?: number;
  gross_gex: number;
  delta?: number;
  charm?: number;
  atm_iv?: number | null;
  expected_move_upper?: number | null;
  expected_move_lower?: number | null;
  quality_flags?: number;
}

export interface OptionsDashboardResponse {
  source?: "local-demo" | string;
  product: OptionProduct;
  scope?: OptionScope;
  snapshot_unix: number;
  market_state?: MarketState | null;
  summary?: DashboardSummary | null;
  levels?: SurfaceLevel[];
  expiries: OptionDashboardExpiry[];
  heatmap: {
    observed_min_unix: number;
    observed_max_unix: number;
    cells: StrikeHeatmapCell[];
    levels?: SurfaceLevel[];
  };
}

export class OptionsApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "OptionsApiError";
    this.status = status;
  }
}

function buildUrl(path: string, query: Record<string, QueryValue>): URL {
  const url = new URL(path, window.location.origin);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  return url;
}

export async function getOptionsApi<T>(
  path: string,
  query: Record<string, QueryValue>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    signal,
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new OptionsApiError(
      response.ok
        ? "接口返回了网页而不是 JSON。请确认 API 路由和登录令牌。"
        : `接口返回了非 JSON 响应（HTTP ${response.status}）。`,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new OptionsApiError("接口返回的 JSON 无法解析。", response.status);
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `请求失败（HTTP ${response.status}）。`;
    throw new OptionsApiError(message, response.status);
  }

  return body as T;
}

export function getOptionDashboard(
  product: OptionProduct,
  scope: OptionScope,
  signal?: AbortSignal,
): Promise<OptionsDashboardResponse> {
  return getOptionsApi<OptionsDashboardResponse>(
    "/api/options/dashboard",
    { product, scope, days: 20, window_pct: 0.12 },
    signal,
  );
}

export function getOptionLevels(
  product: OptionProduct,
  scope: OptionScope,
  signal?: AbortSignal,
): Promise<OptionsLevelsResponse> {
  const timeframe = 300;
  const nowUnix = Math.floor(Date.now() / 1000);
  const latestBucket = Math.floor(nowUnix / timeframe) * timeframe;
  const to = latestBucket + timeframe;
  const from = latestBucket - 60 * 60;

  return getOptionsApi<OptionsLevelsResponse>(
    "/api/options/levels",
    { product, scope, from, to, timeframe },
    signal,
  );
}

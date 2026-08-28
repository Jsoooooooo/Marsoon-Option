import type { NextRequest } from "next/server";

import type {
  OptionDashboardExpiry,
  OptionProduct,
  OptionScope,
  OptionsDashboardResponse,
  StrikeHeatmapCell,
} from "@/api/options";

interface ProductDemoConfig {
  spot: number;
  strikeStep: number;
  callWall: number;
  putWall: number;
  gammaFlip: number;
  keyGamma: number;
  expectedLower: number;
  expectedUpper: number;
  atmIV: number;
  regime: "positive_gamma" | "negative_gamma";
  netGEX: number;
}

const productData: Record<OptionProduct, ProductDemoConfig> = {
  NQ: {
    spot: 23_614.25,
    strikeStep: 50,
    callWall: 23_750,
    putWall: 23_400,
    gammaFlip: 23_470,
    keyGamma: 23_650,
    expectedLower: 23_420,
    expectedUpper: 23_780,
    atmIV: 0.184,
    regime: "positive_gamma",
    netGEX: 1.82e9,
  },
  ES: {
    spot: 6_486.5,
    strikeStep: 10,
    callWall: 6_520,
    putWall: 6_440,
    gammaFlip: 6_452,
    keyGamma: 6_500,
    expectedLower: 6_438,
    expectedUpper: 6_522,
    atmIV: 0.146,
    regime: "positive_gamma",
    netGEX: 3.14e9,
  },
  GC: {
    spot: 4_812.3,
    strikeStep: 10,
    callWall: 4_850,
    putWall: 4_780,
    gammaFlip: 4_826,
    keyGamma: 4_825,
    expectedLower: 4_766,
    expectedUpper: 4_854,
    atmIV: 0.219,
    regime: "negative_gamma",
    netGEX: -0.46e9,
  },
};

function parseProduct(value: string | null): OptionProduct {
  const candidate = value?.toUpperCase();
  return candidate === "ES" || candidate === "GC" ? candidate : "NQ";
}

function parseScope(value: string | null): OptionScope {
  return value === "nearest" || value === "all" ? value : "0dte";
}

function utcExpiry(daysFromNow: number): number {
  const date = new Date();
  return Math.floor(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + daysFromNow,
      20,
    ) / 1000,
  );
}

function buildCells(
  product: OptionProduct,
  config: ProductDemoConfig,
  expirations: number[],
  snapshotUnix: number,
): StrikeHeatmapCell[] {
  const center = Math.round(config.spot / config.strikeStep) * config.strikeStep;
  const distanceWeights = [0.24, 0.36, 0.52, 0.72, 0.9, 1, 0.84, 0.66, 0.49, 0.34, 0.22];

  return expirations.flatMap((expiration, expiryIndex) =>
    distanceWeights.map((weight, index) => {
      const offset = index - 5;
      const strike = center + offset * config.strikeStep;
      const expiryWeight = [1, 0.58, 0.34][expiryIndex] ?? 0.2;
      const callBias = 0.72 + index * 0.055;
      const putBias = 1.25 - index * 0.06;
      const callGex = 1.25e9 * weight * expiryWeight * callBias;
      const putGex = -1.02e9 * weight * expiryWeight * putBias;

      return {
        unix: snapshotUnix - expiryIndex * 24,
        expiration,
        underlying_symbol: product,
        strike,
        call_gex: callGex,
        put_gex: putGex,
        gross_gex: Math.abs(callGex) + Math.abs(putGex),
        call_oi: Math.round(8_000 * weight * expiryWeight * callBias),
        put_oi: Math.round(8_600 * weight * expiryWeight * putBias),
        call_iv: config.atmIV + Math.abs(offset) * 0.0022,
        put_iv: config.atmIV + Math.abs(offset) * 0.0028,
        quality_flags: 0,
      };
    }),
  );
}

function buildExpiries(
  config: ProductDemoConfig,
  expirations: number[],
): OptionDashboardExpiry[] {
  const shares = [1, 0.46, 0.28];
  return expirations.map((expiration, index) => {
    const weight = shares[index] ?? 0.2;
    return {
      expiration,
      call_oi: Math.round(64_000 * weight),
      put_oi: Math.round(71_000 * weight),
      total_oi: Math.round(135_000 * weight),
      call_gex: 2.35e9 * weight,
      put_gex: -1.58e9 * weight,
      net_gex: 0.77e9 * weight,
      gross_gex: 3.93e9 * weight,
      delta: 0.42e9 * weight,
      charm: -0.08e9 * weight,
      atm_iv: config.atmIV + index * 0.007,
      expected_move_lower: config.expectedLower - index * config.strikeStep * 0.6,
      expected_move_upper: config.expectedUpper + index * config.strikeStep * 0.6,
      quality_flags: 0,
    };
  });
}

export async function GET(request: NextRequest) {
  const product = parseProduct(request.nextUrl.searchParams.get("product"));
  const scope = parseScope(request.nextUrl.searchParams.get("scope"));
  const config = productData[product];
  const snapshotUnix = Math.floor(Date.now() / 1000);
  const expirations = [utcExpiry(0), utcExpiry(1), utcExpiry(7)];
  const cells = buildCells(product, config, expirations, snapshotUnix);
  const expiries = buildExpiries(config, expirations);

  const response: OptionsDashboardResponse = {
    source: "local-demo",
    product,
    scope,
    snapshot_unix: snapshotUnix,
    market_state: {
      unix: snapshotUnix,
      expiration: scope === "all" ? 0 : expirations[scope === "nearest" ? 1 : 0]!,
      underlying_symbol: product,
      underlying_price: config.spot,
      regime: config.regime,
      net_gex: config.netGEX,
      gross_gex: 3.93e9,
      quality_flags: 0,
    },
    summary: {
      underlying_price: config.spot,
      regime: config.regime,
      call_wall: config.callWall,
      put_wall: config.putWall,
      gamma_flip: config.gammaFlip,
      key_gamma_strike: config.keyGamma,
      net_gex: config.netGEX,
      gross_gex: 3.93e9,
      expected_move_upper: config.expectedUpper,
      expected_move_lower: config.expectedLower,
      visible_put_call_oi_ratio: 1.11,
      zero_dte_gross_gex_share: 0.72,
      atm_iv: config.atmIV,
      quality_flags: 0,
    },
    levels: [],
    expiries,
    heatmap: {
      observed_min_unix: snapshotUnix - 48,
      observed_max_unix: snapshotUnix,
      cells,
      levels: [],
    },
  };

  return Response.json(response, {
    headers: {
      "Cache-Control": "no-store",
      "X-Marsoon-Data-Source": "local-demo",
    },
  });
}

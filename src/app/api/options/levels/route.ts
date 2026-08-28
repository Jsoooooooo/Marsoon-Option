import type { NextRequest } from "next/server";

import type {
  MarketState,
  OptionLevelPoint,
  OptionProduct,
  OptionScope,
  OptionsLevelsResponse,
} from "@/api/options";

const productData: Record<
  OptionProduct,
  {
    spot: number;
    step: number;
    netGEX: number;
    callWall: number;
    putWall: number;
    gammaFlip: number;
    regime: "positive_gamma" | "negative_gamma";
  }
> = {
  NQ: {
    spot: 23_614.25,
    step: 50,
    netGEX: 1.82e9,
    callWall: 23_750,
    putWall: 23_400,
    gammaFlip: 23_470,
    regime: "positive_gamma",
  },
  ES: {
    spot: 6_486.5,
    step: 10,
    netGEX: 3.14e9,
    callWall: 6_520,
    putWall: 6_440,
    gammaFlip: 6_452,
    regime: "positive_gamma",
  },
  GC: {
    spot: 4_812.3,
    step: 10,
    netGEX: -0.46e9,
    callWall: 4_850,
    putWall: 4_780,
    gammaFlip: 4_826,
    regime: "negative_gamma",
  },
};

function parseProduct(value: string | null): OptionProduct {
  const candidate = value?.toUpperCase();
  return candidate === "ES" || candidate === "GC" ? candidate : "NQ";
}

function parseScope(value: string | null): OptionScope {
  return value === "nearest" || value === "all" ? value : "0dte";
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const product = parseProduct(request.nextUrl.searchParams.get("product"));
  const scope = parseScope(request.nextUrl.searchParams.get("scope"));
  const timeframe = parsePositiveInteger(request.nextUrl.searchParams.get("timeframe"), 300);
  const latestBucket = Math.floor(Date.now() / timeframe) * timeframe;
  const to = parsePositiveInteger(
    request.nextUrl.searchParams.get("to"),
    latestBucket + timeframe,
  );
  const requestedFrom = parsePositiveInteger(
    request.nextUrl.searchParams.get("from"),
    to - 60 * 60 - timeframe,
  );
  const from = Math.max(requestedFrom, to - 2 * 60 * 60);
  const config = productData[product];
  const timestamps: number[] = [];

  for (let unix = from; unix < to; unix += timeframe) timestamps.push(unix);

  const lastIndex = Math.max(1, timestamps.length - 1);
  const states: MarketState[] = timestamps.map((unix, index) => {
    const progress = index / lastIndex;
    const drift = -0.18 * (1 - progress) + Math.sin(progress * Math.PI * 3) * 0.018;
    return {
      unix,
      expiration: 0,
      underlying_symbol: product,
      underlying_price: config.spot - config.step * 0.35 * (1 - progress),
      regime: config.regime,
      net_gex: config.netGEX + Math.abs(config.netGEX) * drift,
      gross_gex: 3.93e9 * (0.96 + progress * 0.04),
      quality_flags: 0,
    };
  });

  const callOffsets = [-2, -2, -2, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0];
  const putOffsets = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const flipOffsets = [-1, -1, -1, -1, -0.5, -0.5, -0.5, 0, 0, 0, 0, 0, 0];

  const levels: OptionLevelPoint[] = timestamps.flatMap((unix, index) => {
    const sequenceIndex = Math.min(index, callOffsets.length - 1);
    return [
      {
        unix,
        metric: "call_wall",
        rank: 1,
        strike: config.callWall + config.step * callOffsets[sequenceIndex]!,
        quality_flags: 0,
      },
      {
        unix,
        metric: "gamma_flip",
        rank: 1,
        strike: config.gammaFlip + config.step * flipOffsets[sequenceIndex]!,
        quality_flags: 0,
      },
      {
        unix,
        metric: "put_wall",
        rank: 1,
        strike: config.putWall + config.step * putOffsets[sequenceIndex]!,
        quality_flags: 0,
      },
    ];
  });

  const response: OptionsLevelsResponse = {
    source: "local-demo",
    product,
    scope,
    from,
    to,
    timeframe,
    states,
    levels,
  };

  return Response.json(response, {
    headers: {
      "Cache-Control": "no-store",
      "X-Marsoon-Data-Source": "local-demo",
    },
  });
}

# 期权看板第三代：前端接口接入指南

本文档用于把 `期权看板_第三代_可拼装.html` 中的示意数据替换为正式期权接口数据。完整字段定义、错误码和 `quality_flags` 说明见 [期权数据 HTTP API](./options-data-api.md)。

本文只描述当前已经实现的接口能力，不把 HTML 中的 mock 字段当成后端契约。

## 1. 接入范围

看板只支持以下三个产品：

```ts
export type OptionProduct = "NQ" | "ES" | "GC";

export const optionProductConfig = {
  NQ: { multiplier: 20, tickSize: 0.25 },
  ES: { multiplier: 50, tickSize: 0.25 },
  GC: { multiplier: 100, tickSize: 0.10 },
} as const;
```

生产 API Base URL：

```ts
export const OPTIONS_API_BASE_URL = "https://app.marsoon.cn";
```

不要继续使用 HTML 中的 `SPX`、乘数 `100`、静态时间和静态 `FRESH` 状态。

## 2. 接口总览

| 接口 | 看板用途 | 建议调用时机 |
| --- | --- | --- |
| `GET /options/dashboard` | 首屏总览、Gamma、Positioning、Expiration、Volatility 快照 | 首次加载、产品或 scope 切换、定时刷新 |
| `GET /options/levels` | Call/Put Wall、Gamma Flip、MarketState 历史和迁移 | Intraday 面板、K 线叠加 |
| `GET /options/heatmap` | 独立多到期日 Heatmap | Heatmap 组件脱离 dashboard 单独加载时 |
| `GET /options/hedge-flow` | 实时期权成交对冲压力和累计曲线 | Hedging、Intraday |
| `GET /options/0dte-volume-profile` | 0DTE Call/Put Buy/Sell/Unknown 成交量 | Positioning、Intraday |
| `GET /options/0dte-oi-profile` | 最新 0DTE Call/Put OI | Positioning |
| `GET /options/level-events` | 接近、触碰、突破、迁移事件 | Intraday 标记、提醒列表 |
| `GET /options/level-performance` | 关键价位历史表现 | 详情弹窗或研究页面，不参与首屏轮询 |

首屏不要同时调用 `/options/dashboard` 和 `/options/heatmap`。`dashboard.heatmap` 已经包含相同用途的 `cells + levels`。

## 3. 推荐加载流程

### 3.1 首屏

```http
GET https://app.marsoon.cn/options/dashboard?product=NQ&scope=0dte&days=20&window_pct=0.12
```

推荐默认值：

```ts
const defaultOptionsQuery = {
  product: "NQ" as OptionProduct,
  scope: "0dte" as const,
  days: 20,
  window_pct: 0.12,
};
```

`/options/dashboard` 返回五组前端数据：

| 响应字段 | 用法 |
| --- | --- |
| `market_state` | 同一个一分钟桶的完整 MarketState |
| `summary` | Overview 直接使用的状态和可见窗口汇总 |
| `levels` | 与 MarketState 严格同快照的 Levels |
| `expiries` | 按到期日聚合的 OI、GEX、Delta、Charm、ATM IV |
| `heatmap` | 多到期日逐行权价 cells 和 surface levels |

### 3.2 日内模块

首屏成功后，并行加载日内数据：

```ts
const to = Math.floor(Date.now() / 1000);
const from = to - 24 * 60 * 60;
const timeframe = 300;

const [levels, hedgeFlow, volumeProfile] = await Promise.all([
  getOptionsAPI("/options/levels", {
    product,
    scope: "0dte",
    from,
    to,
    timeframe,
  }),
  getOptionsAPI("/options/hedge-flow", {
    product,
    scope: "0dte",
    from,
    to,
    timeframe,
  }),
  getOptionsAPI("/options/0dte-volume-profile", {
    product,
    from,
    to,
  }),
]);
```

OI Profile 可以与上述请求并行，也可以低频刷新：

```http
GET /options/0dte-oi-profile?product=NQ&asof=<unix秒>
```

## 4. HTML 面板与接口映射

### 4.1 `01 Overview`

| HTML 展示项 | 正式字段 | 处理方式 |
| --- | --- | --- |
| Gamma Regime | `summary.regime` | 映射为正 Gamma、负 Gamma、中性、数据不足 |
| Spot | `summary.underlying_price` | 使用期权计算快照的标的价格 |
| Call Wall | `summary.call_wall` | 缺失时不画，不使用 `0` |
| Put Wall | `summary.put_wall` | 缺失时不画 |
| Gamma Flip | `summary.gamma_flip` | 缺失或质量不足时不画 |
| Net Dealer GEX | `summary.net_gex` | UI 改名为“Net GEX（OI 模型）” |
| Expected Move | `summary.expected_move_upper/lower` | 两个字段都存在才画完整区间 |
| P/C OI | `summary.visible_put_call_oi_ratio` | 只代表当前可见 Heatmap 窗口 |
| IV | `summary.atm_iv` | 小数乘 100 后显示百分数 |
| IV Rank | 当前没有 | 显示 `--`，不要用 ATM IV 代替 |
| Max Pain | 当前没有 | 从结构条移除或显示“待后端支持” |

HTML 中的 `Net Dealer GEX` 会夸大当前模型含义。现有数据是 OI 符号约定下的 GEX，不是已经识别真实 Dealer Long/Short 的持仓数据。

### 4.2 `02 Gamma`

数据源：

```ts
dashboard.heatmap.cells
dashboard.levels
dashboard.market_state
```

建议每个行权价至少保留：

```ts
interface GammaRow {
  strike: number;
  callGEX: number;
  putGEX: number;
  netGEX: number;
  grossGEX: number;
  qualityFlags: number;
}
```

重要口径：

```ts
// 后端 put_gex 已经带负号。
const netGEX = cell.call_gex + cell.put_gex;

// 不允许：这会对 Put 再取一次反号。
// const wrong = cell.call_gex - cell.put_gex;
```

如果 Overview 使用 `scope=0dte` 或 `nearest`，Gamma 主图必须过滤到 `market_state.expiration`，不能直接把 `heatmap.cells` 中未来所有到期日混合起来。

```ts
function cellsForSelectedState(response: OptionDashboardResponse) {
  const state = response.market_state;
  if (!state) return [];

  return response.heatmap.cells.filter((cell) => {
    if (
      state.underlying_symbol &&
      cell.underlying_symbol.toUpperCase() !==
        state.underlying_symbol.toUpperCase()
    ) {
      return false;
    }
    return state.expiration <= 0 || cell.expiration === state.expiration;
  });
}
```

关键线直接使用 `summary.call_wall`、`summary.put_wall`、`summary.gamma_flip`。`key_gamma_strike` 对应现有模型的 Gross GEX 峰值，比 HTML 中含义不明确的 `Max Γ` 更适合作为正式名称。

### 4.3 `03 Positioning`

当前可实现：

- Call/Put OI 蝴蝶图：使用 `/options/0dte-oi-profile` 的 `rows`。
- 多到期日 OI：使用 `dashboard.heatmap.cells`，按 `expiration + strike` 展示。
- P/C OI 比：使用 `summary.visible_put_call_oi_ratio`，或按目标 cell 自行求和。
- Call/Put 成交量：使用 `/options/0dte-volume-profile`。
- Buy/Sell/Unknown 拆分：使用六个 `*_contracts` 字段。

当前不能实现：

- `ΔOI`：接口只有 OI 快照，没有“今日 OI - 上一交易日 OI”的正式序列。
- “下方 Put 相对厚重”等结论：可以由前端确定性描述当前分布，但不能直接升级为方向预测。

成交量合计必须包含 Unknown：

```ts
const callVolume =
  row.call_buy_contracts +
  row.call_sell_contracts +
  row.call_unknown_contracts;

const putVolume =
  row.put_buy_contracts +
  row.put_sell_contracts +
  row.put_unknown_contracts;
```

Unknown 只是不参与方向 Delta，不代表没有发生这笔成交。

### 4.4 `04 Hedging`

该模块需要区分两种完全不同的数据：

| 数据 | 接口字段 | 含义 |
| --- | --- | --- |
| 库存 GEX | `MarketState.net_gex` | 标的变动 1% 时的模型 Gamma 名义敞口 |
| 成交 Hedge Flow | `/options/hedge-flow.series` | 期权成交推导的 Delta Notional 压力及交易日累计值 |

不要把库存 GEX 曲线命名成“真实成交对冲流”。

HTML 中的 `Δ30m / Δ1H` 可以基于 `/options/levels.states` 的 `net_gex` 做确定性差分：

```ts
function changeFrom(
  states: MarketState[],
  latestUnix: number,
  seconds: number,
): number | undefined {
  const latest = states.find((state) => state.unix === latestUnix);
  const previous = [...states]
    .reverse()
    .find((state) => state.unix <= latestUnix - seconds);
  if (!latest || !previous) return undefined;
  return latest.net_gex - previous.net_gex;
}
```

真实日内流量图优先画：

```ts
series[].net_delta_notional
series[].cumulative_net_delta_notional
series[].call_delta_notional
series[].put_delta_notional
```

HTML 的“买约 +3.4 亿美元 / 1%↑”不能直接由当前接口确定。可以展示 `net_gex`，但标签应写成“模型 Net GEX / 1%”，不要承诺未来实际买卖金额。

### 4.5 `05 Expiration`

直接使用 `dashboard.expiries`。

```ts
const dominantExpiry = dashboard.expiries.reduce<
  OptionDashboardExpiry | undefined
>((best, item) => {
  if (!best || item.gross_gex > best.gross_gex) return item;
  return best;
}, undefined);
```

可展示字段：

- 主导到期日：`gross_gex` 最大的 expiry。
- 每个到期日 Call/Put/Total OI。
- 每个到期日 Net/Gross GEX。
- 每个到期日 ATM IV 和 Expected Move。
- `summary.zero_dte_gross_gex_share`：0DTE Gross GEX 占比。
- Expiry × Strike Heatmap：按 `heatmap.cells` 分组。

当前没有 Max Pain，因此也不能声称存在基于 Max Pain 的 Pinning 信号。可以显示 Key Gamma Strike、Call/Put Wall 与现价距离，但命名必须与实际字段一致。

### 4.6 `06 Intraday`

建议组合：

- 标的价格：复用主图的 NQ/ES/GC 实时行情，不重新从期权 cell 拼 K 线。
- Wall Migration：`/options/levels.levels`，按 `unix + metric + rank` 连线。
- Gamma Regime：`/options/levels.states`。
- 成交对冲压力：`/options/hedge-flow.series`。
- 0DTE 成交气泡：`/options/0dte-volume-profile.rows`。
- 价位事件：`/options/level-events.events`。

如果需要历史 0DTE 集中度曲线，应分别请求同区间的 `scope=0dte` 和 `scope=all` MarketState，然后只在 `unix + underlying_symbol` 一致时计算：

```ts
const share = zeroState.gross_gex / allState.gross_gex;
```

分母无效、时间不一致或结果超过合理范围时，应产生缺口，不要使用上一分钟值填充。

### 4.7 `07 波动率`

当前可以接两张图：

1. IV Smile：使用同一 `expiration` 下的 `call_iv / put_iv by strike`。
2. ATM IV Term Structure：使用 `dashboard.expiries[].atm_iv by expiration`。

```ts
const smile = cellsForSelectedState(dashboard)
  .filter((cell) => cell.call_iv !== undefined || cell.put_iv !== undefined)
  .map((cell) => ({
    strike: cell.strike,
    callIV: cell.call_iv,
    putIV: cell.put_iv,
  }));

const termStructure = dashboard.expiries
  .filter((item) => item.atm_iv !== undefined)
  .map((item) => ({
    expiration: item.expiration,
    atmIV: item.atm_iv!,
  }));
```

当前不可作为正式指标展示：

- IV Rank / IV Percentile
- 25Δ Risk Reversal
- Skew Rank
- 固定行权价历史 IV Matrix
- Volatility Risk Premium（VRP）

`call_iv - put_iv` 只能作为同一行权价的即时差值，不能命名为标准 25Δ Skew。

### 4.8 `术语速查` 与 `GEX 公式面板`

这两个模块可以继续使用静态内容，但必须修改两点：

1. `Net Dealer GEX` 改成 `Net GEX（OI 模型）`。
2. 公式中的固定乘数 `100` 改为当前产品乘数。

```text
美元 Gamma = OI × Gamma × S² × 0.01 × contract_multiplier

NQ multiplier = 20
ES multiplier = 50
GC multiplier = 100
```

正式 GEX 已由后端计算，前端应直接使用响应值。公式面板用于解释，不应成为另一套重复计算源。

## 5. 前端请求封装

```ts
type QueryValue = string | number | boolean | undefined;

async function getOptionsAPI<T>(
  path: string,
  query: Record<string, QueryValue>,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<T> {
  const url = new URL(path, OPTIONS_API_BASE_URL);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    signal,
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
  return body as T;
}
```

Dashboard 请求：

```ts
function getOptionDashboard(
  product: OptionProduct,
  scope: "0dte" | "nearest" | "all",
  signal?: AbortSignal,
) {
  return getOptionsAPI<OptionDashboardResponse>(
    "/options/dashboard",
    {
      product,
      scope,
      days: 20,
      window_pct: 0.12,
    },
    signal,
  );
}
```

产品或 scope 切换时必须取消旧请求，避免旧响应覆盖新面板：

```ts
let dashboardController: AbortController | undefined;

async function reloadDashboard(product: OptionProduct, scope: OptionQueryScope) {
  dashboardController?.abort();
  dashboardController = new AbortController();

  return getOptionDashboard(product, scope, dashboardController.signal);
}
```

## 6. 首屏 ViewModel 适配

建议先把 API 转成稳定 ViewModel，再交给 HTML 中的各图表组件。不要让每个组件自行解释原始字段。

```ts
interface OptionsDashboardViewModel {
  product: OptionProduct;
  multiplier: number;
  status: "fresh" | "mixed" | "stale" | "insufficient";
  snapshotUnix: number;
  surfaceMinUnix: number;
  surfaceMaxUnix: number;
  spot?: number;
  regime?: OptionRegime;
  netGEX?: number;
  callWall?: number;
  putWall?: number;
  gammaFlip?: number;
  keyGammaStrike?: number;
  expectedMoveUpper?: number;
  expectedMoveLower?: number;
  atmIV?: number;
  ivRank?: number;
  maxPain?: number;
  putCallOIRatio?: number;
  zeroDTEGrossGEXShare?: number;
  selectedCells: StrikeHeatmapCell[];
  expiries: OptionDashboardExpiry[];
}

function buildDashboardViewModel(
  response: OptionDashboardResponse,
  nowUnix = Math.floor(Date.now() / 1000),
): OptionsDashboardViewModel {
  const summary = response.summary;
  const marketAge = response.snapshot_unix
    ? nowUnix - response.snapshot_unix
    : Number.POSITIVE_INFINITY;
  const surfaceAge = response.heatmap.observed_min_unix
    ? nowUnix - response.heatmap.observed_min_unix
    : Number.POSITIVE_INFINITY;
  const mixedSurface =
    response.heatmap.observed_max_unix -
      response.heatmap.observed_min_unix >
    300;

  let status: OptionsDashboardViewModel["status"] = "fresh";
  if (!response.market_state || !summary) status = "insufficient";
  else if (marketAge > 120 || surfaceAge > 600) status = "stale";
  else if (mixedSurface) status = "mixed";

  return {
    product: response.product,
    multiplier: optionProductConfig[response.product].multiplier,
    status,
    snapshotUnix: response.snapshot_unix,
    surfaceMinUnix: response.heatmap.observed_min_unix,
    surfaceMaxUnix: response.heatmap.observed_max_unix,
    spot: summary?.underlying_price,
    regime: summary?.regime,
    netGEX: summary?.net_gex,
    callWall: summary?.call_wall,
    putWall: summary?.put_wall,
    gammaFlip: summary?.gamma_flip,
    keyGammaStrike: summary?.key_gamma_strike,
    expectedMoveUpper: summary?.expected_move_upper,
    expectedMoveLower: summary?.expected_move_lower,
    atmIV: summary?.atm_iv,
    // 当前后端没有正式值，必须保持 undefined。
    ivRank: undefined,
    maxPain: undefined,
    putCallOIRatio: summary?.visible_put_call_oi_ratio,
    zeroDTEGrossGEXShare: summary?.zero_dte_gross_gex_share,
    selectedCells: cellsForSelectedState(response),
    expiries: response.expiries,
  };
}
```

`FRESH` 不能硬编码。上面的 120 秒和 600 秒是建议 UI 阈值，实际可以按部署的分钟快照和全表面刷新周期配置。

## 7. 刷新和缓存建议

| 数据 | 建议刷新 |
| --- | --- |
| `/options/dashboard` | 60 秒；页面回到前台时立即刷新 |
| `/options/levels` | 60 秒或随主图 timeframe 更新 |
| `/options/hedge-flow` | 60 秒 |
| `/options/0dte-volume-profile` | 60 秒，只增量合并 `[from,to)` 内新分钟 |
| `/options/0dte-oi-profile` | 5 分钟；OI 不可跨分钟累加 |
| `/options/level-events` | 60 秒或用户打开事件层时请求 |
| `/options/level-performance` | 用户打开详情时请求并长缓存 |

缓存键必须包含接口路径和全部查询参数，至少包括 `product`、`scope`、`asof/from/to`、`timeframe`、`days`、`window_pct`。

后台标签页可以停止高频轮询；恢复前台后废弃旧请求并重新获取最新快照。

## 8. 空值、质量和一致性

- `market_state` 或 `summary` 缺失：Overview 显示“数据不足”，不要显示全零。
- `call_wall`、`put_wall`、`gamma_flip` 缺失：对应图形不画，不使用价格 `0`。
- `quality_flags != 0`：按主 API 文档中的位掩码决定降级方式。
- `heatmap.cells[].unix` 可能不同：Heatmap 是逐行权价最新投影，不是原子快照。
- 顶层 `levels` 与 `market_state` 是严格同桶数据，适合 Overview。
- `heatmap.levels` 是逐到期日 surface levels，适合 Expiration 面板。
- `gross_*` 是绝对值总和；`net_*` 有方向符号。
- IV 是小数，`0.142` 显示为 `14.2%`。
- `from/to` 按 `[from,to)`；Unix 时间单位始终是秒。

## 9. HTML mock 字段处理清单

| HTML mock 内容 | 接入动作 |
| --- | --- |
| `SPX` | 替换为产品选择器 `NQ/ES/GC` |
| 固定乘数 `100` | 使用产品配置 20/50/100 |
| 静态 `FRESH` | 根据 snapshot 和 surface 时间计算 |
| `Net Dealer GEX` | 改名为 `Net GEX（OI 模型）` |
| 固定 `Long Gamma` | 使用 `summary.regime` |
| 固定 Wall/Flip | 使用可选字段，缺失不画 |
| `Max Pain` | 当前不接，显示 `--` 或移除 |
| `IV Rank` | 当前不接，显示 `--` |
| `ΔOI` | 当前不接，不能用 Volume 代替 |
| “预估对冲买卖金额” | 改成 Net GEX 或 Hedge Flow 的准确标签 |
| Volatility Smile | 接 `call_iv/put_iv by strike` |
| ATM IV Term Structure | 接 `expiries[].atm_iv` |
| 标准 Skew / VRP | 当前不接，不由前端临时发明公式 |
| Pinning | 无 Max Pain 支撑，暂不输出结论 |

## 10. 前端验收标准

- 切换 NQ、ES、GC 后，不会残留上一产品的数据。
- 切换 `0dte/nearest/all` 后，Gamma 主图使用对应 MarketState 的 expiration。
- 页面不再出现 SPX 和固定乘数 100。
- Put GEX 不会被重复反号。
- Unknown 成交量不会丢失，也不会进入方向 Delta。
- 缺失 Gamma Flip、IV、Wall 时不会画到价格 0。
- MarketState 与 Heatmap 分别显示数据时间。
- Max Pain、IV Rank、ΔOI、VRP 等未实现字段不会用 mock 数字上线。
- API 错误、空数组、质量不足和旧数据都有明确 UI 状态。
- 图表组件只消费 ViewModel，不各自维护一套指标口径。

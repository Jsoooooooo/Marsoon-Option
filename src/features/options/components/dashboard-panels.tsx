import { AlertTriangle } from "lucide-react";

import {
  daysToExpiry,
  formatDistance,
  formatExpiry,
  formatInteger,
  formatNotional,
  formatPercent,
  formatPrice,
  formatSignedPrice,
} from "@/lib/formatters";
import type { DashboardViewModel, GammaRegime } from "../dashboard-view-model";
import type { LevelsViewModel, MigrationSeries } from "../levels-view-model";
import { MetricCard, Panel } from "./dashboard-ui";

const regimeLabels: Record<GammaRegime, string> = {
  positive: "正 Gamma",
  negative: "负 Gamma",
  neutral: "中性",
  insufficient: "数据不足",
};

function GammaProfile({ viewModel }: { viewModel: DashboardViewModel }) {
  const maxExposure = Math.max(
    1,
    ...viewModel.gammaRows.flatMap((row) => [Math.abs(row.putGEX), Math.abs(row.callGEX)]),
  );

  return (
    <Panel
      title="Gamma 执行价分布"
      subtitle="PUT GEX ← STRIKE → CALL GEX"
      action={
        <span className="font-mono text-[9px] text-[var(--ms-text-secondary)]">
          {viewModel.scope.toUpperCase()} · {viewModel.gammaRows.length} STRIKES
        </span>
      }
      className="min-h-[470px]"
    >
      {viewModel.gammaRows.length === 0 ? (
        <div className="grid min-h-[420px] place-items-center px-4 text-center text-sm text-[var(--ms-text-secondary)]">
          当前快照没有与 MarketState 到期日匹配的执行价数据
        </div>
      ) : (
        <div className="bg-[var(--ms-plot-bg)] px-3 py-4">
          <div className="mb-2 grid grid-cols-[1fr_74px_1fr] font-mono text-[8px] tracking-[0.12em] text-[var(--ms-text-tertiary)]">
            <span className="text-right">PUT GEX</span>
            <span className="text-center">STRIKE</span>
            <span>CALL GEX</span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-[var(--ms-axis)] opacity-50" />
            {viewModel.gammaRows.map((row) => {
              const putWidth = `${(Math.abs(row.putGEX) / maxExposure) * 100}%`;
              const callWidth = `${(Math.abs(row.callGEX) / maxExposure) * 100}%`;
              const isSpotRow =
                viewModel.spot !== undefined &&
                Math.abs(row.strike - viewModel.spot) <= viewModel.tickSize * 2;

              return (
                <div
                  key={row.strike}
                  className={`grid h-9 grid-cols-[1fr_74px_1fr] items-center border-t border-[var(--ms-grid)] first:border-t-0 ${
                    isSpotRow ? "bg-[var(--ms-brand-dim)]" : ""
                  }`}
                  title={`Net GEX ${formatNotional(row.netGEX)}${row.qualityFlags ? ` · quality_flags=${row.qualityFlags}` : ""}`}
                >
                  <div className="flex h-3 justify-end pr-2">
                    <div className="h-full bg-[var(--ms-chart-sell)]" style={{ width: putWidth }} />
                  </div>
                  <div className="relative z-10 bg-[var(--ms-panel-bg)] text-center font-mono text-[10px] tabular-nums text-[var(--ms-text-primary)]">
                    {formatPrice(row.strike, viewModel.tickSize)}
                  </div>
                  <div className="h-3 pl-2">
                    <div className="h-full bg-[var(--ms-chart-buy)]" style={{ width: callWidth }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--ms-separator)] pt-3 font-mono text-[8px] text-[var(--ms-text-tertiary)]">
            <span>PUT GEX 已使用后端负号</span>
            <span>NET = CALL + PUT</span>
          </div>
        </div>
      )}
    </Panel>
  );
}

function KeyLevels({ viewModel }: { viewModel: DashboardViewModel }) {
  const levels = [
    { label: "Call Wall", value: viewModel.callWall, tone: "text-[var(--ms-success)]" },
    { label: "Key Gamma", value: viewModel.keyGammaStrike, tone: "text-[var(--ms-key-gamma)]" },
    { label: "Snapshot Spot", value: viewModel.spot, tone: "text-[var(--ms-brand)]" },
    { label: "Gamma Flip", value: viewModel.gammaFlip, tone: "text-[var(--ms-brand)]" },
    { label: "Put Wall", value: viewModel.putWall, tone: "text-[var(--ms-danger)]" },
  ].filter((level) => level.value !== undefined);

  return (
    <Panel title="关键价位" subtitle="STRICT SNAPSHOT">
      <div className="px-3 py-1">
        {levels.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--ms-text-secondary)]">当前快照没有可用关键价位</p>
        ) : (
          levels.map((level) => (
            <div
              key={level.label}
              className="grid min-h-11 grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--ms-grid)] text-xs last:border-b-0"
            >
              <span className="text-[var(--ms-text-secondary)]">{level.label}</span>
              <span className={`font-mono tabular-nums ${level.tone}`}>
                {formatPrice(level.value, viewModel.tickSize)}
              </span>
              <span className="w-14 text-right font-mono text-[9px] text-[var(--ms-text-tertiary)]">
                {level.label === "Snapshot Spot"
                  ? "--"
                  : formatDistance(level.value, viewModel.spot)}
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function IntradayGexChanges({
  levelsViewModel,
  loading,
  error,
}: {
  levelsViewModel?: LevelsViewModel;
  loading: boolean;
  error: boolean;
}) {
  const changes = [
    { label: "Δ5m", value: levelsViewModel?.delta5m },
    { label: "Δ15m", value: levelsViewModel?.delta15m },
    { label: "Δ30m", value: levelsViewModel?.delta30m },
  ];

  return (
    <section className="ms-panel grid md:grid-cols-[minmax(180px,.8fr)_repeat(3,minmax(0,1fr))]">
      <div className="flex min-h-16 flex-col justify-center border-b border-[var(--ms-separator)] px-3 md:border-r md:border-b-0">
        <span className="text-xs font-medium text-[var(--ms-text-primary)]">Net GEX 日内变化</span>
        <span className="mt-1 font-mono text-[8px] tracking-[0.1em] text-[var(--ms-text-tertiary)]">
          /OPTIONS/LEVELS.STATES
        </span>
      </div>
      {changes.map((item) => {
        const tone =
          (item.value ?? 0) > 0
            ? "text-[var(--ms-buy)]"
            : (item.value ?? 0) < 0
              ? "text-[var(--ms-sell)]"
              : "text-[var(--ms-text-primary)]";
        return (
          <div
            key={item.label}
            className="flex min-h-16 items-center justify-between border-b border-[var(--ms-separator)] px-3 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
          >
            <span className="font-mono text-[9px] text-[var(--ms-text-secondary)]">{item.label}</span>
            <span className={`font-mono text-sm tabular-nums ${tone}`}>
              {loading ? "LOADING" : error ? "--" : formatNotional(item.value)}
            </span>
          </div>
        );
      })}
    </section>
  );
}

function Sparkline({ series, tickSize }: { series: MigrationSeries; tickSize: number }) {
  const width = 190;
  const height = 42;
  const values = series.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(tickSize, max - min);
  const x = (index: number) =>
    series.points.length <= 1 ? width / 2 : (index / (series.points.length - 1)) * width;
  const y = (value: number) => 5 + ((max - value) / span) * (height - 10);
  const path = series.points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`)
    .join(" ");
  const stroke =
    series.metric === "call_wall"
      ? "#2bd576"
      : series.metric === "put_wall"
        ? "#ff4d5e"
        : "#ffd21e";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full"
      role="img"
      aria-label={`${series.label} 最近一小时迁移`}
    >
      <title>{series.label} 最近一小时迁移</title>
      <line x1="0" y1={height - 5} x2={width} y2={height - 5} stroke="#303034" />
      {series.points.length > 1 ? (
        <>
          <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" />
          <circle
            cx={x(series.points.length - 1)}
            cy={y(series.points.at(-1)!.value)}
            r="2.5"
            fill={stroke}
          />
        </>
      ) : null}
    </svg>
  );
}

function LevelMigration({
  levelsViewModel,
  tickSize,
  loading,
  error,
}: {
  levelsViewModel?: LevelsViewModel;
  tickSize: number;
  loading: boolean;
  error: boolean;
}) {
  return (
    <Panel title="关键价位迁移" subtitle="LOOKBACK · 60M">
      <div className="divide-y divide-[var(--ms-grid)] px-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[72px] animate-pulse bg-[var(--ms-card-bg)]" />
          ))
        ) : error || !levelsViewModel ? (
          <p className="py-8 text-center text-xs text-[var(--ms-text-secondary)]">Levels 历史暂不可用</p>
        ) : (
          levelsViewModel.migrations.map((series) => (
            <div key={series.metric} className="grid grid-cols-[88px_1fr] items-center gap-2 py-2">
              <div>
                <p className="text-[10px] text-[var(--ms-text-secondary)]">{series.label}</p>
                <p className="mt-1 font-mono text-[10px] tabular-nums text-[var(--ms-text-primary)]">
                  {formatPrice(series.current, tickSize)}
                </p>
                <p
                  className={`mt-1 font-mono text-[8px] tabular-nums ${
                    (series.change ?? 0) > 0
                      ? "text-[var(--ms-buy)]"
                      : (series.change ?? 0) < 0
                        ? "text-[var(--ms-sell)]"
                        : "text-[var(--ms-text-tertiary)]"
                  }`}
                >
                  60m {formatSignedPrice(series.change, tickSize)}
                </p>
              </div>
              <Sparkline series={series} tickSize={tickSize} />
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function ExpiryTable({ viewModel }: { viewModel: DashboardViewModel }) {
  const totalGross = viewModel.expiries.reduce(
    (sum, expiry) => sum + Math.abs(expiry.gross_gex || 0),
    0,
  );

  return (
    <Panel title="到期结构" subtitle="EXPIRY SNAPSHOT">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--ms-text-tertiary)]">
            <tr className="border-b border-[var(--ms-separator)]">
              <th className="px-3 py-2 font-normal">到期日</th>
              <th className="px-3 py-2 text-right font-normal">DTE</th>
              <th className="px-3 py-2 text-right font-normal">Total OI</th>
              <th className="px-3 py-2 text-right font-normal">Net GEX</th>
              <th className="px-3 py-2 text-right font-normal">Gross GEX</th>
              <th className="px-3 py-2 text-right font-normal">贡献占比</th>
              <th className="px-3 py-2 text-right font-normal">ATM IV</th>
            </tr>
          </thead>
          <tbody>
            {viewModel.expiries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--ms-text-secondary)]">
                  当前快照没有到期日聚合数据
                </td>
              </tr>
            ) : (
              viewModel.expiries.slice(0, 8).map((expiry) => (
                <tr key={expiry.expiration} className="border-b border-[var(--ms-grid)] last:border-b-0">
                  <td className="px-3 py-3 font-mono text-[var(--ms-text-primary)]">
                    {formatExpiry(expiry.expiration)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--ms-text-secondary)]">
                    {daysToExpiry(expiry.expiration)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--ms-text-secondary)]">
                    {formatInteger(expiry.total_oi)}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-mono ${
                      (expiry.net_gex ?? 0) < 0 ? "text-[var(--ms-sell)]" : "text-[var(--ms-buy)]"
                    }`}
                  >
                    {formatNotional(expiry.net_gex)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--ms-text-secondary)]">
                    {formatNotional(expiry.gross_gex)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--ms-text-secondary)]">
                    {totalGross > 0
                      ? formatPercent(Math.abs(expiry.gross_gex) / totalGross)
                      : "--"}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--ms-text-secondary)]">
                    {formatPercent(expiry.atm_iv ?? undefined)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function DashboardContent({
  viewModel,
  levelsViewModel,
  levelsLoading,
  levelsError,
}: {
  viewModel: DashboardViewModel;
  levelsViewModel?: LevelsViewModel;
  levelsLoading: boolean;
  levelsError: boolean;
}) {
  const regimeTone =
    viewModel.regime === "positive"
      ? "positive"
      : viewModel.regime === "negative"
        ? "negative"
        : viewModel.regime === "neutral"
          ? "warning"
          : "default";

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[var(--ms-separator)] bg-[var(--ms-separator)] shadow-[0_2px_12px_rgb(0_0_0_/_24%)] xl:grid-cols-4">
        <MetricCard
          label="Gamma 状态"
          meta={viewModel.scope.toUpperCase()}
          value={regimeLabels[viewModel.regime]}
          tone={regimeTone}
        />
        <MetricCard
          label="Net GEX（OI 模型）"
          meta="S / 1%"
          value={formatNotional(viewModel.netGEX)}
          tone={(viewModel.netGEX ?? 0) < 0 ? "negative" : "positive"}
        />
        <MetricCard
          label="Gamma Flip"
          meta={formatDistance(viewModel.gammaFlip, viewModel.spot)}
          value={formatPrice(viewModel.gammaFlip, viewModel.tickSize)}
        />
        <MetricCard
          label="Expected Move"
          meta="RANGE"
          value={
            viewModel.expectedMoveLower !== undefined &&
            viewModel.expectedMoveUpper !== undefined
              ? `${formatPrice(viewModel.expectedMoveLower, viewModel.tickSize)}–${formatPrice(
                  viewModel.expectedMoveUpper,
                  viewModel.tickSize,
                )}`
              : "--"
          }
        />
      </section>

      <IntradayGexChanges
        levelsViewModel={levelsViewModel}
        loading={levelsLoading}
        error={levelsError}
      />

      {viewModel.status === "insufficient" ? (
        <div className="rounded-[10px] border border-[var(--ms-danger)] bg-[var(--ms-panel-bg)] px-4 py-3 text-sm text-[var(--ms-sell-bright)]">
          MarketState 或 Summary 缺失；页面不会把缺失值降级成 0。
        </div>
      ) : null}

      {viewModel.hasQualityWarnings ? (
        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--ms-brand)] bg-[var(--ms-brand-dim)] px-3 py-2 text-xs text-[var(--ms-brand)]">
          <AlertTriangle size={14} strokeWidth={1.5} />
          当前响应包含 quality_flags；原始标记会保留，位含义需按主 API 文档解释。
        </div>
      ) : null}

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(270px,.72fr)]">
        <GammaProfile viewModel={viewModel} />
        <div className="space-y-3">
          <KeyLevels viewModel={viewModel} />
          <LevelMigration
            levelsViewModel={levelsViewModel}
            tickSize={viewModel.tickSize}
            loading={levelsLoading}
            error={levelsError}
          />
        </div>
      </div>

      <ExpiryTable viewModel={viewModel} />
    </div>
  );
}

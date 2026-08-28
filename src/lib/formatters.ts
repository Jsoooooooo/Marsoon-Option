export function fractionDigits(tickSize: number): number {
  const text = String(tickSize);
  return text.includes(".") ? text.split(".")[1]?.length ?? 0 : 0;
}

export function formatPrice(value: number | undefined, tickSize = 0.25): string {
  if (value === undefined) return "--";
  const digits = fractionDigits(tickSize);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatSignedPrice(value: number | undefined, tickSize = 0.25): string {
  if (value === undefined) return "--";
  const formatted = formatPrice(value, tickSize);
  return value > 0 ? `+${formatted}` : formatted;
}

export function formatNotional(value: number | undefined): string {
  if (value === undefined) return "--";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const absolute = Math.abs(value);
  const units = [
    { threshold: 1e12, suffix: "T" },
    { threshold: 1e9, suffix: "B" },
    { threshold: 1e6, suffix: "M" },
    { threshold: 1e3, suffix: "K" },
  ];
  const unit = units.find((item) => absolute >= item.threshold);
  if (!unit) return `${sign}$${absolute.toFixed(0)}`;
  return `${sign}$${(absolute / unit.threshold).toFixed(2)}${unit.suffix}`;
}

export function formatInteger(value: number | undefined): string {
  if (value === undefined) return "--";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(
  value: number | undefined,
  options: { signed?: boolean; inputIsRatio?: boolean } = {},
): string {
  if (value === undefined) return "--";
  const normalized = options.inputIsRatio === false ? value : value * 100;
  const sign = options.signed && normalized > 0 ? "+" : "";
  return `${sign}${normalized.toFixed(1)}%`;
}

export function formatDistance(level: number | undefined, spot: number | undefined): string {
  if (level === undefined || spot === undefined || spot === 0) return "--";
  return formatPercent((level - spot) / spot, { signed: true });
}

export function formatSnapshotTime(unix: number | undefined): string {
  if (!unix) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(unix * 1000));
}

export function formatExpiry(unix: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(unix * 1000));
}

export function daysToExpiry(unix: number, nowUnix = Date.now() / 1000): number {
  const expiry = new Date(unix * 1000);
  const now = new Date(nowUnix * 1000);
  const expiryDay = Date.UTC(
    expiry.getUTCFullYear(),
    expiry.getUTCMonth(),
    expiry.getUTCDate(),
  );
  const currentDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((expiryDay - currentDay) / 86_400_000));
}

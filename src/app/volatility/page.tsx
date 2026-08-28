import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/SectionPlaceholder";

export const metadata: Metadata = { title: "波动率" };

export default function VolatilityPage() {
  return (
    <SectionPlaceholder
      code="05"
      title="波动率"
      endpoint="dashboard.heatmap.cells + dashboard.expiries"
      description="路由和页面容器已经完成。当前只规划 IV Smile 与 ATM IV Term Structure，不展示尚未实现的 IV Rank、Skew Rank 或 VRP。"
    />
  );
}

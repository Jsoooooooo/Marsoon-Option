import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/SectionPlaceholder";

export const metadata: Metadata = { title: "Gamma 地图" };

export default function GammaPage() {
  return (
    <SectionPlaceholder
      code="02"
      title="Gamma 地图"
      endpoint="GET /options/heatmap"
      description="路由和页面容器已经完成。下一步会在这里放置独立多到期日 Heatmap、执行价筛选和 Surface 数据时间。"
    />
  );
}

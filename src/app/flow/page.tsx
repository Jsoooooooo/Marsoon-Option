import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/SectionPlaceholder";

export const metadata: Metadata = { title: "资金流" };

export default function FlowPage() {
  return (
    <SectionPlaceholder
      code="04"
      title="资金流"
      endpoint="GET /options/hedge-flow + /options/levels"
      description="路由和页面容器已经完成。这里将区分成交 Hedge Flow 与 OI 模型库存 GEX，避免混淆真实流量和模型敞口。"
    />
  );
}

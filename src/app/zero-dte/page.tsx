import type { Metadata } from "next";

import { SectionPlaceholder } from "@/components/SectionPlaceholder";

export const metadata: Metadata = { title: "0DTE" };

export default function ZeroDtePage() {
  return (
    <SectionPlaceholder
      code="03"
      title="0DTE"
      endpoint="GET /options/0dte-volume-profile + /options/0dte-oi-profile"
      description="路由和页面容器已经完成。这里将展示 Call/Put Buy、Sell、Unknown 成交量以及最新 OI 快照。"
    />
  );
}

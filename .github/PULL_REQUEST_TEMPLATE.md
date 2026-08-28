## 改动说明

<!-- 用 2-5 句话说明这个 PR 做了什么，以及为什么需要它。 -->

## 模块

- [ ] Dashboard / 今日概览
- [ ] Gamma 地图
- [ ] 0DTE
- [ ] 资金流
- [ ] 波动率
- [ ] 共享 API / ViewModel / Query
- [ ] 主题 / 公共组件
- [ ] 文档 / CI / 仓库配置

## 修改范围

<!-- 列出主要修改目录，并说明是否改动共享文件。 -->

- 主要目录：
- 共享文件：无 / 有（请列出）
- 是否新增依赖：否 / 是（请说明原因）

## 数据接口与口径

- 接口：
- 查询参数：
- 使用字段：
- 空值处理：
- `quality_flags` 处理：

请确认：

- [ ] `put_gex` 使用 `call_gex + put_gex`，没有重复反号
- [ ] Unknown Volume 计入总量，但没有进入方向 Delta
- [ ] OI 没有跨分钟累加
- [ ] 缺失值没有绘制成价格 `0`
- [ ] 没有伪造 IV Rank、Max Pain、ΔOI、25Δ Skew、VRP 或 Pinning
- [ ] Demo 数据明确标注为 Demo，没有描述为生产行情

## UI 与交互

- [ ] 复用 `src/app/globals.css` 的 `--ms-*` 主题变量
- [ ] 没有引入新的近似品牌色、买卖色或状态色
- [ ] Product / Scope 切换不会残留旧响应
- [ ] Loading、Empty、Error、Stale 状态已处理
- [ ] 桌面布局已检查
- [ ] 360px 移动端无横向溢出
- [ ] 浏览器控制台无 React / Next.js 错误

## 截图

<!-- UI 改动必须提供桌面截图；涉及响应式时再提供移动端截图。 -->

### Desktop

<!-- 在这里拖入截图 -->

### Mobile

<!-- 在这里拖入截图 -->

## 验证

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] 手动打开目标路由验证

## 风险与后续工作

<!-- 说明当前未完成、依赖后端或需要后续 PR 处理的内容。没有则填写“无”。 -->

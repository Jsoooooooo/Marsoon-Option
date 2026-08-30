# Marsoon 期权教学系列（开源课件）

> 出品：Marsoon-Option 团队
> 仓库：[Jsoooooooo/Marsoon-Option](https://github.com/Jsoooooooo/Marsoon-Option)
> 目标读者：零基础小白（不懂期权、不写代码，第一次打开看板也能看懂）

本目录是 Marsoon-Option 框架配套的开源教学课件：**不用公式，看懂机构的钱堆在哪**。每份课件都是「单文件交互式幕布」——双击即开、零依赖、无 CDN、无需构建，适合直接发给新人或放进公司内网。

---

## 一、先看哪两个文件（核心课件）

| 文件 | 内容 | 时长 |
| --- | --- | --- |
| [期权看板速成课_面板01_整体框架_交互教学.html](./期权看板速成课_面板01_整体框架_交互教学.html) | 面板 01 Overview：Gamma Regime、Call/Put Wall、Gamma Flip、Expected Move —— 教你看「市场被谁拽着走」 | ≈8 分钟 |
| [期权看板速成课_面板03_整体框架_交互教学.html](./期权看板速成课_面板03_整体框架_交互教学.html) | 面板 03 Positioning：OI 蝴蝶图、ΔOI、Volume、P/C 天平 —— 教你看「钱堆在哪、往哪搬」 | ≈8 分钟 |

两份课件互补、内容不重复：**01 给结论，03 给证据**。

打开方式：双击 HTML 文件，按键盘 `→` 翻幕，鼠标悬浮带虚线的词/框即可看大白话讲解。

## 二、教学设计文档（先读这份）

- [第一阶段教学设计_面板01_03.md](./第一阶段教学设计_面板01_03.md)
  - 教学目标：学完能回答「01 在说什么、03 在说什么、两个面板怎么配合」三个问题
  - 概念 → 后端字段映射表：每个教学概念对应哪个正式接口字段
  - 7 幕场景清单 + 术语注释清单（悬浮讲解全覆盖的硬性规范）

## 三、配套参考资料

| 文件 | 说明 |
| --- | --- |
| [options-dashboard-frontend-integration.md](./options-dashboard-frontend-integration.md) | 前端接口接入指南：把课件里的教学示意数据替换成正式期权接口的口径与字段定义 |
| [animated-curtain-teaching.txt](./animated-curtain-teaching.txt) | 幕布教学制作规范：一眼看懂、通俗案例、工具类比、小白视角、悬浮注释全覆盖等硬性规则 |

## 四、辅助材料（早期版本 / 进阶对照）

放在 [辅助材料/](./辅助材料/) 目录下，供进阶阅读：

| 文件 | 说明 |
| --- | --- |
| [普通写法vs_React对照_幕布教学.html](./辅助材料/普通写法vs_React对照_幕布教学.html) | 普通写法 vs React 左右对照，教新手看懂框架代码 |
| [期权看板六视图预览_第二代.html](./辅助材料/期权看板六视图预览_第二代.html) | 第二代看板六视图预览（GEX 交易视角） |
| [期权看板_二代补充插件.html](./辅助材料/期权看板_二代补充插件.html) | 波动率 / GEX 拆分 / 期权链 / 月间价差 补充插件演示 |

## 五、怎么维护

- 课件全部为单文件 HTML：改文件内的 `data-tip` 文案即可更新悬浮讲解
- 教学示意数据与正式字段的对应关系以 `options-dashboard-frontend-integration.md` 为准
- 新课件遵循 `animated-curtain-teaching.txt` 规范制作

---

© Marsoon-Option 团队 · 开源教学课件 · 欢迎 PR 补充更多面板讲解

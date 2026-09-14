---
description: "面向 DeepSeek Harness Web 侧栏的 draw.io（.drawio / mxGraph XML）文档预览。"
---

# @zhang-guo-wen/dsh-drawio

[English](README.md) | 中文

独立的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件：在 Web 侧栏中把 `.drawio` 文件预览为图表。构建、安装与许可细节见[仓库 README](../../README.zh.md)。

## 贡献了什么

| | |
|---|---|
| 预览元数据 | `ctx.documentPreviews` —— `drawio` 后缀、`loading: 'bytes-complete'`、`wrap: false`，位于 `extension` 档位，因此优先于内置纯文本兜底实现 |
| body | keyed 槽位 `sidebar.right.tab.document`，id 为 `@zhang-guo-wen/dsh-drawio` |
| 文案 | `sidebarDrawio` locale 命名空间（中文、英文） |
| host 半 | 无——`src/index.ts` 是空操作，因为预览完全在浏览器侧 |

渲染器经入口的 inject 面以 `createRenderer` 交给 body，因此表现层组件不导入任何引擎。

## 内联的代码

`@maxgraph/core`（Apache-2.0）与 `fflate`（MIT）被内联进 `lib/client.js`。署名见仓库 [NOTICE](../../NOTICE)。

## peer 契约

`@deepseek-ai/*` 包均为 `external`，由宿主 harness 解析。所安装的 profile 必须组合 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview`——本插件写入的注册表由它拥有。

## 构建

```sh
npm run build      # 在本包内，或在仓库根执行 `npm run build`
npm run typecheck
npm test
```

`lib/` 随仓库提交，因此本仓库可从 git 直接安装，无需构建步骤。

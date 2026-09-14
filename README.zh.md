# dsh-drawio

[English](README.md) | 中文

一个**独立**的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）插件：在 Web 侧栏中把 `.drawio` 文件预览为图表。

它不在 harness monorepo 内，也不使用 harness 的构建脚本。浏览器产物中 `@deepseek-ai/*` 一律为 `external`，运行时从宿主 harness 解析——与任何第三方 DSH 插件一致。

## 能力

在侧栏文件树里打开任意 `.drawio` 文件，它会渲染成你画的那张图，而不是以 mxGraph XML 源码打开。

- **只读且惰性。** 文件在屏幕外解码与布局；面板拿到的是 SVG `data:` URL，而绝不是引擎实例或活的 DOM。标记不会进入应用 DOM，因此图里的内容无法对页面执行脚本。
- **兼容 draw.io 的两种保存格式。** 纯 mxGraph XML，以及 draw.io 的压缩体（base64 + raw DEFLATE + 百分号转义）。多页 `<mxfile>` 只渲染第一页。
- **文件不出本机。** 渲染完全本地完成。与托管查看器不同，任何内容都不会被上传。

## 贡献了什么

| | |
|---|---|
| 预览元数据 | `ctx.documentPreviews` —— `drawio` 后缀、`loading: 'bytes-complete'`、`wrap: false`，位于 `extension` 档位，因此优先于内置纯文本兜底实现 |
| body | keyed 槽位 `sidebar.right.tab.document`，id 为 `@zhang-guo-wen/dsh-drawio` |
| 文案 | `sidebarDrawio` locale 命名空间（中文、英文） |
| host 半 | 无——`src/index.ts` 是空操作，因为预览完全在浏览器侧 |

渲染器经入口的 inject 面以 `createRenderer` 交给 body，因此表现层组件不导入任何引擎。

## 目录结构

```
package.json                    插件清单（name、exports、dsh.client、dsh.bundle）
src/index.ts                    host 半——刻意不贡献任何东西
src/client/index.ts             注册预览元数据与侧栏 body
src/client/DrawioBody.tsx       表现层组件（不导入引擎）
src/client/maxgraph.ts          唯一加载 @maxgraph/core 的模块
src/client/drawio-style.ts      引擎使用的 draw.io 默认单元格样式
src/client/drawio.ts            解码：纯 XML 与压缩体
build-client.mjs                把浏览器半打成加载器 handoff
tsdown.config.ts                构建 host 半
cordis.patch.yml                本 bundle 插入的组合行
lib/                            构建产物，随仓库提交以便 git 安装
```

**本仓库就是插件包**：根 `package.json` 就是 `@zhang-guo-wen/dsh-drawio`。这是硬性要求而非风格选择——`npm install github:<owner>/<repo>` 打包的是**仓库根**，所以放在 `packages/*` 下的插件会被装成错误的东西。

### 用 draw.io 的默认值，而不是 maxGraph 的

maxGraph 的 `createDefaultVertexStyle()` 把标签设为棕色 `#774400`，于是样式串里没写字体颜色的单元格，会渲染出一个在 draw.io 图里根本不会出现的颜色。`src/client/drawio-style.ts` 改为传入一份采用 draw.io 默认值的 `Stylesheet`：中性 `#333333` 标签色、`#dae8fc` / `#6c8ebf` 矩形配色、顶点标签 12px、边标签 11px，以及实心箭头。

单元格自身的样式串依然优先——引擎会把它合并到这些默认值之上——因此文件里显式写的 `fillColor`、`strokeColor`、`fontColor` 不受影响。`tests/style.mjs` 把这条契约的两半都钉住了。

## 构建

```sh
npm install
npm run build      # host 半用 tsdown，浏览器半用 build-client.mjs
npm run typecheck  # 针对「已发布」的 @deepseek-ai/* 包做 tsc
npm test           # 按浏览器的方式加载构建产物
```

`lib/` 随仓库提交。这正是别人可以用 git 直接安装、自己无需构建的原因。改动 `src/` 后请重新 `npm run build` 并提交 `lib/`。

### 浏览器半为什么自带打包器

harness monorepo 用 `packages/client/tsdown.client.ts` 打客户端产物，而它并未发布。因此本仓库自己打包浏览器半，其中两条细节是承重的：

1. **显式设置 `platform: 'browser'`。** 在 rolldown 的 `node` platform 下，每个依赖都按 `node` 导出条件解析；若某库的 `exports` 把平台条件排在 `import` 之前，它的**服务端**入口就会被内联。这些入口可能在模块作用域调用 `createRequire('module')`，产出浏览器模块表无法应答的 `require("module")`——插件随即挂载失败。
2. **只有 react 与 DSH 客户端包保持 external。** 实现库（`@maxgraph/core`、`fflate`）被内联，因此部署产物没有安装期依赖；而浏览器安全的 DSH 工具包（`@deepseek-ai/dsh-util-workspace-path`）同样被内联，而不是向模块表索取。

构建对这两点都有校验：`npm test` 用一个只含 `react`、`react/jsx-runtime` 与该工具包的模块表加载产物，产物若索取其他任何东西即失败。

## 安装

插件装入 DSH profile，而不是 harness 检出目录：

```sh
cd "$DSH_HOME/profiles/web"
npm install <指向本仓库的路径或 git 地址>/packages/drawio --legacy-peer-deps --no-package-lock --no-audit --no-fund
```

然后在该 profile 的 `package.json` 中把它注册为 **profile bundle**。插件行不是手工 insert 的：profile 会应用每个 bundle 自带的 `cordis.patch.yml`，而这正是本包所提供的东西。两个列表都要写上它。

```jsonc
{
  "dsh": {
    "profile": {
      "bundles": [
        // ……原有 bundles……
        "@zhang-guo-wen/dsh-drawio"
      ]
    }
  },
  "dependencies": {
    // ……原有 dependencies……
    "@zhang-guo-wen/dsh-drawio": "file:C:/path/to/this-repo/packages/drawio"
  }
}
```

重启 host。启动前先验证组合能解析：

```sh
dsh --profile web --dump-config | grep -A2 drawio
```

`--legacy-peer-deps` 仅在 profile 已带有 peer 范围无法满足的第三方插件时才需要；`--no-package-lock` 可避免 npm 往 pnpm 管理的 profile 里写 lockfile。

> 所安装的 profile 必须已经组合了 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview`——本插件所贡献的 `documentPreviews` 注册表由它拥有。所有随附的 web profile 都满足这一点。
>
> 正是这次 `npm install` 创建了指向本仓库的 `node_modules` junction（或软链），因此在本仓库重建 `lib/` 会被直接读到，无需重装。

## 已知限制

**连线绕行与边标签位置与 draw.io 不一致。** `.drawio` 文件存的是边的两个端点（`source`、`target`）和 `edgeStyle` 名称，**不存中间的路径**：

```xml
<mxCell id="e4" style="edgeStyle=orthogonalEdgeStyle;…" edge="1" source="n4" target="n5">
  <mxGeometry relative="1" as="geometry" />   <!-- 没有路径点，也没有标签偏移 -->
</mxCell>
```

因此两个 viewer 都在渲染时**各自计算**拐点与标签位置：输入相同，**代码不同**。draw.io 编辑器在 mxGraph 之上加了自己的路由与标签避让逻辑，maxGraph 不含这段代码，于是两者会有差异：

- 一条边可能走出不同路线（多一个拐弯，或走节点的另一侧）；
- 当两个节点间距小于标签宽度时，边标签会压在节点标签上。

第二点是**几何问题而非外观问题**：两个节点相距 50px、而标签宽 66px 时，不移动节点就没有位置能同时避开两个框。给标签加不透明背景，只会用它盖住底下的文字，观感更差，所以本渲染器不这么做。

**变通办法。** 在 draw.io 里把边标签拖到你想要的位置：编辑器会把显式的 `<mxPoint as="offset">` 写进文件，此后**任何 viewer（包括本插件）都会遵循它**。把两个节点的间距拉宽同样有效。两者都是**在图的源头修好**，而不是只在某一个 viewer 里修。

由 `Stylesheet` 决定的部分（颜色、字体、字号、箭头）**是**与 draw.io 一致的，见上文「用 draw.io 的默认值，而不是 maxGraph 的」。

## 环境要求

| | |
|---|---|
| Harness | 已发布的 `@deepseek-ai/dsh-client-*` 版本线为 `0.1.5-rc.2`（本仓库类型检查所依据的版本） |
| 浏览器 | harness Web GUI 所支持的任何 Chromium/Firefox/Safari |
| Node | 22+（仅构建期） |

## 许可

Apache-2.0。内联的第三方代码在 [NOTICE](NOTICE) 中署名。

# AGENTS.md

本仓 `dsh-drawio` 是**独立于 harness monorepo** 的 DeepSeek Harness (DSH) 插件：在 Web 侧栏里把 `.drawio` 文件**只读**预览成图表。
它不打包 `@deepseek-ai/*`，运行时从宿主 harness 解析这些包；harness 单仓里没有任何它依赖的私有脚本。

姊妹插件：[`dsh-drawioedit`](../dsh-drawioedit)（用上游 draw.io 编辑器在侧栏标签页里就地编辑 `.drawio`，代价是约 119 MB 的随包编辑器）。
两者互不 import、互不依赖，可单独安装，也可以同时装——预览给只读场景，编辑给要改图的场景。

本文件只放**导航与硬约束**；明细在包根 `rules/` 里按需读取（索引见文末）。

## 目录

仓库根**就是**包：`package.json` 即 `@guowenzhang/dsh-drawio`。
这不是风格选择——`dsh plugin add <git-url>` 取的是仓库根，包放在 `packages/*` 下会被装成错误的东西。

- `src/index.ts` —— host 半边：**只有一个空的 `apply()`**，它不注册任何 host 服务、工具或提示段；存在只是因为 Loader 按包名解析插件行并 import 它。
- `src/client/` —— 浏览器半边：`index.ts`（注册字典 / 预览元数据 / 点名 body，全部走 `ctx.effect(...)`）、`DrawioBody.tsx`（呈现层）、`drawio.ts`（两种保存格式解码）、`maxgraph.ts`（**唯一**加载 `@maxgraph/core`）、`maxgraph-loader.ts`（唯一引擎入口）、`drawio-style.ts`、`renderer.ts`、`definition.ts`、`locales.ts`、`DrawioBody.module.css`。
- `lib/` —— 构建产物：**已提交进仓库**（`index.mjs` host + `client.js` 浏览器入口 + `client.maxgraph.js` 引擎 chunk），这样别人可以直接从 git 安装。
- `cordis.patch.yml` —— 把插件行插入组合的 bundle 层。
- `tests/` —— 四个构建产物套件（`npm test`）与配套替身 / 开发工具；`docs/` —— README 的截图与其 `.drawio` 源文件。

逐文件职责、`dsh`/`exports` 接线与扩展点契约见 [rules/architecture.md](rules/architecture.md)。

## 构建与测试命令

```sh
npm install
npm run build      # tsdown（host） + node build-client.mjs（client）
npm run typecheck  # tsc --noEmit -p tsconfig.json，针对「已发布」的 @deepseek-ai/* 包
npm test           # bundle-shape → smoke → style → check-bundle
```

## 关键硬约束

- **改了 `src/` 必须 `npm run build` 并把 `lib/` 一起提交**：套件验的是产物不是源码，不重建可能对着旧产物全绿，而装上的是旧版本。
- `maxgraph.ts` **只能**经 `maxgraph-loader.ts` 的动态 import 到达，且 specifier 必须是包内相对路径（`./maxgraph.ts`）；静态 import 或写成 `@maxgraph/core` 会让 1.07 MB 引擎回到入口、或产不出 chunk。
- 两个产物都必须是 `window.__ModuleLoader__.load({ id, ... })`：`id` 与 `build-client.mjs` 的 `HANDOFF_ID`（`@guowenzhang/dsh-drawio`）、`tests/smoke.mjs` 的断言三者一致；改 client 必须 bump `HANDOFF_ID` 或强刷浏览器。
- 产物里**不得**留下同步相对 `require("./client*.js")`：相对 chunk 只能经 `require.async("./client.maxgraph.js")` 取。
- `build-client.mjs` 必须保留 `platform: 'browser'`；掉了它会让依赖的服务端入口被内联，产物在浏览器里因 `require("module")` 直接加载失败。
- `package.json` 的 `files` 必须覆盖 `lib/client.*.js`，否则引擎 chunk 不进发布载荷，安装后图表永远画不出来。
- `dsh.client.inject` 必须列全服务提供包，访问服务用 `ctx.get('x')` 而不是 `ctx.x`；漏列时标签页根本不出现。
- 仓库根必须就是包：不要移进 `packages/*`，也不要改动根 `package.json` 的定位（`main`/`exports`/`dsh` 字段）。
- 渲染必须**只读且 inert**：面板只拿到 `data:` URL，引擎 `setEnabled(false)`，不得让引擎实例或活 DOM 留在面板里。
- JSX 引用的 CSS module 类必须在 CSS 里定义，否则类名是 `undefined` 且静默无样式；文案以 `zh` 为准、`en` 同 key。
- 本文件与 `rules/*.md` 都吃 `agent-instructions` 的 65,536 字节预算（按渲染后大小、leaf-first 丢弃）：新增明细写进对应 `rules/` 文件，不要堆回本文件；条款只能搬家，不能静默删除。

## 详细规则

- [rules/architecture.md](rules/architecture.md)：逐文件职责、`package.json` 的 `dsh`/`exports` 接线、`cordis.patch.yml` 与预览扩展点契约；**改目录结构、组合配置或核对宿主加载方式时读**。
- [rules/build.md](rules/build.md)：tsdown/rolldown 两个产物的打包机制、`platform: 'browser'` 与 external/内联边界、chunk 改写与 CSS module 排序；**改 `build-client.mjs`/`tsdown.config.ts` 或排查产物 diff 时读**。
- [rules/renderer.md](rules/renderer.md)：两种保存格式的解码、draw.io 默认样式表、边缘路由差异、尺寸计算与只读 inert 设计；**改 `src/client/` 渲染路径或解释「图怎么画得不一样」时读**。
- [rules/testing.md](rules/testing.md)：四个套件的断言与产物加载方式、`chunk-loader` 替身、`render.mjs` / `plugin-metadata` 工具；**写或调测试、判断某条约束由谁守着时读**。
- [rules/deploy-release.md](rules/deploy-release.md)：安装命令、host/client 生效语义、发版与 tag 步骤；**安装、部署、发版或回答「改动没生效」时读**。
- [rules/pitfalls.md](rules/pitfalls.md)：13 条易崩清单及其对应套件；**动手前后自查与排障时读**。

## 维护约定

- 详尽的「为什么」写进 `rules/`，本文件只保留导航与硬约束；拆分只搬运条款，不删条款。
- 版本号、tag、npm 发布与推送时段遵循工作区根 `AGENTS.md`；本仓的 `lib/` 随源码一起提交。

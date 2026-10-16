---
paths:
  - "src/**"
  - "tests/**"
  - "lib/**"
  - "locale/**"
  - "package.json"
  - "cordis.patch.yml"
  - "build-client.mjs"
  - "tsdown.config.ts"
  - "README.md"
  - "README.zh.md"
  - "docs/**"
---

> 覆盖什么、何时读：13 条易崩清单及其对应套件；**动手前后自查与排障时读**。

# 易崩清单

覆盖：13 条已知会静默出错或直接崩掉的写法，以及每条的守门套件。
**何时读**：动手改 `src/` / 构建配置 / 组合配置前后自查，或线上/本地排障时逐条对照。

1. 改了 `src/` 忘记 `npm run build` 并提交 `lib/` → 装上的是旧产物（本仓没有产物新鲜度套件守着这条）。
2. client 包不是 `window.__ModuleLoader__.load({ id, factory })` 格式，或 `id` 与 `HANDOFF_ID` 不一致 → 浏览器加载失败，`tests/smoke.mjs` 的 handoff 断言会先红。
3. 改 client 不 bump `HANDOFF_ID` / 不硬刷新 → 浏览器跑旧 bundle（表现为"改动没生效"）。
4. `build-client.mjs` 掉了 `platform: 'browser'` → 依赖的服务端入口被内联，产物在浏览器里因 `require("module")` 直接加载失败（`tests/smoke.mjs` 的空模块表能抓到）。
5. CSS module 里 JSX 引用但 CSS 未定义的类 → `undefined`，静默无样式。
6. 样式表被引擎默认值盖过或未生效 → 没写颜色的单元格渲染成 maxGraph 的蓝/棕，`tests/style.mjs` 会红。
7. `ctx.x` 属性访问未 inject 的服务 → 抛错（用 `ctx.get('x')`）。
8. `dsh.client.inject` 漏列服务提供包 → 浏览器半边挂载时取不到服务（如预览注册表），标签页根本不出现。
9. 仓库被放进 `packages/*` 或改了根 `package.json` 的定位 → `dsh plugin add <git-url>` 会装成错误的东西。
10. `maxgraph.ts` 被入口或 `DrawioBody.tsx` 静态 import → 1.07 MB 引擎回到入口，插件启动就要解析并执行它；`tests/bundle-shape.mjs` 会红（它断言入口里没有引擎标记）。
11. 动态 import 的 specifier 不是包内相对路径（如写成 `@maxgraph/core` 或绝对路径）→ 构建不会产出 chunk，或产出的事实上不是包内 chunk；`bundle-shape.mjs` 找不到 `require.async("./client.maxgraph.js")` 就红。
12. 产物里留下同步相对 `require("./client*.js")` → 模块加载器只能同步应答模块表里的词，相对 chunk 必须走 `require.async`，否则运行时直接 miss；`bundle-shape.mjs` 对入口与 chunk 都断言这一点。
13. `package.json` 的 `files` 没带上 `lib/client.*.js` → chunk 不在发布载荷里，安装后图表永远画不出来（`bundle-shape.mjs` 也断言这条）。

守门套件的断言细节见 [testing.md](testing.md)，产物为什么必须长这样见 [build.md](build.md)。

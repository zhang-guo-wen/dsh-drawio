---
paths:
  - "src/**"
  - "lib/**"
  - "build-client.mjs"
  - "tsdown.config.ts"
  - "package.json"
---

> 覆盖什么、何时读：tsdown/rolldown 两个产物的打包机制、`platform: 'browser'` 与 external/内联边界、chunk 改写与 CSS module 排序；**改 `build-client.mjs`/`tsdown.config.ts` 或排查产物 diff 时读**。

# 构建产物打包

覆盖：host 与 client 两个产物的打包机制、`platform: 'browser'` 与 external/内联边界、chunk 改写、CSS module 类名排序。
**何时读**：改 `build-client.mjs` / `tsdown.config.ts` / `package.json` 的构建配置，或排查产物字节差异时。

总览与命令见 [../AGENTS.md](../AGENTS.md)，产物形状由哪些套件守着见 [testing.md](testing.md)。

## 构建

```sh
npm install
npm run build      # tsdown（host） + node build-client.mjs（client）
npm run typecheck  # tsc --noEmit -p tsconfig.json，针对「已发布」的 @deepseek-ai/* 包
```

- host：`tsdown` 打 `src/index.ts` → `lib/index.mjs`，`tsdown.config.ts` 里 `deps.neverBundle: [/^@deepseek-ai\//]` 让所有 `@deepseek-ai/*` 保持 external。
- client：`build-client.mjs`（rolldown）产出**两个**产物：入口 `lib/client.js` 与引擎 chunk `lib/client.maxgraph.js`。两者都包成 `window.__ModuleLoader__.load({ id, ... })`——入口只写 `id`，chunk 另写 `chunk: "client.maxgraph.js"`，模块加载器据此把 chunk 键成 `<包名>/client.maxgraph.js` 并从入口自己的 URL 解析它。react 与 `@deepseek-ai/*` external，`.module.css` 用 lightningcss 编译（`cssModules.pattern: '[hash]_[local]'`）并内联成一个去重的 `<style>` 标签。每次成功写入后会清扫不再产出的旧 chunk。
- 本仓两半都不使用装饰器（host 半边是空 `apply`，浏览器侧没有 `@Remote`），所以 `tsdown.config.ts` 里没有装饰器降级 transform。

**`platform: 'browser'` 是显式设置的。** harness 单仓打客户端产物用的 `packages/client/tsdown.client.ts` 并未发布，所以本仓自己打包浏览器半。在 rolldown 的 `node` platform 下，依赖会经 `node` export 条件解析：若某库的 `exports` 把平台条件排在 `import` 之前，它的**服务端入口**就会被内联，而那些入口可能在模块顶层调用 `createRequire('module')`，产出浏览器模块表无法应答的 `require("module")`。`build-client.mjs` 的 `EXTERNAL` 只有 react 与 DSH 客户端包（`@deepseek-ai/cordis`、`dsh-client-locale`、`dsh-client-ui-renderer`、`dsh-client-ui-slots`、`dsh-client-ui-sidebar-documentpreview`）；`@deepseek-ai/dsh-util-workspace-path` 这类浏览器安全的工具**被内联**（对齐 harness 的 INLINE_SAFE 策略），所以部署产物不会向模块表索取它。`fflate` 与引擎都被内联进产物（引擎在自己的 chunk 里），所以部署产物没有安装期依赖。另外，rolldown 会把 `import('./maxgraph.ts')` 在 CJS 输出里写成**延迟的同步 `require`**，而 chunk 是加载器要单独取的资源、只有工厂的 `require.async` 能取到：`asyncChunkRequirePlugin` 把该表达式改写成 `require.async("./client.maxgraph.js")`，找不到预期表达式就让构建失败，而不是留下一个运行时必然 miss 的 `require`。

CSS module 的类名映射在 `JSON.stringify` 前按局部名排序：lightningcss 的 `exports` 没有稳定键序，不排序会让同一份源码每次构建产出字节不同的 `lib/client.js`，在提交产物里制造假 diff。

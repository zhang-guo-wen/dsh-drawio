# 浏览器测试

覆盖：`npm test` 链里四个构建产物套件各自断言什么、套件如何按浏览器方式加载产物、`chunk-loader` 替身与另外两个工具。
**何时读**：写或调测试、重建 `lib/` 后判断该跑哪个套件，或想知道某条硬约束由谁守着时。

## 测试

```sh
npm test   # bundle-shape → smoke → style → check-bundle
```

四个套件都**按浏览器的方式加载构建产物**：jsdom 里 `window.__ModuleLoader__.load(...)`，模块表只放 `react`、`react/jsx-runtime` 与内联所需的少量工具，jsdom 的浏览器全局被发布到本 realm（`vm` 沙箱会让 maxGraph 的节点身份检查失败）。`tests/chunk-loader.mjs` 提供工厂的 `require.async`（按 chunk 文件名缓存，与真实加载器一致），所以套件里的图是在**取到引擎 chunk 之后**画出来的。

- `bundle-shape.mjs`：静态断言入口没有引擎标记、经 `require.async("./client.maxgraph.js")` 触达它、两个产物都没有同步相对 `require`、注册 id/chunk 名正确、`package.json` 的 `files` 覆盖 chunk；同时打印两个产物的字节数。它守的是「引擎不会悄悄回到入口」。
- `smoke.mjs`：factory 没有索取模块表以外的东西（node 内置模块会抛）、注册了字典 / 预览元数据 / 点名 body，然后读一次图：第一次绘制必须取一次 `client.maxgraph.js`，第二次复用（不再取），并真的画出一张图。
- `style.mjs`：对构建产物断言 draw.io 默认样式生效（`#dae8fc` / `#6c8ebf` / `#333333`，且不含 maxGraph 的 `#774400`），且单元格自身样式仍然优先。
- `check-bundle.mjs`：对**给定**的产物文件跑同一套样式契约（`node tests/check-bundle.mjs <path>`），所以提交进去的产物不重新构建也能验；引擎 chunk 从同一个 `lib/` 里取。

因为它们验的是产物而不是源码，改了 `src/` 必须先 `npm run build`：不重建时套件可能对着旧产物全绿。`tests/render.mjs` 不在 `npm test` 里，它是开发工具——命令行给一个 `.drawio` 路径，打印尺寸并把 SVG 写到 `tests/out/rendered.svg`。

`npm run test:metadata`（`tests/plugin-metadata.test.mjs`，`node --test`）同样不在 `npm test` 链里：它断言 `package.json` 的 `exports['./locale/*']` 与 `files` 覆盖 `locale`，`locale/en.json`、`locale/zh.json` 的展示元数据只有 `title` / `description` 且非空——`title` 不带 `@scope/` 前缀、英文描述无中文、中文标题与描述含中文——以及未翻译语言回落到英文标题。

构建产物为什么必须长成这样见 [build.md](build.md)，13 条易崩写法见 [pitfalls.md](pitfalls.md)。

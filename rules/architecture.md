# 目录与组合接线

覆盖：仓库逐文件职责、`package.json` 的 `dsh`/`exports` 接线、`cordis.patch.yml` 与文档预览扩展点契约。
**何时读**：改目录结构或文件职责、改组合配置、核对插件如何被宿主加载时。

总览与硬约束见 [../AGENTS.md](../AGENTS.md)。

## 目录

仓库根**就是**包：`package.json` 即 `@guowenzhang/dsh-drawio`。
这不是风格选择——`dsh plugin add <git-url>` 取的是仓库根，包放在 `packages/*` 下会被装成错误的东西。

- `src/index.ts` —— host 半边：**只有一个空的 `apply()`**。预览完全在浏览器侧，这个入口存在只是因为 Loader 按包名解析插件行并 import 它；它不注册任何 host 服务、工具或提示段。
- `src/client/index.ts` —— 浏览器半边入口：`inject = ['slots', 'locale', 'documentPreviews']`，注册字典（命名空间 `sidebarDrawio`）、预览元数据与点名座位 `sidebar.right.tab.document` 的 body，全部走 `ctx.effect(...)` 收口。
- `src/client/DrawioBody.tsx` —— 呈现层：把已解码的图渲染成一个 `<img>`（`data:` URL、保持宽高比），失败按值返回而不是抛进渲染（坏文件不能掀掉整个标签页）；绘制是异步的，所以首帧是骨架、失败带重试。
- `src/client/drawio.ts` —— 两种保存格式的解码（纯 mxGraph XML 与 draw.io 的压缩体）。
- `src/client/maxgraph.ts` —— **唯一**加载 `@maxgraph/core` 的模块：离屏容器、`setEnabled(false)`、`ModelXmlSerializer` 导入、序列化成 SVG `data:` URL。它**只能**经 `maxgraph-loader.ts` 的动态 import 到达；静态 import 会把 1.07 MB 的引擎拉回入口（见 [build.md](build.md)）。
- `src/client/maxgraph-loader.ts` —— 呈现层看到的唯一引擎入口：`renderDrawioDiagram(xml)` 内部 `await import('./maxgraph.ts')`，构建据此产出 `lib/client.maxgraph.js`，由模块加载器的 `require.async` 在第一张图需要时才取。
- `src/client/drawio-style.ts` —— 与 draw.io 默认值一致的样式表，构造 `Graph` 时作为第 4 个参数传入。
- `src/client/renderer.ts` —— 只放 `DrawioRenderer` / `RenderedDiagram` 两个接口，所以呈现层测试不必加载引擎。
- `src/client/definition.ts` —— `DRAWIO_BODY_ID`（`@guowenzhang/dsh-drawio`）与 `DRAWIO_EXTENSIONS`；元数据与 keyed body 共用同一个实现 id。
- `src/client/locales.ts` / `DrawioBody.module.css` / `css-modules.d.ts` —— 双语文案（`zh` 为准，`en` 同 key）、样式、CSS module 的类型声明。
- `locale/en.json` / `locale/zh.json` —— 插件展示元数据（`title` / `description`）；`package.json` 的 `exports['./locale/*']` 与 `files` 里的 `locale` 条目负责发布它，`npm run test:metadata` 守着它（见 [testing.md](testing.md)）。
- `lib/` —— 构建产物：**已提交进仓库**（`index.mjs` host + `client.js` 浏览器入口 + `client.maxgraph.js` 引擎 chunk），这样别人可以直接从 git 安装。改完源码**记得 `npm run build` 并把 `lib/` 一起提交**。
- `cordis.patch.yml` —— 把插件行插入组合的 bundle 层。
- `docs/example.png` / `docs/example.drawio` —— README 的截图与它的源文件；`package.json` 的 `files` 里带着 `docs`，README 的图片在 npm 上也解析得到。
- `tests/` —— `bundle-shape.mjs` / `smoke.mjs` / `style.mjs` / `check-bundle.mjs` 四个套件（`npm test`），`chunk-loader.mjs` 是它们共用的 chunk 加载替身，外加不进套件的 `render.mjs`。

## 组合接线

`cordis.patch.yml` 只做一件事——把插件行插进 profile 组合出来的 bundle 层：

```yaml
- insert:
    - id: drawio
      name: '@guowenzhang/dsh-drawio'
```

`package.json` 的 `dsh` 字段声明它在 profile 里的接线：`dsh.bundle.patch` 指向上面这个补丁文件，`dsh.client.platform` 为 `web`，`dsh.client.inject` 列出浏览器半边 apply 用到的服务提供包——`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-renderer`、`@deepseek-ai/dsh-client-ui-sidebar-documentpreview`。`exports` 另导出 `./client`（`lib/client.js`）与 `./cordis.patch.yml`。

扩展点归 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview` 所有，本插件只按它的契约贡献两项：预览元数据进 `ctx.documentPreviews`（`extensions: ['drawio']`、`loading: 'bytes-complete'`、`wrap: false`），body 进点名座位 `sidebar.right.tab.document`，两者都用 `DRAWIO_BODY_ID` 作为实现 id。宿主 profile 必须组合该包，所有随附的 web profile 都满足；没有它时 `inject` 拿不到服务，标签页不会出现。

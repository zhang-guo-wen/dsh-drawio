# AGENTS.md

本仓 `dsh-drawio` 是**独立于 harness monorepo** 的 DeepSeek Harness (DSH) 插件：在 Web 侧栏里把 `.drawio` 文件**只读**预览成图表。
它不打包 `@deepseek-ai/*`，运行时从宿主 harness 解析这些包；harness 单仓里没有任何它依赖的私有脚本。

姊妹插件：[`dsh-drawioedit`](../dsh-drawioedit)（用上游 draw.io 编辑器在侧栏标签页里就地编辑 `.drawio`，代价是约 119 MB 的随包编辑器）。
两者互不 import、互不依赖，可单独安装，也可以同时装——预览给只读场景，编辑给要改图的场景。

## 目录

仓库根**就是**包：`package.json` 即 `@guowenzhang/dsh-drawio`。
这不是风格选择——`dsh plugin add <git-url>` 取的是仓库根，包放在 `packages/*` 下会被装成错误的东西。

- `src/index.ts` —— host 半边：**只有一个空的 `apply()`**。预览完全在浏览器侧，这个入口存在只是因为 Loader 按包名解析插件行并 import 它；它不注册任何 host 服务、工具或提示段。
- `src/client/index.ts` —— 浏览器半边入口：`inject = ['slots', 'locale', 'documentPreviews']`，注册字典（命名空间 `sidebarDrawio`）、预览元数据与点名座位 `sidebar.right.tab.document` 的 body，全部走 `ctx.effect(...)` 收口。
- `src/client/DrawioBody.tsx` —— 呈现层：把已解码的图渲染成一个 `<img>`（`data:` URL、保持宽高比），解码/布局同步完成，失败按值返回而不是抛进渲染（坏文件不能掀掉整个标签页）。
- `src/client/drawio.ts` —— 两种保存格式的解码（纯 mxGraph XML 与 draw.io 的压缩体）。
- `src/client/maxgraph.ts` —— **唯一**加载 `@maxgraph/core` 的模块：离屏容器、`setEnabled(false)`、`ModelXmlSerializer` 导入、序列化成 SVG `data:` URL。
- `src/client/drawio-style.ts` —— 与 draw.io 默认值一致的样式表，构造 `Graph` 时作为第 4 个参数传入。
- `src/client/renderer.ts` —— 只放 `DrawioRenderer` / `RenderedDiagram` 两个接口，所以呈现层测试不必加载引擎。
- `src/client/definition.ts` —— `DRAWIO_BODY_ID`（`@guowenzhang/dsh-drawio`）与 `DRAWIO_EXTENSIONS`；元数据与 keyed body 共用同一个实现 id。
- `src/client/locales.ts` / `DrawioBody.module.css` / `css-modules.d.ts` —— 双语文案（`zh` 为准，`en` 同 key）、样式、CSS module 的类型声明。
- `lib/` —— 构建产物：**已提交进仓库**（`index.mjs` host + `client.js` 浏览器 handoff），这样别人可以直接从 git 安装。改完源码**记得 `npm run build` 并把 `lib/` 一起提交**。
- `cordis.patch.yml` —— 把插件行插入组合的 bundle 层。
- `docs/example.png` / `docs/example.drawio` —— README 的截图与它的源文件；`package.json` 的 `files` 里带着 `docs`，README 的图片在 npm 上也解析得到。
- `tests/` —— `smoke.mjs` / `style.mjs` / `check-bundle.mjs` 三个套件（`npm test`），外加不进套件的 `render.mjs`。

## 构建

```sh
npm install
npm run build      # tsdown（host） + node build-client.mjs（client）
npm run typecheck  # tsc --noEmit -p tsconfig.json，针对「已发布」的 @deepseek-ai/* 包
```

- host：`tsdown` 打 `src/index.ts` → `lib/index.mjs`，`tsdown.config.ts` 里 `deps.neverBundle: [/^@deepseek-ai\//]` 让所有 `@deepseek-ai/*` 保持 external。
- client：`build-client.mjs`（rolldown）→ `lib/client.js`，包成 `window.__ModuleLoader__.load({ id, factory })`，react 与 `@deepseek-ai/*` external，`.module.css` 用 lightningcss 编译（`cssModules.pattern: '[hash]_[local]'`）并内联成一个去重的 `<style>` 标签。
- 本仓两半都不使用装饰器（host 半边是空 `apply`，浏览器侧没有 `@Remote`），所以 `tsdown.config.ts` 里没有装饰器降级 transform。

**`platform: 'browser'` 是显式设置的。** harness 单仓打客户端产物用的 `packages/client/tsdown.client.ts` 并未发布，所以本仓自己打包浏览器半。在 rolldown 的 `node` platform 下，依赖会经 `node` export 条件解析：若某库的 `exports` 把平台条件排在 `import` 之前，它的**服务端入口**就会被内联，而那些入口可能在模块顶层调用 `createRequire('module')`，产出浏览器模块表无法应答的 `require("module")`。`build-client.mjs` 的 `EXTERNAL` 只有 react 与 DSH 客户端包（`@deepseek-ai/cordis`、`dsh-client-locale`、`dsh-client-ui-renderer`、`dsh-client-ui-slots`、`dsh-client-ui-sidebar-documentpreview`）；`@deepseek-ai/dsh-util-workspace-path` 这类浏览器安全的工具**被内联**（对齐 harness 的 INLINE_SAFE 策略），所以部署产物不会向模块表索取它。maxgraph 与 fflate 同样内联，因此产物没有安装期依赖。

CSS module 的类名映射在 `JSON.stringify` 前按局部名排序：lightningcss 的 `exports` 没有稳定键序，不排序会让同一份源码每次构建产出字节不同的 `lib/client.js`，在提交产物里制造假 diff。

## 组合接线

`cordis.patch.yml` 只做一件事——把插件行插进 profile 组合出来的 bundle 层：

```yaml
- insert:
    - id: drawio
      name: '@guowenzhang/dsh-drawio'
```

`package.json` 的 `dsh` 字段声明它在 profile 里的接线：`dsh.bundle.patch` 指向上面这个补丁文件，`dsh.client.platform` 为 `web`，`dsh.client.inject` 列出浏览器半边 apply 用到的服务提供包——`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-renderer`、`@deepseek-ai/dsh-client-ui-sidebar-documentpreview`。`exports` 另导出 `./client`（`lib/client.js`）与 `./cordis.patch.yml`。

扩展点归 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview` 所有，本插件只按它的契约贡献两项：预览元数据进 `ctx.documentPreviews`（`extensions: ['drawio']`、`loading: 'bytes-complete'`、`wrap: false`），body 进点名座位 `sidebar.right.tab.document`，两者都用 `DRAWIO_BODY_ID` 作为实现 id。宿主 profile 必须组合该包，所有随附的 web profile 都满足；没有它时 `inject` 拿不到服务，标签页不会出现。

## 部署与生效语义

用官方命令安装，它把参数转发给 profile 目录里的包管理器，**并自行维护 profile 清单**（依赖条目与 `dsh.profile.bundles` 的层一起加，不要手写）：

```sh
# npm 官方源
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawio

# HTTPS
npx @deepseek-ai/dsh plugin --profile web add git+https://github.com/zhang-guo-wen/dsh-drawio.git

# SSH
npx @deepseek-ai/dsh plugin --profile web add git+ssh://git@github.com/zhang-guo-wen/dsh-drawio.git

# 锁定发布 tag，默认分支上后续的临时提交不会被拉到
npx @deepseek-ai/dsh plugin --profile web add "git+https://github.com/zhang-guo-wen/dsh-drawio.git#v0.1.0"

# 本地目录开发安装；包管理器建 symlink，重建 lib/ 后重启即生效，无需重装
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-drawio

# 卸载：依赖条目与 bundle 层一起移除
npx @deepseek-ai/dsh plugin --profile web remove @guowenzhang/dsh-drawio
```

`lib/` 已提交进仓库，所以装完即可运行，**使用者不需要构建**；本地目录安装建的是 symlink，`file:` 依赖则可能退化成物理拷贝，那时改源码不会影响正在跑的 dsh。

- **host 半边是进程内模块。** 重建 `lib/index.mjs` 不会替换正在运行的那份代码，只有重启宿主才会加载新产物。本仓的 host 半边是空的，所以业务改动几乎都在 client 侧。
- **client 半边按内容 revision 提供。** 产物变了刷新页面就会取到新的；`HANDOFF_ID` 就是这个 revision 的标识，改动 client 后必须 bump 它或强刷浏览器，否则浏览器一直跑旧 bundle。
- `HANDOFF_ID` 在 `build-client.mjs` 里，值为 `@guowenzhang/dsh-drawio`，必须与 `lib/client.js` 包裹里的 `id`、`tests/smoke.mjs` 断言的 id 三者一致。

## 发版

`lib/` 是提交进仓库的，所以**发版 = 改版本号 + 构建 + 提交产物 + 打 tag**。别人按 tag 安装，默认分支上后续的临时提交不会被他们拿到。

1. 改根 `package.json` 的 `version`。
2. `npm run build`，确认 `lib/index.mjs` 与 `lib/client.js` 都是最新的。
3. 提交源码与 `lib/`（不要把 `lib/` 落在外面的工作区）。
4. 打带注释的 tag 并推送：

   ```sh
   git tag -a v<version> -m "dsh-drawio <version>"
   git push origin main --follow-tags
   ```

5. 验证安装：`npx @deepseek-ai/dsh plugin --profile web add "git+https://github.com/zhang-guo-wen/dsh-drawio.git#v<version>"`，重启宿主后确认 `.drawio` 文件在侧栏里渲染成图表。

## 技术决策

- **只读且 inert，面板只拿到 `data:` URL。** 解码与布局在离屏容器里完成，`setEnabled(false)` 摘掉引擎的全部交互处理器，序列化出的 `<svg>` 变成 `data:image/svg+xml` URL 后容器即被移除——面板里没有引擎实例、也没有活的 DOM，所以图里的内容无法对页面执行脚本；渲染器经 inject 面进入组件，`DrawioBody` 不持有引擎句柄。
- **两种保存格式都要认。** 文件要么是纯 mxGraph XML，要么是 draw.io 的压缩体（百分号转义 → raw DEFLATE → base64）。判定压缩体用的是 base64 字符集（不含 `<`、`>` 与空白），不依赖某个 zlib 头；inflate 用 `fflate` 而不是平台的 `DecompressionStream`，因为后者对损坏体的报告走内部 rejection、会变成未处理错误，而坏文件必须表现为本函数的 rejection；也不用 `fflate` 的 base64 字符串输入模式，它产出的字节序列与载荷不同，inflate 会失败。多页 `<mxfile>` 只渲染第一页。
- **本地渲染必须套 draw.io 的默认样式表。** 样式串里没写颜色的单元格否则会继承 maxGraph 自己的蓝/棕配色；传入 `drawio-style.ts` 后默认值变成 draw.io 的（`#dae8fc` 填充、`#6c8ebf` 描边、`#333333` 标签色），而单元格自身声明的颜色依然优先。
- **边缘路由与 draw.io 不一致是数据结构决定的，不是实现疏漏。** `.drawio` 文件只存边的两个端点与 `edgeStyle` 名称，不存路径；draw.io 编辑器在共用引擎之上另加了路由与标签避让逻辑，本插件用的引擎不含这段代码。修图要在源头修（拖动标签写出显式 `<mxPoint as="offset">`，或拉开节点间距）。
- **尺寸由图的边界决定。** 引擎会把元素撑到容器大小，所以内在尺寸取 `graph.getView().getGraphBounds()` 加 `VIEW_PADDING`（8）外扩，下限 `MIN_SIZE`（1），再显式写 `width` / `height` / `viewBox` 并删掉 `style` 属性——图片因此保持宽高比，滚动交给面板。

## 测试

```sh
npm test   # node tests/smoke.mjs && node tests/style.mjs && node tests/check-bundle.mjs
```

三个套件都**按浏览器的方式加载构建产物**：jsdom 里 `window.__ModuleLoader__.load(...)`，模块表只放 `react`、`react/jsx-runtime` 与内联所需的少量工具，jsdom 的浏览器全局被发布到本 realm（`vm` 沙箱会让 maxGraph 的节点身份检查失败）。

- `smoke.mjs`：factory 没有索取模块表以外的东西（node 内置模块会抛）、注册了字典 / 预览元数据 / 点名 body，并用内联的 maxgraph + fflate 真的画出一张图。
- `style.mjs`：对构建产物断言 draw.io 默认样式生效（`#dae8fc` / `#6c8ebf` / `#333333`，且不含 maxGraph 的 `#774400`），且单元格自身样式仍然优先。
- `check-bundle.mjs`：对**给定**的产物文件跑同一套样式契约（`node tests/check-bundle.mjs <path>`），所以提交进去的产物不重新构建也能验。

因为它们验的是产物而不是源码，改了 `src/` 必须先 `npm run build`：不重建时套件可能对着旧产物全绿。`tests/render.mjs` 不在 `npm test` 里，它是开发工具——命令行给一个 `.drawio` 路径，打印尺寸并把 SVG 写到 `tests/out/rendered.svg`。

## 易崩清单

1. 改了 `src/` 忘记 `npm run build` 并提交 `lib/` → 装上的是旧产物（本仓没有产物新鲜度套件守着这条）。
2. client 包不是 `window.__ModuleLoader__.load({ id, factory })` 格式，或 `id` 与 `HANDOFF_ID` 不一致 → 浏览器加载失败，`tests/smoke.mjs` 的 handoff 断言会先红。
3. 改 client 不 bump `HANDOFF_ID` / 不硬刷新 → 浏览器跑旧 bundle（表现为"改动没生效"）。
4. `build-client.mjs` 掉了 `platform: 'browser'` → 依赖的服务端入口被内联，产物在浏览器里因 `require("module")` 直接加载失败（`tests/smoke.mjs` 的空模块表能抓到）。
5. CSS module 里 JSX 引用但 CSS 未定义的类 → `undefined`，静默无样式。
6. 样式表被引擎默认值盖过或未生效 → 没写颜色的单元格渲染成 maxGraph 的蓝/棕，`tests/style.mjs` 会红。
7. `ctx.x` 属性访问未 inject 的服务 → 抛错（用 `ctx.get('x')`）。
8. `dsh.client.inject` 漏列服务提供包 → 浏览器半边挂载时取不到服务（如预览注册表），标签页根本不出现。
9. 仓库被放进 `packages/*` 或改了根 `package.json` 的定位 → `dsh plugin add <git-url>` 会装成错误的东西。

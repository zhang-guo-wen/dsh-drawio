---
paths:
  - "src/**"
  - "tests/**"
  - "docs/**"
  - "locale/**"
---

> 覆盖什么、何时读：两种保存格式的解码、draw.io 默认样式表、边缘路由差异、尺寸计算与只读 inert 设计；**改 `src/client/` 渲染路径或解释「图怎么画得不一样」时读**。

# 图形渲染流程与技术决策

覆盖：`src/client/` 的解码与渲染路径——两种保存格式、draw.io 默认样式表、边缘路由差异、尺寸计算、只读 inert 设计。
**何时读**：改渲染路径或样式表，或要解释「图画得和 draw.io 不一样 / 颜色不对 / 尺寸不对」时。

## 渲染流程

1. `src/client/index.ts` 按扩展名把 `.drawio` 登记为预览（`extensions: ['drawio']`、`loading: 'bytes-complete'`、`wrap: false`），body 进点名座位 `sidebar.right.tab.document`。
2. `DrawioBody.tsx` 拿到字节 → `drawio.ts` 解码出 mxGraph XML（纯 XML 或 draw.io 压缩体）→ `maxgraph-loader.ts` 的 `renderDrawioDiagram(xml)` 在第一张图需要时才 `await import('./maxgraph.ts')` 取引擎 chunk。
3. `maxgraph.ts` 在离屏容器里构 `Graph`（第 4 个参数是 `drawio-style.ts`）、`setEnabled(false)`、`ModelXmlSerializer` 导入、序列化成 SVG 后转 `data:image/svg+xml` URL。
4. 呈现层把 `data:` URL 渲染成一个保持宽高比的 `<img>`；失败按值返回而不是抛进渲染（坏文件不能掀掉整个标签页），首帧是骨架、失败带重试。

## 技术决策

- **只读且 inert，面板只拿到 `data:` URL。** 解码与布局在离屏容器里完成，`setEnabled(false)` 摘掉引擎的全部交互处理器，序列化出的 `<svg>` 变成 `data:image/svg+xml` URL 后容器即被移除——面板里没有引擎实例、也没有活的 DOM，所以图里的内容无法对页面执行脚本；渲染器经 inject 面进入组件，`DrawioBody` 不持有引擎句柄。
- **两种保存格式都要认。** 文件要么是纯 mxGraph XML，要么是 draw.io 的压缩体（百分号转义 → raw DEFLATE → base64）。判定压缩体用的是 base64 字符集（不含 `<`、`>` 与空白），不依赖某个 zlib 头；inflate 用 `fflate` 而不是平台的 `DecompressionStream`，因为后者对损坏体的报告走内部 rejection、会变成未处理错误，而坏文件必须表现为本函数的 rejection；也不用 `fflate` 的 base64 字符串输入模式，它产出的字节序列与载荷不同，inflate 会失败。多页 `<mxfile>` 只渲染第一页。
- **本地渲染必须套 draw.io 的默认样式表。** 样式串里没写颜色的单元格否则会继承 maxGraph 自己的蓝/棕配色；传入 `drawio-style.ts` 后默认值变成 draw.io 的（`#dae8fc` 填充、`#6c8ebf` 描边、`#333333` 标签色），而单元格自身声明的颜色依然优先。
- **边缘路由与 draw.io 不一致是数据结构决定的，不是实现疏漏。** `.drawio` 文件只存边的两个端点与 `edgeStyle` 名称，不存路径；draw.io 编辑器在共用引擎之上另加了路由与标签避让逻辑，本插件用的引擎不含这段代码。修图要在源头修（拖动标签写出显式 `<mxPoint as="offset">`，或拉开节点间距）。
- **尺寸由图的边界决定。** 引擎会把元素撑到容器大小，所以内在尺寸取 `graph.getView().getGraphBounds()` 加 `VIEW_PADDING`（8）外扩，下限 `MIN_SIZE`（1），再显式写 `width` / `height` / `viewBox` 并删掉 `style` 属性——图片因此保持宽高比，滚动交给面板。

样式契约由 [testing.md](testing.md) 里的 `style.mjs` / `check-bundle.mjs` 守着。

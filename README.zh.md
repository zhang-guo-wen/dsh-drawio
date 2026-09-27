# dsh-drawio

[English](README.md) | 中文

## 背景：DeepSeek Harness

DeepSeek Harness（`dsh`）是 DeepSeek AI 开源的 agent harness，几乎所有能力都是 [Cordis](https://github.com/cordiverse/cordis) 插件。它处于 **developer preview** 阶段、迭代很快，会有破坏性变更（[文档站](https://deepseek-harness.github.io/deepseek-harness/)，`0.1.7-alpha.*`）；本插件是独立第三方包，`@deepseek-ai/*` 运行时从宿主解析。

## 这个插件解决什么问题

`.drawio` 文件原本只能当 mxGraph XML 源码打开；本插件在 Web 侧栏里把它渲染成你画的那张图，只读。

## 截图

![.drawio 文件渲染为图表](docs/example.png)

这张截图就是本仓的 [`docs/example.drawio`](docs/example.drawio)：`API gateway` → `Auth` → `Business logic`，指向 `Database` 的那条边上写着 `read / write`。

## 安装

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawio
```

来自 npm 官方源：<https://www.npmjs.com/package/@guowenzhang/dsh-drawio>。装完重启宿主；本地目录开发安装、git 源与排查见 [AGENTS.md](AGENTS.md)。

## 用法

### 打开图表

在文件树里打开 `.drawio` 文件，它就会在侧栏的文档标签页里打开并渲染成图表，跟打开一张图片或一个 Markdown 文件一样。解码与布局都是同步的，所以首帧就是图，而不是先给你一个加载态；图片保持图表自己的宽高比，滚动由面板提供。

### 哪些保存格式可读

| draw.io 保存为 | 文件里存的是什么 |
|---|---|
| 纯 XML | 文本形式的 mxGraph XML，可以在 diff 里 grep |
| 压缩体（draw.io 的默认） | 同一份 XML 经百分号转义、raw DEFLATE 压缩、再 base64 编码 |

### 多页图表

多页 `<mxfile>` 只渲染**第一页**。其余页仍在文件里、原样不动；要看它们请用 [dsh-drawioedit](https://github.com/zhang-guo-wen/dsh-drawioedit) 或 draw.io 打开。

### 这是预览，不是编辑器

面板是只读且惰性的。文件在屏幕外解码与布局，面板拿到的是渲染好的 SVG `data:` URL——绝不是引擎实例或活的 DOM——因此图里的内容无法对页面执行脚本。要编辑请用 [dsh-drawioedit](https://github.com/zhang-guo-wen/dsh-drawioedit)；两者是互相独立的包，可以只装其中一个。

## 注意事项

**连线绕行与边标签位置与 draw.io 不一致。** `.drawio` 文件存的是边的两个端点与 `edgeStyle` 名称，**不存中间的路径**：

```xml
<mxCell id="e4" style="edgeStyle=orthogonalEdgeStyle;…" edge="1" source="n4" target="n5">
  <mxGeometry relative="1" as="geometry" />   <!-- 没有路径点，也没有标签偏移 -->
</mxCell>
```

因此两个 viewer 都在渲染时用相同输入、**不同代码**各自计算拐点与标签位置：draw.io 编辑器在共用引擎之上加了自己的路由与标签避让逻辑，本插件用的引擎不含这段代码。当两个节点间距小于标签宽度时（相距 50px、标签宽 66px），不移动节点就没有位置能同时避开两个框，而给标签加不透明背景只会盖住底下的文字。

**变通办法。** 在 draw.io 里把边标签拖到你想要的位置：编辑器会把显式的 `<mxPoint as="offset">` 写进文件，此后**任何 viewer（包括本插件）都会遵循它**。把两个节点的间距拉宽同样有效。两者都是**在图的源头修好**，而不是只在某一个 viewer 里修。

**引擎形状集之外的形状会画成普通矩形**，而不是被略过：draw.io 自带几百个 stencil 形状，而打包进来的引擎只有它自己较小的一套。

## 许可

Apache License 2.0 —— 见 [LICENSE](LICENSE)。内联的第三方代码在 [NOTICE](NOTICE) 中署名。

"draw.io" 是其所有者的商标；本包与 draw.io 无隶属或背书关系。

## 延伸阅读

- [AGENTS.md](AGENTS.md) —— 安装变体、构建、预览如何接进侧栏，以及排查。
- [dsh-drawioedit](https://github.com/zhang-guo-wen/dsh-drawioedit) —— 姊妹插件，用上游 draw.io 编辑器就地编辑 `.drawio`。
- [docs/example.drawio](docs/example.drawio) —— 截图里的那张图，想试预览的话是个很小的文件。
- [DeepSeek Harness 文档](https://deepseek-harness.github.io/deepseek-harness/)。

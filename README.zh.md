# dsh-drawio

[English](README.md) | 中文

一个**独立**的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）插件：在 Web 侧栏中把 `.drawio` 文件预览为图表。

在侧栏文件树里打开任意 `.drawio` 文件，它会渲染成你画的那张图，而不是以 mxGraph XML 源码打开。

![.drawio 文件渲染为图表](docs/example.png)

## 这个插件有什么用

- **只读且惰性。** 文件在屏幕外解码与布局；面板拿到的是 SVG `data:` URL，而绝不是引擎实例或活的 DOM。标记不会进入
  应用 DOM，因此图里的内容无法对页面执行脚本。
- **兼容 draw.io 的两种保存格式。** 纯 mxGraph XML，以及 draw.io 的压缩体（base64 + raw DEFLATE + 百分号转义）。
  多页 `<mxfile>` 只渲染第一页。
- **文件不出本机。** 渲染完全本地完成。与托管查看器不同，任何内容都不会被上传。
- **用 draw.io 的样式，而不是引擎自带的。** 渲染器会套用一份与 draw.io 默认值一致的样式表，因此样式串里没写颜色的
  单元格，不会继承底层引擎自己的配色。单元格自身的样式依然优先。

## 安装

构建好的 `lib/` 随仓库提交，所以装完即可运行，**你这边不需要构建**。

```sh
# HTTPS
npx @deepseek-ai/dsh plugin --profile web add git+https://github.com/zhang-guo-wen/dsh-drawio.git

# 或 SSH
npx @deepseek-ai/dsh plugin --profile web add git+ssh://git@github.com/zhang-guo-wen/dsh-drawio.git
```

要对着本地 checkout 开发，就装目录。pnpm 会建**软链**，所以重建 `lib/` 后下次启动即生效，无需重装：

```sh
npx @deepseek-ai/dsh plugin --profile web add /绝对路径/dsh-drawio
```

然后重启 host：

```sh
npx @deepseek-ai/dsh web
```

**不要手写 profile 清单**：`dsh plugin add` 会同时加依赖条目与 bundle 条目。
卸载用 `dsh plugin --profile web remove @zhang-guo-wen/dsh-drawio`，依赖与层一起移除。

所安装的 profile 必须已经组合了 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview`——本插件所贡献的注册表由它拥有。
所有随附的 web profile 都满足这一点。

## 已知限制

**连线绕行与边标签位置与 draw.io 不一致。** `.drawio` 文件存的是边的两个端点与 `edgeStyle` 名称，**不存中间的路径**：

```xml
<mxCell id="e4" style="edgeStyle=orthogonalEdgeStyle;…" edge="1" source="n4" target="n5">
  <mxGeometry relative="1" as="geometry" />   <!-- 没有路径点，也没有标签偏移 -->
</mxCell>
```

因此两个 viewer 都在渲染时**各自计算**拐点与标签位置：输入相同，**代码不同**。draw.io 编辑器在共用引擎之上加了自己的
路由与标签避让逻辑，本插件用的引擎不含这段代码，于是两者会有差异：一条边可能走出不同路线；当两个节点间距小于标签宽度时，
边标签会压在节点标签上。

第二点是**几何问题而非外观问题**：两个节点相距 50px、而标签宽 66px 时，不移动节点就没有位置能同时避开两个框。
给标签加不透明背景，只会用它盖住底下的文字，观感更差，所以本渲染器不这么做。

**变通办法。** 在 draw.io 里把边标签拖到你想要的位置：编辑器会把显式的 `<mxPoint as="offset">` 写进文件，此后
**任何 viewer（包括本插件）都会遵循它**。把两个节点的间距拉宽同样有效。两者都是**在图的源头修好**，而不是只在某一个
viewer 里修。

**引擎形状集之外的形状会画成矩形。** draw.io 自带几百个 stencil 形状，而打包进来的引擎只有它自己较小的一套，
因此引擎不认识的形状会渲染成一个普通矩形，而不是被略过。

## 开发

**仓库根就是插件包**：根 `package.json` 即 `@zhang-guo-wen/dsh-drawio`。`npm install <git-url>` 与 `dsh plugin add`
打包的都是仓库根，所以放在 `packages/*` 下的插件会被装成错误的东西。

```sh
npm install
npm run build      # host 半用 tsdown；浏览器半用 build-client.mjs
npm run typecheck  # 针对「已发布」的 @deepseek-ai/* 包做 tsc
npm test           # 按浏览器的方式加载构建产物
```

`lib/` 随仓库提交——这正是别人可以零构建安装本仓库的原因。改动 `src/` 后请重新 `npm run build` 并提交 `lib/`。

### 浏览器半为什么自带打包器

harness monorepo 打客户端产物用的脚本并未发布，因此本仓库自己打包浏览器半。其中两条细节是承重的：

1. **显式设置 `platform: 'browser'`。** 在打包器的 `node` platform 下，每个依赖都按 `node` 导出条件解析；若某库的
   `exports` 把平台条件排在 `import` 之前，它的**服务端**入口就会被内联——而那些入口可能在模块作用域调用
   `createRequire('module')`，产出浏览器模块表无法应答的 `require("module")`。
2. **只有 react 与 DSH 客户端包保持 external。** 实现库被内联，因此部署产物没有安装期依赖。

`npm test` 对这两点都有校验：它用一个只含上述 external 的模块表加载产物，产物若索取其他任何东西即失败。

## 许可

Apache License 2.0 —— 见 [LICENSE](LICENSE)。内联的第三方代码在 [NOTICE](NOTICE) 中署名。
"draw.io" 是其所有者的商标；本包与 draw.io 无隶属或背书关系。

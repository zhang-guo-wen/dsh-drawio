# dsh-drawio

English | [中文](README.zh.md)

A plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) that previews `.drawio`
files as diagrams in the Web Sidebar: open one from the file tree and it renders as the diagram you drew, instead
of opening as mxGraph XML source.

![A .drawio file rendered as a diagram](docs/example.png)

Editing needs [`dsh-drawioedit`](https://github.com/zhang-guo-wen/dsh-drawioedit). The two are independent
packages; the limitations below say when this preview is enough.

## What it does

- **Read-only and inert.** The file is decoded and laid out offscreen; the pane receives an SVG `data:` URL, never
  an engine instance or a live DOM, so a diagram's content cannot script the page.
- **Both draw.io save formats.** Plain mxGraph XML, and draw.io's compressed body (base64 + raw DEFLATE + percent
  escape). A multi-page `<mxfile>` renders its first page.
- **Nothing leaves the machine, and the styling is draw.io's.** Rendering is fully local, unlike a hosted viewer.
  The renderer applies a stylesheet matching draw.io's defaults, so a cell whose style string omits a color does not
  inherit the storage engine's own palette; a cell's own style still wins.

## Install

The built `lib/` is committed, so the repository installs and runs with no build step on your machine. `dsh plugin`
adds the dependency and the profile's bundle entry together — do not edit the profile manifest by hand.

```sh
# a checkout over HTTPS or SSH, or a local one — pnpm links a local checkout, so a rebuilt
# lib/ reaches the host on the next start
npx @deepseek-ai/dsh plugin --profile web add git+https://github.com/zhang-guo-wen/dsh-drawio.git
npx @deepseek-ai/dsh plugin --profile web add git+ssh://git@github.com/zhang-guo-wen/dsh-drawio.git
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-drawio

# then restart the host
npx @deepseek-ai/dsh web
```

Remove it, dependency and layer together, with `dsh plugin --profile web remove @guowenzhang/dsh-drawio`.

The profile must already compose `@deepseek-ai/dsh-client-ui-sidebar-documentpreview`, which owns the registry this
plugin contributes to. Every shipped web profile does.

## Known limitations

**Edge routing and edge-label placement do not match draw.io.** A `.drawio` file stores an edge's endpoints and its
`edgeStyle` name, but not the path between them:

```xml
<mxCell id="e4" style="edgeStyle=orthogonalEdgeStyle;…" edge="1" source="n4" target="n5">
  <mxGeometry relative="1" as="geometry" />   <!-- no points, no label offset -->
</mxCell>
```

Both viewers therefore compute the bend points and the label position at render time from the same inputs, with
different code: draw.io's editor adds its own routing and label-avoidance behaviour on top of the shared engine, and
this plugin's engine does not carry it. Where the gap between two nodes is narrower than the label — 50px apart, 66px
label — the label cannot clear both boxes without moving a node, and an opaque background would only paint over the
text it covers.

**Workaround.** Drag the label where you want it in draw.io: the editor writes an explicit `<mxPoint as="offset">`
into the file, which every viewer honours. Widening the gap between the two nodes works equally well. Both fix the
diagram at its source rather than in one viewer.

**Shapes outside the engine's set are drawn as plain rectangles**, never omitted: draw.io ships several hundred
stencil shapes and the bundled engine carries a smaller set of its own.

## Development

The repository root **is** the plugin package: its root `package.json` is `@guowenzhang/dsh-drawio`. `npm install
<git-url>` and `dsh plugin add` both package the repository root, so a plugin under `packages/*` would install as the
wrong thing.

```sh
npm install
npm run build      # host half via tsdown; browser half via build-client.mjs
npm run typecheck  # tsc against the PUBLISHED @deepseek-ai/* packages
npm test           # loads the built bundle the way the browser does
```

Re-run `npm run build` and commit `lib/` whenever you change `src/`.

The harness monorepo builds its client bundles with a script it does not publish, so this repository bundles the
browser half itself. `platform: 'browser'` is set explicitly: under the bundler's `node` platform, a library whose
`exports` lists a platform condition before `import` gets its server entry inlined, and that entry can call
`createRequire('module')` at module scope — a `require("module")` the browser module table cannot answer. Only react
and the DSH client packages stay external, so the deployed bundle carries no install-time dependency; `npm test`
loads it with a module table holding nothing else and fails if it asks for more.

## License

Apache License 2.0 — see [LICENSE](LICENSE). Bundled third-party code is attributed in [NOTICE](NOTICE).
"draw.io" is a trademark of its owner; this package is not affiliated with or endorsed by draw.io.

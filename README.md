# dsh-drawio

English | [中文](README.zh.md)

A **standalone** plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) that previews
`.drawio` files as diagrams in the Web Sidebar.

It does not live in the harness monorepo and does not use the harness build scripts. `@deepseek-ai/*` packages are
`external` in the browser bundle and resolve from the host harness at runtime, exactly like any other third-party DSH
plugin.

## What you get

Open any `.drawio` file from the Sidebar's file tree and it renders as the diagram you drew, instead of opening as
mxGraph XML source.

- **Read-only and inert.** The file is decoded and laid out offscreen; the pane receives an SVG `data:` URL and never an
  engine instance or a live DOM. The markup never enters the application DOM, so a diagram's content cannot script the
  page.
- **Both draw.io save formats.** Plain mxGraph XML, and draw.io's compressed body (base64 + raw DEFLATE + percent
  escape). A multi-page `<mxfile>` renders its first page.
- **No file leaves your machine.** Rendering is fully local. Unlike a hosted viewer, nothing is uploaded anywhere.

## Layout

```
packages/drawio/
  src/index.ts                  host half — deliberately contributes nothing
  src/client/index.ts           registers the preview metadata and the Sidebar body
  src/client/DrawioBody.tsx     presentation component (imports no engine)
  src/client/maxgraph.ts        the only module that loads @maxgraph/core
  src/client/drawio-style.ts    draw.io's default cell styles for the engine
  src/client/drawio.ts          decode: plain XML and compressed bodies
  build-client.mjs              bundles the browser half into the loader handoff
  cordis.patch.yml              the composition row this package inserts
  lib/                          built artifacts, committed so git installs work
```

### draw.io's defaults, not maxGraph's

maxGraph's `createDefaultVertexStyle()` sets a brown `#774400` label, so a cell whose style string omits a font color
renders in a color that appears nowhere in a draw.io diagram. `src/client/drawio-style.ts` passes a `Stylesheet` with
draw.io's defaults instead: a neutral `#333333` label, the `#dae8fc` / `#6c8ebf` rectangle palette, a 12px vertex label,
an 11px edge label, and a filled arrowhead.

A cell's own style string still wins, because the engine merges it over these defaults — an explicit `fillColor`,
`strokeColor`, or `fontColor` in the file is unaffected. `tests/style.mjs` pins both halves of that contract.

## Build

```sh
npm install
npm run build      # host half via tsdown, browser half via build-client.mjs
npm run typecheck  # tsc against the PUBLISHED @deepseek-ai/* packages
npm test           # loads the built bundle the way the browser does
```

`lib/` is committed. That is what lets someone install this repository directly with git, with no build on their side.
Re-run `npm run build` and commit `lib/` whenever you change `src/`.

### Why the browser half has its own bundler

The harness monorepo builds its client bundles with `packages/client/tsdown.client.ts`, which is not published. This
repository therefore bundles the browser half itself, and two details from that builder are load-bearing:

1. **`platform: 'browser'` is set explicitly.** Under rolldown's `node` platform, every dependency resolves through its
   `node` export condition, so a library whose `exports` puts a platform condition before `import` gets its *server*
   entry inlined. Those entries can call `createRequire('module')` at module scope, producing a `require("module")` the
   browser module table cannot answer — the plugin then fails to mount.
2. **Only react and the DSH client packages stay external.** Implementation libraries (`@maxgraph/core`, `fflate`) are
   inlined, so the deployed artifact has no install-time dependency, while a browser-safe DSH utility
   (`@deepseek-ai/dsh-util-workspace-path`) is inlined rather than requested from the module table.

The build verifies both: `npm test` loads the built bundle with a module table containing nothing but `react`,
`react/jsx-runtime`, and the workspace-path utility, and fails if the bundle asks for anything else.

## Install

The plugin is installed into a DSH profile, not into the harness checkout:

```sh
cd "$DSH_HOME/profiles/web"
npm install <path-or-git-url-to-this-repo>/packages/drawio --legacy-peer-deps --no-package-lock --no-audit --no-fund
```

Then register it as a **profile bundle** in that profile's `package.json`. A plugin row is not inserted by hand: the
profile applies each bundle's own `cordis.patch.yml`, which is what this package ships. Both lists must name it.

```jsonc
{
  "dsh": {
    "profile": {
      "bundles": [
        // …existing bundles…
        "@zhang-guo-wen/dsh-drawio"
      ]
    }
  },
  "dependencies": {
    // …existing dependencies…
    "@zhang-guo-wen/dsh-drawio": "file:C:/path/to/this-repo/packages/drawio"
  }
}
```

Restart the host. Verify the composition resolved before booting:

```sh
dsh --profile web --dump-config | grep -A2 drawio
```

`--legacy-peer-deps` is needed only when the profile already carries a third-party plugin with an unsatisfiable peer
range; `--no-package-lock` keeps npm from writing a lockfile into a pnpm-managed profile.

> The installed profile must already compose `@deepseek-ai/dsh-client-ui-sidebar-documentpreview`, which owns the
> `documentPreviews` registry this plugin contributes to. Every shipped web profile does.
>
> The `npm install` is what creates the `node_modules` junction (or symlink) pointing at this repository, so rebuilding
> `lib/` here is picked up without reinstalling.

## Known limitations

**Edge routing and edge-label placement do not match draw.io.** A `.drawio` file stores an edge's endpoints
(`source`, `target`) and its `edgeStyle` name, but **not the path between them**:

```xml
<mxCell id="e4" style="edgeStyle=orthogonalEdgeStyle;…" edge="1" source="n4" target="n5">
  <mxGeometry relative="1" as="geometry" />   <!-- no points, no label offset -->
</mxCell>
```

Both viewers therefore *compute* the bend points and the label position at render time, from the same inputs, using
**different code**. draw.io's editor adds its own routing and label-avoidance behaviour on top of mxGraph, and maxGraph
does not carry that code, so the two can differ:

- an edge may take a different route (an extra bend, or a different side of a node);
- an edge label may land on a node label when the gap between two nodes is narrower than the label.

The second is geometric, not cosmetic: when two nodes are 50px apart and the label is 66px wide, it cannot be placed
outside both boxes without moving a node. Giving the label an opaque background only paints a box over the text it
covers, which reads worse, so this renderer does not do it.

**Workarounds.** In draw.io, drag the edge label to where you want it: the editor then writes an explicit
`<mxPoint as="offset">` into the file, and every viewer — including this one — will honour it. Widening the gap between
the two nodes works equally well. Both fix the diagram at its source rather than in one viewer.

Everything a `Stylesheet` decides **does** match draw.io; see [draw.io's defaults](#drawio8217s-defaults-not-maxgraphs)
above.

## Requirements

| | |
|---|---|
| Harness | a build whose published `@deepseek-ai/dsh-client-*` line is `0.1.5-rc.2` (the version this repo type-checks against) |
| Browser | any Chromium/Firefox/Safari the harness Web GUI supports |
| Node | 22+ (build only) |

## License

Apache-2.0. Bundled third-party code is attributed in [NOTICE](NOTICE).

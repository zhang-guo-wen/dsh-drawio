---
description: "draw.io (.drawio / mxGraph XML) document preview for the DeepSeek Harness Web Sidebar."
---

# @zhang-guo-wen/dsh-drawio

English | [中文](README.zh.md)

Standalone [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that previews `.drawio` files as
diagrams in the Web Sidebar. See the [repository README](../../README.md) for build, install, and licensing details.

## What it contributes

| | |
|---|---|
| Preview metadata | `ctx.documentPreviews` — the `drawio` suffix, `loading: 'bytes-complete'`, `wrap: false`, at the `extension` band so it outranks the builtin plain-text fallback |
| Body | the keyed `sidebar.right.tab.document` slot, under id `@zhang-guo-wen/dsh-drawio` |
| Copy | the `sidebarDrawio` locale namespace (zh, en) |
| Host half | nothing — `src/index.ts` is a no-op, because the preview is entirely browser-side |

The renderer is handed to the body through the entry's inject face as `createRenderer`, so the presentation component
imports no engine.

## Bundled code

`@maxgraph/core` (Apache-2.0) and `fflate` (MIT) are inlined into `lib/client.js`. Attribution lives in the repository
[NOTICE](../../NOTICE).

## Peer contract

`@deepseek-ai/*` packages are `external` and resolve from the host harness. The installed profile must compose
`@deepseek-ai/dsh-client-ui-sidebar-documentpreview`, which owns the registry this plugin writes to.

## Known limitations

Edge routing and edge-label placement differ from draw.io: a `.drawio` file stores an edge's endpoints and `edgeStyle`
name but not its path, so each viewer computes the bend points and label position with its own code. maxGraph does not
carry draw.io's editor-level routing and label-avoidance logic. Styling — colours, fonts, sizes, arrowheads — does
match draw.io. See [Known limitations](../../README.md#known-limitations) in the repository README for the workaround.

## Build

```sh
npm run build      # from this package, or `npm run build` at the repo root
npm run typecheck
npm test
```

`lib/` is committed so this repository installs from git without a build step.

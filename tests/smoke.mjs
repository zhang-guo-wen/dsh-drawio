// tests/smoke.mjs — load the BUILT lib/client.js exactly as the browser module
// table would, inside jsdom, and prove:
//   1. the factory asks for nothing the shell does not seed (no node core module);
//   2. the plugin registers its dictionary, preview metadata, and keyed body;
//   3. the injected renderer really draws, so the inlined fflate survived the
//      standalone bundle with no harness package at runtime — and the graphics
//      engine arrives on demand, as its own package-local chunk.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { createChunkRequire } from './chunk-loader.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
const { window } = new JSDOM('<!doctype html><html><body></body></html>')

const react = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  useEffect: () => {},
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }),
  useState: (value) => [value, () => {}],
}
const jsxRuntime = { jsx: react.createElement, jsxs: react.createElement, Fragment: 'Fragment' }
const workspacePath = {
  pathPartsOf: (path) => {
    const normalized = path.replaceAll('\\', '/')
    return {
      directory: normalized.slice(0, normalized.lastIndexOf('/')),
      name: normalized.slice(normalized.lastIndexOf('/') + 1),
    }
  },
}

// The browser module table: only what the shell seeds. A request for a node core
// module (e.g. `module`) must therefore throw, which is what the real loader does.
const table = {
  react,
  'react/jsx-runtime': jsxRuntime,
  '@deepseek-ai/dsh-util-workspace-path': workspacePath,
}

const DIAGRAM = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
  + '<mxCell id="n1" value="Start" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">'
  + '<mxGeometry x="40" y="40" width="120" height="60" as="geometry"/></mxCell>'
  + '<mxCell id="n2" value="End" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">'
  + '<mxGeometry x="240" y="40" width="120" height="60" as="geometry"/></mxCell>'
  + '<mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;" edge="1" parent="1" source="n1" target="n2">'
  + '<mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel>'

// maxGraph reads browser globals (DOMParser, XMLSerializer, Node, Element) off the
// ambient scope, and it does so while the factory runs — not only while the bundle
// is evaluated. Publish the jsdom implementations onto this realm's globals for the
// whole scenario, so the bundle, jsdom, and maxGraph share ONE realm; a `vm`
// sandbox would put the bundle in a second realm and break maxGraph's node
// identity checks.
const AMBIENT = [
  'document', 'navigator', 'DOMParser', 'XMLSerializer', 'Node', 'Element', 'HTMLElement',
  'SVGElement', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'CSSStyleDeclaration', 'Image', 'Blob',
]

async function scenario() {
  window.__ModuleLoader__ = { load: (handoff) => { window.__handoff = handoff } }
  new Function('window', source)(window)

  const handoff = window.__handoff
  assert.ok(handoff, 'client bundle did not register a handoff')
  assert.equal(handoff.id, '@guowenzhang/dsh-drawio', 'handoff id mismatch')
  assert.equal(typeof handoff.factory, 'function', 'handoff factory missing')

  const requested = []
  const { require, served } = createChunkRequire({
    root,
    window,
    id: '@guowenzhang/dsh-drawio',
    resolve: (specifier) => {
      requested.push(specifier)
      if (!Object.hasOwn(table, specifier)) throw new Error(`missed the module table: ${specifier}`)
      return table[specifier]
    },
  })
  const moduleExports = handoff.factory(require)
  console.log('factory requested:', requested.join(', ') || '(none)')
  // The engine is a chunk, so booting the plugin must not have fetched it.
  assert.deepEqual(served, [], 'the entry must not fetch a chunk while it loads')

  assert.equal(typeof moduleExports.apply, 'function', 'plugin exports no apply')
  assert.equal([...moduleExports.inject].join(','), 'slots,locale,documentPreviews', 'inject list mismatch')

  const registered = { dictionaries: null, metadata: null, body: null }
  moduleExports.apply({
    effect: (fn) => fn(),
    locale: {
      register: (namespace, dictionaries) => { registered.dictionaries = { namespace, dictionaries }; return () => {} },
      bind: () => (key) => key,
    },
    documentPreviews: { register: (definition) => { registered.metadata = definition; return () => {} } },
    slots: {
      inject: (_name, callback) => callback(),
      register: (options, component) => { registered.body = { options, component }; return () => {} },
    },
  })

  assert.equal(registered.dictionaries.namespace, 'sidebarDrawio', 'dictionary namespace mismatch')
  assert.equal([...registered.metadata.extensions].join(','), 'drawio', 'suffix list mismatch')
  assert.equal(registered.metadata.loading, 'bytes-complete', 'loading mode mismatch')
  assert.equal(registered.body.options.name, 'sidebar.right.tab.document', 'slot name mismatch')

  // Drawing proves the on-demand engine works without any harness package: the
  // render awaits the loader, which fetches `client.maxgraph.js` through the
  // factory's asynchronous require.
  const face = registered.body.options.inject()
  const diagram = await face.renderDiagram(DIAGRAM)
  assert.match(diagram.url, /^data:image\/svg\+xml/, 'renderer produced no svg data url')
  assert.ok(diagram.width > 0 && diagram.height > 0, 'renderer produced no size')
  assert.deepEqual(served, ['client.maxgraph.js'], 'the first diagram must fetch the engine chunk once')

  // A second diagram reuses the materialized chunk.
  await face.renderDiagram(DIAGRAM)
  assert.deepEqual(served, ['client.maxgraph.js'], 'the engine chunk must be fetched once')

  console.log(`OK: no node-core request; registers; fetched ${served.join(',')}; drew ${diagram.width}x${diagram.height} diagram`)
}

const restore = new Map()
for (const key of AMBIENT) {
  // Only an OWN global is one this test introduced; an inherited one must simply
  // be replaced, then restored by deleting the own property afterwards.
  restore.set(key, Object.hasOwn(globalThis, key) ? Object.getOwnPropertyDescriptor(globalThis, key) : null)
  const value = window[key]
  if (value !== undefined) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
}

let failure
try {
  await scenario()
} catch (error) {
  failure = error
} finally {
  for (const [key, descriptor] of restore) {
    if (descriptor === null || descriptor === undefined) Reflect.deleteProperty(globalThis, key)
    else Object.defineProperty(globalThis, key, descriptor)
  }
}
if (failure !== undefined) throw failure

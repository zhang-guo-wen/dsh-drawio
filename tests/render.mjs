// tests/render.mjs — render a .drawio path given on the command line through the
// BUILT bundle and print the resulting SVG, for eyeballing a real file. The
// engine arrives from its own chunk, loaded the way the module loader loads it.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { JSDOM } from 'jsdom'
import { createChunkRequire } from './chunk-loader.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
const { window } = new JSDOM('<!doctype html><html><body></body></html>')

const react = {
  createElement: () => ({}), useEffect: () => {}, useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }), useState: (value) => [value, () => {}],
}
const table = {
  react,
  'react/jsx-runtime': { jsx: react.createElement, jsxs: react.createElement },
  '@deepseek-ai/dsh-util-workspace-path': { pathPartsOf: (p) => ({ directory: '', name: p }) },
}
const AMBIENT = [
  'window', 'document', 'navigator', 'DOMParser', 'XMLSerializer', 'Node', 'Element', 'HTMLElement',
  'SVGElement', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'CSSStyleDeclaration', 'Image', 'Blob',
]
for (const key of AMBIENT) {
  const value = window[key]
  if (value !== undefined) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
}

window.__ModuleLoader__ = { load: (handoff) => { window.__handoff = handoff } }
new Function('window', source)(window)
const { require } = createChunkRequire({
  root,
  window,
  id: '@guowenzhang/dsh-drawio',
  resolve: (s) => table[s],
})
const moduleExports = window.__handoff.factory(require)
const registered = { body: null }
moduleExports.apply({
  effect: (fn) => fn(),
  locale: { register: () => () => {}, bind: () => (k) => k },
  documentPreviews: { register: () => () => {} },
  slots: { inject: (_n, cb) => cb(), register: (o, c) => { registered.body = { options: o, component: c }; return () => {} } },
})

const target = process.argv[2]
const xml = readFileSync(target, 'utf8')
const diagram = await registered.body.options.inject().renderDiagram(xml)
const svg = decodeURIComponent(diagram.url.slice('data:image/svg+xml;charset=utf-8,'.length))
const out = join(root, 'tests', 'out')
const { mkdirSync, writeFileSync } = await import('node:fs')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'rendered.svg'), svg)
console.log(`size ${diagram.width}x${diagram.height} → tests/out/rendered.svg`)
console.log('label colors:', [...new Set(svg.match(/<g fill="(#[0-9a-fA-F]{6})"[^>]*font-family/g) ?? [])])

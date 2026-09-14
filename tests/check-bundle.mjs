// tests/check-bundle.mjs — run the style contract against a *given* built
// bundle, so a committed artifact can be validated without trusting a rebuild.
// Usage: node tests/check-bundle.mjs <path-to-client.js>
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { JSDOM } from 'jsdom'

const here = join(dirname(fileURLToPath(import.meta.url)), '..')
const bundlePath = process.argv[2] ?? join(here, 'lib', 'client.js')
const source = readFileSync(bundlePath, 'utf8')
console.log('bundle:', bundlePath)
console.log('  bytes:', source.length)
console.log('  contains 774400 (maxGraph brown):', source.includes('774400'))
console.log('  contains 333333 (draw.io gray)  :', source.includes('333333'))

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
const moduleExports = window.__handoff.factory((s) => table[s])
const registered = { body: null }
moduleExports.apply({
  effect: (fn) => fn(),
  locale: { register: () => () => {}, bind: () => (k) => k },
  documentPreviews: { register: () => () => {} },
  slots: { inject: (_n, cb) => cb(), register: (o, c) => { registered.body = { options: o, component: c }; return () => {} } },
})

const svg = decodeURIComponent(registered.body.options.inject().createRenderer().render(
  '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
  + '<mxCell id="n1" value="Default" vertex="1" parent="1">'
  + '<mxGeometry x="20" y="20" width="120" height="50" as="geometry"/></mxCell></root></mxGraphModel>',
).url.slice('data:image/svg+xml;charset=utf-8,'.length))

const fill = /fill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1]
const label = /<g fill="(#[0-9a-fA-F]{6})"[^>]*font-family/.exec(svg)?.[1]
console.log('  rendered default fill :', fill)
console.log('  rendered label colour :', label)
console.log('  label uses 774400     :', svg.includes('774400'))

const ok = fill === '#dae8fc' && label === '#333333' && !svg.includes('774400')
console.log(ok ? '  RESULT: PASS (draw.io defaults)' : '  RESULT: FAIL (maxGraph defaults still in effect)')
process.exitCode = ok ? 0 : 1

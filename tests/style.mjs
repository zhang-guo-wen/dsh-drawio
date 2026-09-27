// tests/style.mjs — the renderer must apply draw.io's defaults and still let a
// cell's own style win. Loads the BUILT bundle, so this covers the shipped artifact.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

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
const restore = new Map()
for (const key of AMBIENT) {
  restore.set(key, Object.hasOwn(globalThis, key) ? Object.getOwnPropertyDescriptor(globalThis, key) : null)
  const value = window[key]
  if (value !== undefined) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
}

function scenario() {
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
  const renderer = registered.body.options.inject().createRenderer()

  const svgOf = (xml) => {
    const diagram = renderer.render(xml)
    return decodeURIComponent(diagram.url.slice('data:image/svg+xml;charset=utf-8,'.length))
  }

  // The engine puts the label color on the enclosing <g>, not on <text>.
  const labelColor = (svg) => /<g fill="(#[0-9a-fA-F]{6})"[^>]*font-family/.exec(svg)?.[1]

  // A cell with NO style string at all: the engine's defaults decide every color.
  const bare = svgOf(
    '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
    + '<mxCell id="n1" value="Default" vertex="1" parent="1">'
    + '<mxGeometry x="20" y="20" width="120" height="50" as="geometry"/></mxCell></root></mxGraphModel>',
  )
  const fill = /fill="(#[0-9a-fA-F]{6})"/.exec(bare)?.[1]
  const stroke = /stroke="(#[0-9a-fA-F]{6})"/.exec(bare)?.[1]
  const font = labelColor(bare)
  console.log('style-less cell →', { fill, stroke, font })

  assert.equal(fill, '#dae8fc', 'default fill is not draw.io blue')
  assert.equal(stroke, '#6c8ebf', 'default stroke is not draw.io border')
  assert.equal(font, '#333333', 'default label color is not draw.io neutral gray')
  assert.ok(!bare.includes('#774400'), 'maxGraph brown label color leaked into the output')

  // A cell that states its own colors: the file must win over the defaults.
  const explicit = svgOf(
    '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
    + '<mxCell id="n1" value="Explicit" style="fillColor=#ff0000;strokeColor=#00ff00;fontColor=#0000ff;" vertex="1" parent="1">'
    + '<mxGeometry x="20" y="20" width="120" height="50" as="geometry"/></mxCell></root></mxGraphModel>',
  )
  console.log('explicit cell   →', {
    fill: /fill="(#[0-9a-fA-F]{6})"/.exec(explicit)?.[1],
    stroke: /stroke="(#[0-9a-fA-F]{6})"/.exec(explicit)?.[1],
    font: labelColor(explicit),
  })
  assert.ok(explicit.includes('#ff0000'), 'explicit fillColor was overridden')
  assert.ok(explicit.includes('#00ff00'), 'explicit strokeColor was overridden')
  assert.ok(explicit.includes('#0000ff'), 'explicit fontColor was overridden')

  console.log('OK: draw.io defaults applied, cell styles still win')
}

let failure
try { scenario() } catch (error) { failure = error } finally {
  for (const [key, descriptor] of restore) {
    if (descriptor === null || descriptor === undefined) Reflect.deleteProperty(globalThis, key)
    else Object.defineProperty(globalThis, key, descriptor)
  }
}
if (failure !== undefined) throw failure

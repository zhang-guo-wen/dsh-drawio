// tests/bundle-shape.mjs — the committed client artifacts must keep the split
// that makes the plugin cheap to boot: the entry carries the plugin and the
// package-local chunk protocol, and the 1.07 MB graphics engine rides in its own
// chunk that only `require.async` can fetch.
//
// This is a regression guard, not a size target. Booting the plugin must not
// parse or execute the engine, and the module loader cannot answer a synchronous
// relative require, so both would show up here as a red suite instead of as a
// broken tab in a browser.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const entry = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
const chunk = readFileSync(join(root, 'lib', 'client.maxgraph.js'), 'utf8')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

console.log('entry bytes:', entry.length)
console.log('engine chunk bytes:', chunk.length)

// The engine's own module markers: present in the chunk, absent from the entry.
for (const marker of ['@maxgraph/core', 'CellRenderer']) {
  assert.ok(chunk.includes(marker), `the engine chunk must carry ${marker}`)
  assert.ok(!entry.includes(marker), `the entry must not carry ${marker}`)
}

// A synchronous relative require is a guaranteed runtime miss: only a chunk
// fetched by `require.async` is materialized by the module loader.
assert.ok(entry.includes('require.async("./client.maxgraph.js")'), 'the entry must reach the engine through require.async')
assert.ok(!/require\((["'])\.\/client/u.test(entry), 'the entry must keep no synchronous relative require')
assert.ok(!/require\((["'])\.\/client/u.test(chunk), 'a chunk must keep no synchronous relative require')

// The registration the module loader keys on: the entry under the package id,
// the chunk under the same id plus its file name.
assert.match(entry, /__ModuleLoader__\.load\(\{\s*id: "@guowenzhang\/dsh-drawio",\s*factory:/u, 'the entry must register under the package id')
assert.match(chunk, /__ModuleLoader__\.load\(\{\s*id: "@guowenzhang\/dsh-drawio",\s*chunk: "client\.maxgraph\.js",\s*factory:/u, 'the chunk must register as client.maxgraph.js')

// Generous bound: the engine alone is 1.07 MB, so anything that pulls it back
// into the entry lands far above this.
assert.ok(entry.length < 512 * 1024, `the entry must stay small without the engine (${entry.length} bytes)`)

// The publication view must ship the chunk: `files` is the whole published
// payload, and a chunk outside it is a 404 in the loader.
assert.ok(
  manifest.files.some(pattern => pattern === 'lib/client.*.js' || pattern === 'lib'),
  'package.json files must cover the client chunk',
)

console.log('OK: engine is a chunk reached only through require.async; entry keeps no synchronous relative require')

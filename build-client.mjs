// build-client.mjs — bundle src/client into the DSH client-loader handoff format.
// window.__ModuleLoader__.load({ id, chunk?, factory }). React external; the
// graphics engine lands in its own on-demand chunk.
//
// This replaces the harness monorepo's `packages/client/tsdown.client.ts`, which is
// not published. Two details from that builder are load-bearing here:
//
//   1. `platform: 'browser'` is stated explicitly. Under platform `node`, rolldown
//      resolves each dependency through its `node` export condition, so a library
//      whose `exports` lists a platform condition before `import` gets its
//      server entry inlined — and that entry may `createRequire('module')` at module
//      scope, which the browser module table cannot answer.
//   2. Only react and @deepseek-ai/* stay external. Everything else (fflate) is
//      inlined, so the deployed artifact has no install-time dependency.
//
// `@maxgraph/core` is 1.10 MB of the 1.13 MB single-file bundle and is needed only
// once a `.drawio` document is actually opened, so the source reaches it through
// `import()` in maxgraph-loader.ts. Rolldown emits that as the sibling chunk
// `client.maxgraph.js`; the entry keeps none of the engine.
import { rolldown } from 'rolldown'
import { transform } from 'lightningcss'
import { readdir, readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const HANDOFF_ID = '@guowenzhang/dsh-drawio'
const VIRT = '\0dsh-css:'
const SUFFIX = '.mjs'

/** One package-local chunk, in the shape the module loader accepts. */
const CHUNK_FILE = /^client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js$/

const footer = 'return module.exports; } });'
const intro = 'var module = { exports: {} }; var exports = module.exports;'

/**
 * One handoff registration. The entry registers under the package id; a chunk
 * registers the same id plus its file name, which the module loader keys as
 * `<ownerId>/<fileName>` and resolves through the entry bundle's own URL.
 */
function registration(fileName, isEntry) {
  const chunk = isEntry ? '' : `chunk: ${JSON.stringify(fileName)}, `
  return `window.__ModuleLoader__.load({ id: ${JSON.stringify(HANDOFF_ID)}, ${chunk}factory: (require) => {`
}

// CSS Modules are compiled to a hashed class map plus one deduplicated <style> tag.
// Idempotence keeps repeated mounts from piling up duplicate sheets.
const cssModulePlugin = {
  name: 'dsh-css-modules-inline',
  resolveId(source, importer) {
    if (!source.endsWith('.module.css')) return null
    const abs = importer ? join(dirname(importer), source) : source
    return VIRT + abs + SUFFIX
  },
  async load(id) {
    if (!id.startsWith(VIRT)) return null
    const fileId = id.slice(VIRT.length, -SUFFIX.length)
    this.addWatchFile?.(fileId)
    const css = await readFile(fileId)
    const { code, exports: cssExports } = transform({
      filename: fileId,
      code: css,
      cssModules: { pattern: '[hash]_[local]' },
      minify: true,
    })
    const classMap = {}
    // lightningcss's `exports` object does not carry a stable key order, so an
    // unsorted walk makes JSON.stringify emit the same entries in a different
    // sequence on every build — behaviourally identical output, but a
    // different byte-for-byte artifact and a spurious diff in the committed
    // lib/. Sorting the local names fixes the emitted order.
    for (const local of Object.keys(cssExports ?? {}).sort()) {
      classMap[local] = cssExports[local].name
    }
    const tagId = HANDOFF_ID + '/' + fileId.split(/[\\/]/).pop()
    return [
      'const css = ' + JSON.stringify(String(code)) + ';',
      'const tagId = ' + JSON.stringify(tagId) + ';',
      "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
      "  const tag = document.createElement('style');",
      '  tag.dataset.pluginCss = tagId;',
      '  tag.textContent = css;',
      '  document.head.appendChild(tag);',
      '}',
      'export default ' + JSON.stringify(classMap) + ';',
    ].join('\n')
  },
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Route package-local dynamic chunks through the loader's asynchronous require.
 * Rolldown renders `import('./x.ts')` in CJS output as a deferred synchronous
 * `require`, which resolves nothing: a chunk is a separate script the loader has
 * to fetch first, and only the factory's `require.async` does that.
 */
function asyncChunkRequirePlugin() {
  return {
    name: 'dsh-client-async-chunk-require',
    renderChunk(code, chunk, outputOptions) {
      if (outputOptions.format !== 'cjs') return null
      const replacements = []
      for (const dynamicImport of chunk.dynamicImports) {
        const fileName = dynamicImport.startsWith('./') ? dynamicImport.slice(2) : dynamicImport
        if (!CHUNK_FILE.test(fileName)) continue
        const specifier = `./${fileName}`
        const deferred = new RegExp(
          `Promise\\.resolve\\(\\)\\.then\\(\\(\\)\\s*=>\\s*require\\((['"])${escapeRegExp(specifier)}\\1\\)\\)`,
          'gu',
        )
        const matches = [...code.matchAll(deferred)]
        if (matches.length === 0) {
          throw new Error(`client bundle compiler: dynamic chunk ${JSON.stringify(specifier)} has no generated import expression`)
        }
        for (const match of matches) {
          replacements.push({ at: match.index, length: match[0].length, call: `require.async(${JSON.stringify(specifier)})` })
        }
      }
      if (replacements.length === 0) return null
      let next = ''
      let cursor = 0
      for (const replacement of replacements.sort((left, right) => left.at - right.at)) {
        next += code.slice(cursor, replacement.at) + replacement.call
        cursor = replacement.at + replacement.length
      }
      return next + code.slice(cursor)
    },
  }
}

// Externals are exactly what the shell seeds through `PLATFORM_MODULES`, plus the
// DSH client packages the host loads as their own module-graph rows. A
// browser-safe utility such as `@deepseek-ai/dsh-util-workspace-path` is NOT
// external: it is inlined, matching the harness builder's INLINE_SAFE policy, so
// the deployed artifact never asks the module table for it.
const EXTERNAL = [
  /^react$/,
  /^react\//,
  /^@deepseek-ai\/cordis(\/|$)/,
  /^@deepseek-ai\/dsh-client-locale(\/|$)/,
  /^@deepseek-ai\/dsh-client-ui-renderer(\/|$)/,
  /^@deepseek-ai\/dsh-client-ui-slots(\/|$)/,
  /^@deepseek-ai\/dsh-client-ui-sidebar-documentpreview(\/|$)/,
]

const lib = join(root, 'lib')
const bundle = await rolldown({
  input: { client: join(root, 'src', 'client', 'index.ts') },
  platform: 'browser',
  external: EXTERNAL,
  plugins: [cssModulePlugin, asyncChunkRequirePlugin()],
})

const written = await bundle.write({
  format: 'cjs',
  dir: lib,
  entryFileNames: 'client.js',
  // The imported source basename becomes the published chunk name, so the
  // `files` entry for `lib/client.*.js` already ships it.
  chunkFileNames: 'client.[name].js',
  banner: chunk => registration(chunk.fileName, chunk.isEntry),
  footer,
  intro,
  sourcemap: false,
})
// Entry and every chunk are rewritten by the same run, so stale outputs are
// swept only after a successful write: a failed build leaves the tracked
// artifacts it did not replace exactly as they were.
const emitted = new Set(written.output.map(output => output.fileName))
for (const entry of await readdir(lib).catch(() => [])) {
  if (!/^client(\.[^/]+)?\.js$/.test(entry) || emitted.has(entry)) continue
  await rm(join(lib, entry), { force: true })
}
console.log(`lib/${[...emitted].sort().join(', lib/')} written (ModuleLoader handoff bundle)`)

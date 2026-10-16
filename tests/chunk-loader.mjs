// tests/chunk-loader.mjs — serve this package's dynamic chunks the way the Client
// module loader does, so a built entry can be exercised with the graphics engine
// in its own artifact. Only the loader is shared here; each suite keeps its own
// module table and its own ambient globals.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Build the `require` handed to a handoff factory, including the asynchronous
 * operation that fetches one package-local chunk.
 *
 * Materialization is cached per chunk file, exactly as the module loader caches
 * it: a second `import()` of the same chunk must not mean a second fetch.
 * @param options.root - package root holding `lib/`.
 * @param options.window - the jsdom window the chunk script executes against.
 * @param options.id - the package handoff id every registration must carry.
 * @param options.resolve - synchronous module-table lookup for the chunk's own requires.
 * @returns the require function and the chunk file names actually fetched, in order.
 */
export function createChunkRequire({ root, window, id, resolve }) {
  const served = []
  const materialized = new Map()
  const require = (specifier) => resolve(specifier)
  require.async = async (specifier) => {
    if (!specifier.startsWith('./')) throw new Error(`not a package-local chunk: ${specifier}`)
    const fileName = specifier.slice(2)
    const cached = materialized.get(fileName)
    if (cached !== undefined) return cached
    served.push(fileName)
    const source = readFileSync(join(root, 'lib', fileName), 'utf8')
    // The chunk registers through the same facade the entry used, so it has to be
    // read out of that facade rather than out of a per-file variable.
    const outer = window.__handoff
    window.__handoff = undefined
    new Function('window', source)(window)
    const registration = window.__handoff
    window.__handoff = outer
    if (registration === undefined) throw new Error(`chunk ${fileName} registered no handoff`)
    if (registration.id !== id) throw new Error(`chunk ${fileName} registered id ${registration.id}`)
    if (registration.chunk !== fileName) throw new Error(`chunk ${fileName} registered chunk name ${registration.chunk}`)
    const exports = registration.factory(require)
    materialized.set(fileName, exports)
    return exports
  }
  return { require, served }
}

/**
 * The one entry point to the draw.io renderer.
 *
 * `@maxgraph/core` is 1.10 MB of this package's client bundle and is needed only
 * once a `.drawio` document is actually opened, so the preview reaches it through
 * this dynamic import: the build emits it as `lib/client.maxgraph.js`, which the
 * module loader fetches on first use. Drawing itself stays on the main thread —
 * the engine builds its SVG through the DOM.
 */
import type { RenderedDiagram } from './renderer.ts'

/**
 * Draw one decoded diagram, loading the graphics engine on first use.
 * @param xml - decoded mxGraph XML.
 * @returns the rendered image and its disposer.
 * @throws when the XML is not a diagram the engine can lay out.
 */
export async function renderDrawioDiagram(xml: string): Promise<RenderedDiagram> {
  const { createMaxgraphRenderer } = await import('./maxgraph.ts')
  return createMaxgraphRenderer().render(xml)
}

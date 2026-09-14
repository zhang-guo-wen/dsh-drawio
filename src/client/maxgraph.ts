/**
 * maxGraph-backed drawio renderer.
 *
 * This is the only module in the package that loads `@maxgraph/core`. The
 * engine builds its layout into an offscreen container the component never
 * mounts; the resulting `<svg>` is serialized into a `data:` URL so the
 * component stays pure presentation and carries no engine handle.
 *
 * The engine renders read-only here: `setEnabled(false)` removes every
 * interaction handler, so none of the stylesheet, image, or image-base-path
 * configuration the interactive features require applies.
 */
import { Graph, ModelXmlSerializer } from '@maxgraph/core'
import { DRAWIO_STYLESHEET } from './drawio-style.ts'
import type { DrawioRenderer, RenderedDiagram } from './renderer.ts'

/** Padding around the diagram's bounding box, in diagram units, so strokes and edge labels stay inside the view. */
const VIEW_PADDING = 8

/** Minimum rendered size, avoiding a zero-sized viewBox for an empty diagram. */
const MIN_SIZE = 1

/** Root elements the engine accepts; anything else is a malformed `.drawio` file. */
const DIAGRAM_ROOT = /<(mxGraphModel|mxfile)[\s>]/u

/**
 * Serialize an `<svg>` for use as an image source.
 * @param svg - the engine's rendered element.
 * @returns an SVG `data:` URL.
 */
function serialize(svg: SVGSVGElement): string {
  const markup = new XMLSerializer().serializeToString(svg)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

/**
 * Build the renderer that draws diagrams with maxGraph.
 * @returns a renderer whose diagrams are self-contained `data:` URLs.
 */
export function createMaxgraphRenderer(): DrawioRenderer {
  return {
    render(xml: string): RenderedDiagram {
      if (!DIAGRAM_ROOT.test(xml)) throw new Error('drawio: document has no diagram root')
      const container = document.createElement('div')
      document.body.appendChild(container)
      try {
        // draw.io's defaults, not maxGraph's: a cell whose style omits a color
        // must not inherit maxGraph's own blue/brown palette.
        const graph = new Graph(container, undefined, undefined, DRAWIO_STYLESHEET)
        // Read-only: the pane presents the document rather than editing it.
        graph.setEnabled(false)
        new ModelXmlSerializer(graph.getDataModel()).import(xml)
        graph.getView().validate()
        graph.refresh()
        const svg = container.querySelector('svg')
        /* v8 ignore next 2 -- the engine always renders an <svg> into a non-null container; this arm only guards a future engine change */
        if (svg === null) throw new Error('drawio: the engine produced no diagram')
        const bounds = graph.getView().getGraphBounds()
        const width = Math.max(MIN_SIZE, Math.ceil(bounds.width + VIEW_PADDING * 2))
        const height = Math.max(MIN_SIZE, Math.ceil(bounds.height + VIEW_PADDING * 2))
        // The engine sizes the element to its container; the intrinsic size must
        // come from the diagram's own bounds so the image keeps its aspect ratio.
        svg.setAttribute('width', String(width))
        svg.setAttribute('height', String(height))
        svg.setAttribute('viewBox', `${bounds.x - VIEW_PADDING} ${bounds.y - VIEW_PADDING} ${width} ${height}`)
        svg.removeAttribute('style')
        const url = serialize(svg)
        // The serialized markup is self-contained, so the layout container never
        // becomes part of the page, not even for the life of the tab.
        container.remove()
        return { url, width, height, dispose: () => {} }
      } catch (error: unknown) {
        container.remove()
        throw error
      }
    },
  }
}

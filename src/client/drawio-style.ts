/**
 * draw.io's default cell styles for the maxGraph engine.
 *
 * maxGraph's own defaults are not draw.io's. Its `createDefaultVertexStyle()`
 * sets a brown `#774400` label, so any cell whose style string omits a font
 * color inherits a color that appears nowhere in a draw.io diagram; the visible
 * symptom is brownish label text on diagrams authored in draw.io, where the
 * default label color is a neutral dark gray.
 *
 * These values mirror the stylesheet draw.io applies. A cell's own style string
 * still wins: the engine merges the cell style over these defaults, so an
 * explicit `fillColor`, `strokeColor`, or `fontColor` in the file is unaffected.
 */
import { Stylesheet } from '@maxgraph/core'

/**
 * draw.io's neutral label color, replacing maxGraph's brown `#774400`.
 *
 * `fontFamily` is deliberately not set: maxGraph already defaults to
 * `Arial,Helvetica,sans-serif`, which is draw.io's stack too.
 */
const FONT_COLOR = '#333333'

/** draw.io's default vertex label size, 12 rather than maxGraph's 11. */
const VERTEX_FONT_SIZE = 12

/** draw.io's default edge label size, which stays at maxGraph's 11. */
const EDGE_FONT_SIZE = 11

/** Build the stylesheet whose defaults match draw.io's. */
function createDrawioStylesheet(): Stylesheet {
  const stylesheet = new Stylesheet()

  const vertex = stylesheet.getDefaultVertexStyle()
  vertex.fillColor = '#dae8fc'
  vertex.strokeColor = '#6c8ebf'
  vertex.fontColor = FONT_COLOR
  vertex.fontSize = VERTEX_FONT_SIZE
  stylesheet.putDefaultVertexStyle(vertex)

  const edge = stylesheet.getDefaultEdgeStyle()
  edge.strokeColor = '#6c8ebf'
  edge.fontColor = FONT_COLOR
  edge.fontSize = EDGE_FONT_SIZE
  // draw.io draws a filled arrowhead unless the cell says otherwise.
  edge.endArrow = 'block'
  stylesheet.putDefaultEdgeStyle(edge)

  return stylesheet
}

/** The stylesheet every rendered diagram uses. */
export const DRAWIO_STYLESHEET = createDrawioStylesheet()

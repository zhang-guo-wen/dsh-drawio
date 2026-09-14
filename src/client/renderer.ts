/**
 * The drawio renderer's browser-side interface, kept separate from the
 * component so presentation tests never load the mxGraph engine.
 */

/** One rendered diagram image and the URL that owns its lifetime. */
export interface RenderedDiagram {
  /** `data:` URL holding the serialized SVG. */
  readonly url: string
  /** Intrinsic pixel size, used to bound the image and to fit it into the pane. */
  readonly width: number
  readonly height: number
  /** Releases every resource the render allocated. */
  readonly dispose: () => void
}

/** Converts decoded mxGraph XML into a displayable diagram. */
export interface DrawioRenderer {
  /**
   * Render one diagram.
   * @param xml - decoded mxGraph XML.
   * @returns the rendered image and its disposer.
   * @throws when the XML is not a diagram the engine can lay out.
   */
  readonly render: (xml: string) => RenderedDiagram
}

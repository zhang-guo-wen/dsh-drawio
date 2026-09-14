/** draw.io document body: decoded file bytes rendered as a read-only diagram. */
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { pathPartsOf } from '@deepseek-ai/dsh-util-workspace-path'
import type { DocumentPreviewProps } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import { decodeDrawioXml, DrawioParseError } from './drawio.ts'
import type { DrawioRenderer, RenderedDiagram } from './renderer.ts'
import type {} from './locales.ts'
import css from './DrawioBody.module.css'

/** The renderer arrives through the entry's inject face so the component holds no engine handle. */
export interface DrawioBodyInjected {
  /** Creates the renderer that draws this document. */
  readonly createRenderer: () => DrawioRenderer
}

/** Standard document props plus this entry's dictionary and its renderer factory. */
export type DrawioBodyProps = DocumentPreviewProps & PropsLocale<'sidebarDrawio'> & DrawioBodyInjected

/** What the body presents for one set of bytes. */
type DiagramOutcome =
  | { readonly kind: 'ready'; readonly diagram: RenderedDiagram }
  | { readonly kind: 'failed'; readonly malformed: boolean }

/**
 * Draw the diagram for one set of bytes.
 *
 * Decoding and layout are synchronous, so the diagram is ready on the first
 * paint rather than after a loading frame. Failure is a value here rather than
 * a thrown render: a malformed file must not unmount the surrounding tab.
 * @param data - complete file bytes, absent when the owner delivered text.
 * @param renderer - the engine-backed renderer for these bytes.
 * @returns the diagram, the failure reason, or undefined without bytes.
 */
function draw(data: Uint8Array<ArrayBuffer> | undefined, renderer: DrawioRenderer): DiagramOutcome | undefined {
  if (data === undefined) return undefined
  let xml: string
  try {
    xml = decodeDrawioXml(data)
  } catch (error: unknown) {
    return { kind: 'failed', malformed: error instanceof DrawioParseError }
  }
  try {
    return { kind: 'ready', diagram: renderer.render(xml) }
  } catch {
    // Any engine failure is reported the same way: the file may still be a
    // valid diagram that this engine cannot lay out.
    return { kind: 'failed', malformed: false }
  }
}

/**
 * Present a `.drawio` file as a diagram at the document's own size.
 *
 * The engine's layout runs offscreen and yields a `data:` URL, so the returned
 * `<img>` is the same element the image preview uses and the diagram keeps its
 * aspect ratio. The pane provides scrolling.
 * @param props - complete file bytes, resource identity, renderer, and locale.
 * @returns the diagram or the reason it could not be drawn.
 */
export function DrawioBody({ content, resourceAddress, createRenderer, t }: DrawioBodyProps): ReactNode {
  const data = content.kind === 'bytes' ? content.data : undefined
  const renderer = useMemo(() => createRenderer(), [createRenderer])
  const outcome = useMemo(() => draw(data, renderer), [data, renderer])
  const previous = useRef<RenderedDiagram>()

  useEffect(() => {
    const diagram = outcome?.kind === 'ready' ? outcome.diagram : undefined
    previous.current = diagram
    return () => {
      previous.current?.dispose()
      previous.current = undefined
    }
  }, [outcome])

  const name = useMemo(() => pathPartsOf(resourceAddress).name, [resourceAddress])

  if (outcome === undefined) return <p className={css.status} role="alert">{t('unsupported')}</p>
  if (outcome.kind === 'failed') {
    return <p className={css.status} role="alert">{t(outcome.malformed ? 'malformed' : 'failed')}</p>
  }
  const { url, width, height } = outcome.diagram
  return <div className={css.frame} data-drawio-preview>
    <img
      className={css.diagram}
      src={url}
      alt={t('preview', { name })}
      width={width}
      height={height}
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
    />
  </div>
}

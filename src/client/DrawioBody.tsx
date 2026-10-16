/** draw.io document body: decoded file bytes rendered as a read-only diagram. */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { pathPartsOf } from '@deepseek-ai/dsh-util-workspace-path'
import type { DocumentPreviewProps } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import { decodeDrawioXml } from './drawio.ts'
import type { RenderedDiagram } from './renderer.ts'
import type {} from './locales.ts'
import css from './DrawioBody.module.css'

/**
 * The renderer arrives through the entry's inject face so the component holds no
 * engine handle. Drawing is asynchronous because the graphics engine is a
 * package-local chunk the module loader fetches when the first diagram needs it.
 */
export interface DrawioBodyInjected {
  /**
   * Draw one decoded diagram.
   * @param xml - decoded mxGraph XML.
   * @returns the rendered image and its disposer.
   */
  readonly renderDiagram: (xml: string) => Promise<RenderedDiagram>
}

/** Standard document props plus this entry's dictionary and its renderer. */
export type DrawioBodyProps = DocumentPreviewProps & PropsLocale<'sidebarDrawio'> & DrawioBodyInjected

/** The decoded document, or the reason it could not be decoded at all. */
type Decoded =
  | { readonly kind: 'xml'; readonly xml: string }
  | { readonly kind: 'malformed' }

/** What the body presents for one set of bytes. */
type DiagramOutcome =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly diagram: RenderedDiagram }
  | { readonly kind: 'failed' }

/**
 * Decode one file's bytes.
 *
 * A malformed file is a value here rather than a thrown render: it must not
 * unmount the surrounding tab, and its message has no retry because decoding is
 * deterministic — the same bytes fail the same way.
 * @param data - complete file bytes, absent when the owner delivered text.
 * @returns the XML text or the malformed marker.
 */
function decode(data: Uint8Array<ArrayBuffer> | undefined): Decoded | undefined {
  if (data === undefined) return undefined
  try {
    return { kind: 'xml', xml: decodeDrawioXml(data) }
  } catch {
    // `decodeDrawioXml` reports every unusable body as a DrawioParseError, and the
    // localized line already says what is wrong, so the message is not carried here.
    return { kind: 'malformed' }
  }
}

/**
 * Present a `.drawio` file as a diagram at the document's own size.
 *
 * The engine's layout runs offscreen and yields a `data:` URL, so the returned
 * `<img>` is the same element the image preview uses and the diagram keeps its
 * aspect ratio. The pane provides scrolling. The engine itself is fetched on the
 * first diagram, so the first paint is a placeholder of the same shape.
 * @param props - complete file bytes, resource identity, renderer, and locale.
 * @returns the diagram, a placeholder, or the reason it could not be drawn.
 */
export function DrawioBody({ content, resourceAddress, renderDiagram, t }: DrawioBodyProps): ReactNode {
  const data = content.kind === 'bytes' ? content.data : undefined
  /**
   * Decoding is memoized on the bytes, and the render effect below depends on the
   * decoded TEXT rather than on the byte array: a parent that hands over a fresh
   * array object per render must not re-arm the effect.
   */
  const decoded = useMemo(() => decode(data), [data])
  const [outcome, setOutcome] = useState<DiagramOutcome>({ kind: 'loading' })
  /** Bumped by Retry to re-run the render with the same bytes. */
  const [attempt, setAttempt] = useState(0)
  const previous = useRef<RenderedDiagram>()

  // Release whichever diagram is still held when the pane closes.
  useEffect(() => () => { previous.current?.dispose() }, [])

  const xml = decoded?.kind === 'xml' ? decoded.xml : undefined
  useEffect(() => {
    if (xml === undefined) return undefined
    let active = true
    // A retry, or a different file, replaces the picture: release the old one now
    // rather than holding a second serialized SVG.
    previous.current?.dispose()
    previous.current = undefined
    setOutcome({ kind: 'loading' })
    void renderDiagram(xml).then(
      (diagram) => {
        if (!active) {
          diagram.dispose()
          return
        }
        previous.current = diagram
        setOutcome({ kind: 'ready', diagram })
      },
      // Any engine failure is reported the same way: the file may still be a
      // valid diagram that this engine cannot lay out, and that is worth retrying.
      () => { if (active) setOutcome({ kind: 'failed' }) },
    )
    return () => { active = false }
  }, [xml, renderDiagram, attempt])

  const name = useMemo(() => pathPartsOf(resourceAddress).name, [resourceAddress])

  if (decoded === undefined) return <p className={css.status} role="alert">{t('unsupported')}</p>
  if (decoded.kind === 'malformed') return <p className={css.status} role="alert">{t('malformed')}</p>
  if (outcome.kind === 'failed') {
    return <div className={css.failure} role="alert">
      <p className={css.status}>{t('failed')}</p>
      <button type="button" className={css.retry} onClick={() => setAttempt(current => current + 1)}>
        {t('retry')}
      </button>
    </div>
  }
  if (outcome.kind === 'loading') {
    return <div className={css.loading} role="status">
      {/* The placeholder is decoration; the status line carries the meaning. */}
      <span className={css.skeleton} aria-hidden="true" />
      <p className={css.status}>{t('loading')}</p>
    </div>
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

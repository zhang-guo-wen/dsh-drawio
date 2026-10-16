/**
 * Browser half: register a draw.io document preview.
 *
 * This is a standalone plugin: it reaches the Sidebar only through the
 * document-preview registry contract published by
 * `@deepseek-ai/dsh-client-ui-sidebar-documentpreview` — metadata into
 * `ctx.documentPreviews` and the body into the keyed
 * `sidebar.right.tab.document` seat, both under this package's implementation
 * id. Nothing here reaches into the Sidebar's own store or panes, and no
 * `@deepseek-ai/*` package is bundled: they resolve from the host harness.
 *
 * The graphics engine is reached only through `maxgraph-loader.ts`, whose
 * `import()` the build turns into a package-local chunk, so neither the entry
 * nor the presentation component holds the engine.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import { DrawioBody, type DrawioBodyInjected } from './DrawioBody.tsx'
import { DRAWIO_BODY_ID } from './definition.ts'
import { renderDrawioDiagram } from './maxgraph-loader.ts'
import { en, zh } from './locales.ts'

/** This package's copy namespace. */
const NS = 'sidebarDrawio'

/** Required browser services: the slot registry, the document registry, and copy. */
export const inject = ['slots', 'locale', 'documentPreviews']

/**
 * Client plugin body: register the dictionary, the preview metadata, and the body.
 * @param ctx - client root context carrying the registries and copy.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-sidebar-drawio: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.documentPreviews.register({
    id: DRAWIO_BODY_ID,
    extensions: ['drawio'],
    title: () => t('title'),
    loading: 'bytes-complete',
    wrap: false,
  }), 'ui-sidebar-drawio: metadata')
  ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register(
    {
      name: 'sidebar.right.tab.document', key: DRAWIO_BODY_ID, locale: NS,
      inject: (): DrawioBodyInjected => ({ renderDiagram: renderDrawioDiagram }),
    },
    DrawioBody,
  )), 'ui-sidebar-drawio: body')
}

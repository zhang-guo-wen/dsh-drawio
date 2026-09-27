/** Locale-owned draw.io preview labels and status text. */
export const zh = {
  title: 'draw.io 图表',
  preview: '图表预览：{name}',
  failed: '无法渲染这个图表。',
  malformed: '这个文件不是有效的 draw.io XML。',
  unsupported: 'draw.io 预览需要完整文件内容。',
} satisfies Record<string, string>

/** draw.io preview dictionary keys. */
export type DrawioPreviewKey = keyof typeof zh

/** English dictionary with the same keys as the Chinese dictionary. */
export const en = {
  title: 'draw.io diagram',
  preview: 'Diagram preview: {name}',
  failed: 'This diagram could not be rendered.',
  malformed: 'This file is not valid draw.io XML.',
  unsupported: 'draw.io preview requires the complete file contents.',
} satisfies Record<DrawioPreviewKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** draw.io diagram preview selection, accessible name, and status text. */
    sidebarDrawio: DrawioPreviewKey
  }
}

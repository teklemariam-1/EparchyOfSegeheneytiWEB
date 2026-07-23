/**
 * Estimated reading time from Lexical rich-text content.
 * Walks the node tree collecting text, then applies ~200 words per minute.
 */

function collectText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; children?: unknown[] }
  let out = typeof n.text === 'string' ? `${n.text} ` : ''
  if (Array.isArray(n.children)) {
    for (const child of n.children) out += collectText(child)
  }
  return out
}

/** Minutes (>= 1) to read the given Lexical data, or null if there is no text. */
export function readingTimeFromLexical(data: unknown): number | null {
  const root = (data as { root?: unknown } | null | undefined)?.root
  if (!root) return null
  const words = collectText(root).trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return null
  return Math.max(1, Math.round(words / 200))
}

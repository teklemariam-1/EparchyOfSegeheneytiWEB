/**
 * Plain-text ↔ Lexical helpers, dependency-free on purpose: collection configs
 * use `lexicalFromText` for prefilled richText defaults, and the obituary
 * composer (which must stay free of Payload imports) uses `lexicalToPlainText`.
 */

interface LexicalTextNode {
  type: 'text'
  text: string
  format: number
  style: string
  mode: 'normal'
  detail: number
  version: 1
}

interface LexicalParagraph {
  type: 'paragraph'
  format: ''
  indent: 0
  version: 1
  direction: null
  children: LexicalTextNode[]
}

export interface LexicalState {
  root: {
    type: 'root'
    format: ''
    indent: 0
    version: 1
    direction: null
    children: LexicalParagraph[]
  }
}

/** A Lexical editor state of one paragraph per argument — for defaultValue. */
export function lexicalFromText(...paragraphs: string[]): LexicalState {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  }
}

/**
 * Flatten Lexical data to plain text: text nodes concatenated, one line per
 * block-level child of the root. Returns '' for empty/absent content, so a
 * caller can treat "no text" and "no field" the same way.
 */
export function lexicalToPlainText(data: unknown): string {
  const root = (data as { root?: { children?: unknown[] } } | null | undefined)?.root
  if (!root || !Array.isArray(root.children)) return ''
  return root.children
    .map((block) => collectText(block).trim())
    .filter(Boolean)
    .join('\n')
}

function collectText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; children?: unknown[] }
  let out = typeof n.text === 'string' ? n.text : ''
  if (Array.isArray(n.children)) {
    for (const child of n.children) out += collectText(child)
  }
  return out
}

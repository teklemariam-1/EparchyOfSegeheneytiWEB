import React from 'react'

/**
 * Minimal Lexical rich text renderer.
 * Handles the most common node types from Payload's Lexical editor.
 * For full JSX converter support, replace with @payloadcms/richtext-lexical/react.
 */

interface TextNode {
  type: 'text'
  text: string
  format?: number // bitmask: 1=bold,2=italic,4=strikethrough,8=underline,16=code,32=sub,64=super
}

interface ElementNode {
  type: string
  children?: RichTextNode[]
  tag?: string
  listType?: 'bullet' | 'number'
  url?: string
  newTab?: boolean
  fields?: { url?: string; newTab?: boolean }
  format?: string | number
  indent?: number
  version?: number
  direction?: string
  value?: { url?: string; alt?: string; width?: number; height?: number }
}

type RichTextNode = TextNode | ElementNode

interface LexicalRoot {
  root: {
    children: RichTextNode[]
    type: 'root'
  }
}

function renderText(node: TextNode): React.ReactNode {
  let content: React.ReactNode = node.text
  const f = node.format ?? 0
  if (f & 1) content = <strong>{content}</strong>
  if (f & 2) content = <em>{content}</em>
  if (f & 8) content = <u>{content}</u>
  if (f & 4) content = <s>{content}</s>
  if (f & 16) content = <code className="rounded bg-charcoal-100 px-1 py-0.5 text-sm font-mono">{content}</code>
  return content
}

function renderNode(node: RichTextNode, key: string | number): React.ReactNode {
  if (node.type === 'text') {
    return <span key={key}>{renderText(node as TextNode)}</span>
  }

  const el = node as ElementNode
  const children = el.children?.map((c, i) => renderNode(c, i)) ?? []

  switch (el.type) {
    case 'paragraph':
      return <p key={key}>{children}</p>

    case 'heading': {
      const Tag = (el.tag ?? 'h2') as React.ElementType
      return <Tag key={key}>{children}</Tag>
    }

    case 'list':
      if (el.listType === 'number') return <ol key={key}>{children}</ol>
      return <ul key={key}>{children}</ul>

    case 'listitem':
      return <li key={key}>{children}</li>

    case 'quote':
      return <blockquote key={key}>{children}</blockquote>

    case 'link': {
      const href = el.fields?.url ?? el.url ?? '#'
      const target = el.fields?.newTab ?? el.newTab ? '_blank' : undefined
      const rel = target ? 'noopener noreferrer' : undefined
      return (
        <a key={key} href={href} target={target} rel={rel} className="text-maroon-700 underline hover:text-maroon-900 transition-colors">
          {children}
        </a>
      )
    }

    case 'upload': {
      const img = el.value
      if (!img?.url) return null
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <figure key={key} className="my-6">
          <img src={img.url} alt={img.alt ?? ''} width={img.width} height={img.height} className="rounded-lg max-w-full h-auto" />
        </figure>
      )
    }

    case 'horizontalrule':
      return <hr key={key} className="my-6 border-charcoal-200" />

    default:
      // Pass through unknown block elements
      return <div key={key}>{children}</div>
  }
}

interface Props {
  data?: unknown
  className?: string
}

export function RichText({ data, className = 'prose prose-eparchy max-w-none' }: Props) {
  if (!data) return null

  let root: RichTextNode[]
  try {
    if (typeof data === 'object' && data !== null && 'root' in data) {
      root = (data as LexicalRoot).root.children
    } else {
      return null
    }
  } catch {
    return null
  }

  return (
    <div className={className}>
      {root.map((node, i) => renderNode(node, i))}
    </div>
  )
}

// utils/markdown-parser.ts - IMPROVED VERSION

export interface MarkdownSegment {
  type: 'text' | 'codeblock' | 'heading' | 'blockquote' | 'list'
  content: string
  language?: string
  level?: number
}

export interface InlineSegment {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link'
  content: string
  url?: string
}

/**
 * Parse markdown into segments
 * Now handles incomplete/broken markdown more gracefully
 */
export function parseMarkdown(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      segments.push({ type: 'text', content: '' })
      i++
      continue
    }

    // Code block - IMPROVED: handle incomplete code blocks
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'plaintext'
      let codeContent = ''
      i++

      // Find closing ``` or end of content
      while (i < lines.length) {
        if (lines[i].trim() === '```') {
          i++ // Skip closing ```
          break
        }
        codeContent += (codeContent ? '\n' : '') + lines[i]
        i++
      }

      // Even if no closing ```, still treat as code block
      segments.push({
        type: 'codeblock',
        content: codeContent,
        language
      })
      continue
    }

    // Heading
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#{1,6})\s+(.+)/)
      if (match) {
        segments.push({
          type: 'heading',
          level: match[1].length,
          content: match[2]
        })
        i++
        continue
      }
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      segments.push({
        type: 'blockquote',
        content: trimmed.slice(1).trim()
      })
      i++
      continue
    }

    // List item
    if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^[-*+]\s/, '').replace(/^\d+\.\s/, '')
      segments.push({
        type: 'list',
        content
      })
      i++
      continue
    }

    // Regular text
    segments.push({
      type: 'text',
      content: line
    })
    i++
  }

  return segments
}

/**
 * Parse inline markdown (bold, italic, code, links)
 * IMPROVED: Handle incomplete markdown gracefully
 */
export function parseInlineMarkdown(content: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let currentPos = 0

  // Patterns for inline markdown - order matters!
  const patterns = [
    // Bold: **text** or __text__
    { regex: /\*\*(.+?)\*\*/g, type: 'bold' as const },
    { regex: /__(.+?)__/g, type: 'bold' as const },
    // Italic: *text* or _text_
    { regex: /\*(.+?)\*/g, type: 'italic' as const },
    { regex: /_(.+?)_/g, type: 'italic' as const },
    // Inline code: `code`
    { regex: /`([^`]+)`/g, type: 'code' as const },
    // Links: [text](url)
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' as const },
  ]

  // Find all matches
  const matches: Array<{
    index: number
    length: number
    type: string
    content: string
    url?: string
  }> = []

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex)
    let match

    while ((match = regex.exec(content)) !== null) {
      // Avoid overlapping matches
      const overlaps = matches.some(
        m => 
          (match!.index >= m.index && match!.index < m.index + m.length) ||
          (match!.index + match![0].length > m.index && match!.index + match![0].length <= m.index + m.length)
      )

      if (!overlaps) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: pattern.type,
          content: match[1],
          url: match[2] // For links
        })
      }
    }
  }

  // Sort matches by position
  matches.sort((a, b) => a.index - b.index)

  // Build segments
  let lastIndex = 0

  for (const match of matches) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }

    // Add match
    segments.push({
      type: match.type as any,
      content: match.content,
      url: match.url
    })

    lastIndex = match.index + match.length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }

  // If no matches, return whole content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content
    })
  }

  return segments
}

/**
 * Clean incomplete markdown markers
 * Use this when displaying raw text during typing
 */
export function cleanIncompleteMarkdown(content: string): string {
  // Don't remove anything - just return as is for raw display
  return content
}

/**
 * Check if markdown is "complete enough" to render
 * Useful for deciding when to switch from raw text to rendered markdown
 */
export function isMarkdownComplete(content: string): boolean {
  // Check for unclosed code blocks
  const codeBlockCount = (content.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    return false // Unclosed code block
  }

  // Check for unclosed bold/italic
  const boldCount = (content.match(/\*\*/g) || []).length
  if (boldCount % 2 !== 0) {
    return false // Unclosed bold
  }

  return true
}
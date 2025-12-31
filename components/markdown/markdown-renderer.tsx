"use client"

import { parseMarkdown, parseInlineMarkdown } from "@/utils/markdown-parser"
import { CodeBlock } from "./code-block"
import type { ThemeColor } from "@/types/message.types"
import { Quote, List } from "lucide-react"

interface MarkdownRendererProps {
  content: string
  theme: ThemeColor
}

const themeColors: Record<ThemeColor, { text: string; accent: string }> = {
  green: { text: "text-green-400", accent: "text-green-300" },
  amber: { text: "text-amber-400", accent: "text-amber-300" },
  cyan: { text: "text-cyan-400", accent: "text-cyan-300" },
}

function InlineRenderer({ content, theme }: { content: string; theme: ThemeColor }) {
  const segments = parseInlineMarkdown(content)
  const colors = themeColors[theme]

  return (
    <>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case "bold":
            return (
              <strong key={i} className={`font-bold ${colors.accent}`}>
                {segment.content}
              </strong>
            )
          case "italic":
            return (
              <em key={i} className="italic opacity-90">
                {segment.content}
              </em>
            )
          case "code":
            return (
              <code key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-pink-400 font-mono text-[0.9em]">
                {segment.content}
              </code>
            )
          case "link":
            return (
              <a
                key={i}
                href={segment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${colors.accent} underline underline-offset-2 hover:opacity-80 transition-opacity`}
              >
                {segment.content}
              </a>
            )
          default:
            return <span key={i}>{segment.content}</span>
        }
      })}
    </>
  )
}

export function MarkdownRenderer({ content, theme }: MarkdownRendererProps) {
  const segments = parseMarkdown(content)
  const colors = themeColors[theme]

  return (
    <div className="markdown-content space-y-2">
      {segments.map((segment, i) => {
        switch (segment.type) {
          case "codeblock":
            return <CodeBlock key={i} code={segment.content} language={segment.language || "plaintext"} theme={theme} />
          case "heading":
            const HeadingTag = `h${segment.level}` as keyof JSX.IntrinsicElements
            const headingSizes: Record<number, string> = {
              1: "text-xl font-bold",
              2: "text-lg font-bold",
              3: "text-base font-semibold",
              4: "text-sm font-semibold",
              5: "text-sm font-medium",
              6: "text-xs font-medium",
            }
            return (
              <HeadingTag key={i} className={`${headingSizes[segment.level || 1]} ${colors.accent} mt-4 mb-2`}>
                <InlineRenderer content={segment.content} theme={theme} />
              </HeadingTag>
            )
          case "blockquote":
            return (
              <div key={i} className="flex items-start gap-2 pl-3 border-l-2 border-gray-600 text-gray-400 italic">
                <Quote className="w-3 h-3 mt-1 flex-shrink-0 opacity-50" />
                <span>
                  <InlineRenderer content={segment.content} theme={theme} />
                </span>
              </div>
            )
          case "list":
            return (
              <div key={i} className="flex items-start gap-2 pl-2">
                <List className="w-3 h-3 mt-1.5 flex-shrink-0 opacity-50" />
                <span>
                  <InlineRenderer content={segment.content} theme={theme} />
                </span>
              </div>
            )
          case "text":
            if (!segment.content) {
              return <div key={i} className="h-2" />
            }
            return (
              <p key={i} className="leading-relaxed">
                <InlineRenderer content={segment.content} theme={theme} />
              </p>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

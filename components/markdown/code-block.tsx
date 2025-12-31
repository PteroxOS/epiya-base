"use client"

import { useState, useMemo } from "react"
import { Check, Copy, FileCode } from "lucide-react"
import type { ThemeColor } from "@/types/message.types"
import type { JSX } from "react/jsx-runtime"

interface CodeBlockProps {
  code: string
  language: string
  theme: ThemeColor
}

const languageIcons: Record<string, string> = {
  javascript: "JS",
  typescript: "TS",
  python: "PY",
  jsx: "JSX",
  tsx: "TSX",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  bash: "BASH",
  shell: "SH",
  sql: "SQL",
}

const syntaxPatterns = {
  // Keywords
  keywords:
    /\b(const|let|var|function|return|if|else|elif|for|while|class|import|from|export|default|async|await|try|catch|finally|throw|new|this|super|extends|implements|interface|type|enum|public|private|protected|static|readonly|abstract|def|print|True|False|None|and|or|not|in|is|lambda|with|as|yield|pass|break|continue|raise|except|global|nonlocal|assert|del)\b/g,
  // Strings (double and single quotes, template literals)
  strings: /(["'`])(?:(?!\1)[^\\]|\\.)*?\1|f"[^"]*"|f'[^']*'/g,
  // Comments
  comments: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$|"""[\s\S]*?"""|'''[\s\S]*?''')/gm,
  // Numbers
  numbers: /\b(\d+\.?\d*)\b/g,
  // Functions
  functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
  // Types/Classes
  types: /\b([A-Z][a-zA-Z0-9_]*)\b/g,
  // Operators
  operators: /([+\-*/%=<>!&|^~?:]+|->|=>)/g,
  // Brackets
  brackets: /([{}[\]()])/g,
}

// Color classes for syntax highlighting
const syntaxColors = {
  keyword: "text-pink-400",
  string: "text-amber-300",
  comment: "text-gray-500 italic",
  number: "text-purple-400",
  function: "text-blue-400",
  type: "text-cyan-400",
  operator: "text-gray-400",
  bracket: "text-gray-400",
  default: "text-gray-300",
}

function highlightCode(code: string, language: string): JSX.Element[] {
  const lines = code.split("\n")

  return lines.map((line, lineIndex) => {
    // Process each line
    const highlighted = line
    const tokens: { start: number; end: number; type: string; text: string }[] = []

    // Find comments first (highest priority)
    let match
    const commentRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm
    while ((match = commentRegex.exec(line)) !== null) {
      tokens.push({ start: match.index, end: match.index + match[0].length, type: "comment", text: match[0] })
    }

    // Find strings
    const stringRegex = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1|f"[^"]*"|f'[^']*'/g
    while ((match = stringRegex.exec(line)) !== null) {
      const overlaps = tokens.some(
        (t) =>
          (match!.index >= t.start && match!.index < t.end) ||
          (match!.index + match![0].length > t.start && match!.index + match![0].length <= t.end),
      )
      if (!overlaps) {
        tokens.push({ start: match.index, end: match.index + match[0].length, type: "string", text: match[0] })
      }
    }

    // Find keywords
    const keywordRegex =
      /\b(const|let|var|function|return|if|else|elif|for|while|class|import|from|export|default|async|await|try|catch|finally|throw|new|this|super|extends|implements|interface|type|enum|public|private|protected|static|readonly|abstract|def|print|True|False|None|and|or|not|in|is|lambda|with|as|yield|pass|break|continue|raise|except|global|nonlocal|assert|del)\b/g
    while ((match = keywordRegex.exec(line)) !== null) {
      const overlaps = tokens.some(
        (t) =>
          (match!.index >= t.start && match!.index < t.end) ||
          (match!.index + match![0].length > t.start && match!.index + match![0].length <= t.end),
      )
      if (!overlaps) {
        tokens.push({ start: match.index, end: match.index + match[0].length, type: "keyword", text: match[0] })
      }
    }

    // Find functions
    const funcRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g
    while ((match = funcRegex.exec(line)) !== null) {
      const overlaps = tokens.some(
        (t) =>
          (match!.index >= t.start && match!.index < t.end) ||
          (match!.index + match![1].length > t.start && match!.index + match![1].length <= t.end),
      )
      if (!overlaps) {
        tokens.push({ start: match.index, end: match.index + match![1].length, type: "function", text: match![1] })
      }
    }

    // Find numbers
    const numRegex = /\b(\d+\.?\d*)\b/g
    while ((match = numRegex.exec(line)) !== null) {
      const overlaps = tokens.some(
        (t) =>
          (match!.index >= t.start && match!.index < t.end) ||
          (match!.index + match![0].length > t.start && match!.index + match![0].length <= t.end),
      )
      if (!overlaps) {
        tokens.push({ start: match.index, end: match.index + match![0].length, type: "number", text: match![0] })
      }
    }

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start)

    // Build highlighted line
    const parts: JSX.Element[] = []
    let lastEnd = 0

    tokens.forEach((token, i) => {
      // Add text before token
      if (token.start > lastEnd) {
        parts.push(
          <span key={`${lineIndex}-text-${i}`} className={syntaxColors.default}>
            {line.slice(lastEnd, token.start)}
          </span>,
        )
      }

      // Add token
      const colorClass = syntaxColors[token.type as keyof typeof syntaxColors] || syntaxColors.default
      parts.push(
        <span key={`${lineIndex}-token-${i}`} className={colorClass}>
          {token.text}
        </span>,
      )

      lastEnd = token.end
    })

    // Add remaining text
    if (lastEnd < line.length) {
      parts.push(
        <span key={`${lineIndex}-end`} className={syntaxColors.default}>
          {line.slice(lastEnd)}
        </span>,
      )
    }

    // If no tokens found, return the whole line
    if (parts.length === 0) {
      parts.push(
        <span key={`${lineIndex}-full`} className={syntaxColors.default}>
          {line}
        </span>,
      )
    }

    return (
      <div key={lineIndex} className="leading-relaxed">
        {parts}
        {lineIndex < lines.length - 1 ? "\n" : ""}
      </div>
    )
  })
}

export function CodeBlock({ code, language, theme }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const codeBlockStyles = {
    headerBg: "bg-[#1a1a1a]",
    codeBg: "bg-[#111111]",
  }

  // Memoize highlighted code
  const highlightedCode = useMemo(() => highlightCode(code, language), [code, language])

  return (
    <div className="code-block my-3 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 ${codeBlockStyles.headerBg}`}>
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
            {languageIcons[language.toLowerCase()] || language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-400 hover:text-gray-200 transition-colors rounded hover:bg-white/10"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code with syntax highlighting */}
      <div className={`p-4 overflow-x-auto ${codeBlockStyles.codeBg}`}>
        <pre className="text-xs md:text-sm font-mono">{highlightedCode}</pre>
      </div>
    </div>
  )
}

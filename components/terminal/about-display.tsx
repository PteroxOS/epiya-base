"use client"

import type { ThemeColor } from "@/types/message.types"
import { Terminal, MessageSquare, Code2, Palette, Clock, FileText, Sparkles } from "lucide-react"

interface AboutDisplayProps {
  theme: ThemeColor
}

const features = [
  { text: "Real-time AI chat", icon: MessageSquare },
  { text: "Syntax-highlighted code", icon: Code2 },
  { text: "Multiple color themes", icon: Palette },
  { text: "Command history", icon: Clock },
  { text: "Markdown support", icon: FileText },
  { text: "Matrix rain easter egg", icon: Sparkles },
]

const themeColors: Record<ThemeColor, { accent: string; border: string; bg: string }> = {
  green: { accent: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
  amber: { accent: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  cyan: { accent: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
}

export function AboutDisplay({ theme }: AboutDisplayProps) {
  const colors = themeColors[theme]

  return (
    <div className="about-display">
      {/* Desktop: ASCII Box */}
      <pre className={`hidden md:block ${colors.accent} text-sm font-mono whitespace-pre`}>
        {`╭─────────────────────────────────────────────────────────────╮
│                    ABOUT EPIYA-AI TERMINAL                  │
├─────────────────────────────────────────────────────────────┤
│  Version: 1.0.0                                             │
│  Author: Epiya AI                                           │
│  License: MIT                                               │
│                                                             │
│  A modern terminal-style chat interface inspired by         │
│  macOS Terminal. Built with Next.js, TypeScript,            │
│  and Tailwind CSS.                                          │
│                                                             │
│  Features:                                                  │
│    • Real-time AI chat with Epiya-AI                        │
│    • Syntax-highlighted code blocks                         │
│    • Multiple color themes                                  │
│    • Command history navigation                             │
│    • Markdown rendering support                             │
│    • Matrix rain easter egg                                 │
╰─────────────────────────────────────────────────────────────╯`}
      </pre>

      {/* Mobile: Card Layout */}
      <div className="md:hidden">
        <div className={`${colors.accent} text-xs font-mono mb-3 text-center`}>ABOUT EPIYA-AI TERMINAL</div>

        <div className={`p-3 rounded border ${colors.border} ${colors.bg} mb-3`}>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className={`w-4 h-4 ${colors.accent}`} />
            <span className={`${colors.accent} font-mono text-xs font-medium`}>Info</span>
          </div>
          <div className="space-y-1 pl-6 text-xs font-mono text-gray-400">
            <div>
              Version: <span className="text-gray-300">1.0.0</span>
            </div>
            <div>
              Author: <span className="text-gray-300">Epiya AI</span>
            </div>
            <div>
              License: <span className="text-gray-300">MIT</span>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded border ${colors.border} ${colors.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-4 h-4 ${colors.accent}`} />
            <span className={`${colors.accent} font-mono text-xs font-medium`}>Features</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pl-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.text} className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-400 text-[10px] font-mono">{feature.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

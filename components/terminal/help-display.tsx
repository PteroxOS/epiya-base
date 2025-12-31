"use client"

import type { ThemeColor } from "@/types/message.types"
import { HelpCircle, Trash2, Info, Clock, Palette, Sparkles, MessageSquare, LogOut } from "lucide-react"

interface HelpDisplayProps {
  theme: ThemeColor
  onCommandClick?: (command: string) => void
}

const commands = [
  { name: "help", description: "Show available commands", icon: HelpCircle },
  { name: "clear", description: "Clear terminal screen", icon: Trash2 },
  { name: "about", description: "About this terminal", icon: Info },
  { name: "history", description: "Show command history", icon: Clock },
  { name: "theme", description: "Switch theme (green, amber, cyan)", icon: Palette },
  { name: "matrix", description: "Toggle matrix rain effect", icon: Sparkles },
  { name: "cowsay", description: "ASCII cow says your message", icon: MessageSquare },
  { name: "exit", description: "Return to landing page", icon: LogOut },
]

const themeColors: Record<ThemeColor, { accent: string; border: string; bg: string }> = {
  green: { accent: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
  amber: { accent: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  cyan: { accent: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
}

export function HelpDisplay({ theme, onCommandClick }: HelpDisplayProps) {
  const colors = themeColors[theme]

  const executableCommands = ["help", "clear", "about", "history", "matrix", "exit"]

  const handleCommandClick = (cmdName: string) => {
    if (onCommandClick && executableCommands.includes(cmdName)) {
      onCommandClick(cmdName)
    }
  }

  return (
    <div className="help-display">
      {/* Desktop: ASCII Box */}
      <pre className={`hidden md:block ${colors.accent} text-sm font-mono whitespace-pre`}>
        {`╭─────────────────────────────────────────────────────────────╮
│                      AVAILABLE COMMANDS                     │
├─────────────────────────────────────────────────────────────┤
│  help              Show this help message                   │
│  clear             Clear the terminal screen                │
│  about             About this terminal application          │
│  history           Show command history                     │
│  theme [name]      Switch theme (green, amber, cyan)        │
│  matrix            Toggle matrix rain effect                │
│  cowsay [message]  ASCII cow says your message              │
│  exit              Return to landing page                   │
╰─────────────────────────────────────────────────────────────╯`}
      </pre>

      {/* Mobile: Button List - Clicking executes command */}
      <div className="md:hidden">
        <div className={`${colors.accent} text-xs font-mono mb-3 text-center`}>AVAILABLE COMMANDS</div>
        <div className="space-y-2">
          {commands.map((cmd) => {
            const Icon = cmd.icon
            const isExecutable = executableCommands.includes(cmd.name)
            const needsArg = cmd.name === "theme" || cmd.name === "cowsay"

            return (
              <button
                key={cmd.name}
                onClick={() => handleCommandClick(cmd.name)}
                disabled={!isExecutable}
                className={`w-full text-left p-3 rounded border ${colors.border} ${colors.bg} 
                  transition-all duration-200 ${isExecutable ? "active:scale-[0.98] hover:opacity-80" : "opacity-60"}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${colors.accent} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`${colors.accent} font-mono text-sm font-medium`}>{cmd.name}</span>
                      {needsArg && <span className="text-gray-500 text-xs font-mono">[arg]</span>}
                    </div>
                    <p className="text-gray-500 text-xs font-mono mt-0.5 truncate">{cmd.description}</p>
                  </div>
                  {isExecutable && (
                    <div
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${colors.bg} ${colors.accent} border ${colors.border}`}
                    >
                      RUN
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <p className="text-gray-600 text-[10px] font-mono mt-3 text-center">
          Tap command to execute. Commands with [arg] need to be typed.
        </p>
      </div>
    </div>
  )
}

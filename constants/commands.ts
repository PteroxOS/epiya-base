import type { Command } from "@/types/message.types"

export const HELP_TEXT = `
╭─────────────────────────────────────────────────────────────╮
│                      AVAILABLE COMMANDS                     │
├─────────────────────────────────────────────────────────────┤
│  help              Show this help message                   │
│  clear             Clear the terminal screen                │
│  about             About this terminal application          │
│  history           Show command history                     │
│  cowsay [message]  ASCII cow says your message              │
│  exit              Return to landing page                   │
╰─────────────────────────────────────────────────────────────╯
`

export const ABOUT_TEXT = `
╭─────────────────────────────────────────────────────────────╮
│                    ABOUT EPIYA-AI TERMINAL                  │
├─────────────────────────────────────────────────────────────┤
│  Version: 1.0.0                                             │
│  Author: PteroxOS                                           │
│  License: Open Source                                       │
│                                                             │
│  A modern terminal-style chat interface inspired by         │
│  macOS Terminal. Built with Next.js, TypeScript,            │
│  and Tailwind CSS.                                          │
│                                                             │
│  Features:                                                  │
│    • Real-time AI chat interface                            │
│    • Syntax-highlighted code blocks                         │
│    • Command history navigation                             │
│    • Markdown rendering support                             │
│    • Multiple AI model selection                            │
│                                                             │
│  GitHub: https://github.com/PteroxOS                        │
╰─────────────────────────────────────────────────────────────╯
`

export const cowsay = (message: string): string => {
  const maxWidth = 40
  const lines: string[] = []
  let currentLine = ""

  message.split(" ").forEach((word) => {
    if ((currentLine + " " + word).trim().length <= maxWidth) {
      currentLine = (currentLine + " " + word).trim()
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  })
  if (currentLine) lines.push(currentLine)

  const width = Math.max(...lines.map((l) => l.length), 10)
  const border = "─".repeat(width + 2)

  let bubble = `╭${border}╮\n`
  lines.forEach((line) => {
    bubble += `│ ${line.padEnd(width)} │\n`
  })
  bubble += `╰${border}╯\n`

  const cow = `        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`

  return bubble + cow
}

export const commandDefinitions: Omit<Command, "handler">[] = [
  { name: "help", description: "Show available commands" },
  { name: "clear", description: "Clear terminal screen" },
  { name: "about", description: "About this terminal" },
  { name: "history", description: "Show command history" },
  { name: "cowsay", description: "ASCII cow says your message" },
  { name: "exit", description: "Return to landing page" },
]

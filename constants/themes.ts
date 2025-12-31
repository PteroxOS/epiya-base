import type { TerminalTheme, ThemeColor } from "@/types/message.types"

export const themes: Record<ThemeColor, TerminalTheme> = {
  green: {
    name: "green",
    primary: "#00ff00",
    secondary: "#00cc00",
    accent: "#00ff9f",
  },
  amber: {
    name: "amber",
    primary: "#ffb000",
    secondary: "#cc8c00",
    accent: "#ffd700",
  },
  cyan: {
    name: "cyan",
    primary: "#00ffff",
    secondary: "#00cccc",
    accent: "#00fff7",
  },
}

export const ASCII_LOGO = `
███████╗██████╗ ██╗██╗   ██╗ █████╗        █████╗ ██╗
██╔════╝██╔══██╗██║╚██╗ ██╔╝██╔══██╗      ██╔══██╗██║
█████╗  ██████╔╝██║ ╚████╔╝ ███████║█████╗███████║██║
██╔══╝  ██╔═══╝ ██║  ╚██╔╝  ██╔══██║╚════╝██╔══██║██║
███████╗██║     ██║   ██║   ██║  ██║      ██║  ██║██║
╚══════╝╚═╝     ╚═╝   ╚═╝   ╚═╝  ╚═╝      ╚═╝  ╚═╝╚═╝
`

export const WELCOME_MESSAGE = `
╭─────────────────────────────────────────────────────────────╮
│                    EPIYA-AI TERMINAL v1.0                   │
│                                                             │
│  Welcome to the AI-powered terminal interface.              │
│  Type 'help' for available commands.                        │
│                                                             │
│  Available Commands:                                        │
│    • help     - Show this help message                      │
│    • clear    - Clear terminal screen                       │
│    • about    - About this terminal                         │
│    • history  - Show command history                        │
│                                                             │
╰─────────────────────────────────────────────────────────────╯
`

export interface Message {
  id: string
  type: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isTyping?: boolean
}

export type ThemeColor = "green" | "amber" | "cyan"

export interface TerminalTheme {
  name: ThemeColor
  primary: string
  secondary: string
  accent: string
}

export interface Command {
  name: string
  description: string
  handler: (args: string[]) => string | null
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: Date
  updatedAt: Date
}

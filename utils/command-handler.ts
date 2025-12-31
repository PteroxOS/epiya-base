import type { ThemeColor } from "@/types/message.types"
import { HELP_TEXT, ABOUT_TEXT, cowsay } from "@/constants/commands"

export interface CommandResult {
  output: string | null
  action?: "clear" | "history" | "exit"
  themeValue?: ThemeColor
}

export const handleCommand = (input: string, history: string[]): CommandResult => {
  const parts = input.trim().toLowerCase().split(" ")
  const command = parts[0]
  const args = parts.slice(1)

  switch (command) {
    case "help":
      return { output: HELP_TEXT }

    case "clear":
      return { output: null, action: "clear" }

    case "about":
      return { output: ABOUT_TEXT }

    case "exit":
      return { output: "Exiting terminal...", action: "exit" }

    case "history":
      if (history.length === 0) {
        return { output: "No command history yet." }
      }
      const historyOutput = history.map((cmd, i) => `  ${(i + 1).toString().padStart(3)}  ${cmd}`).join("\n")
      return { output: `Command History:\n${historyOutput}` }

    case "cowsay":
      const message = args.join(" ") || "Moo!"
      return { output: cowsay(message) }

    default:
      return { output: null }
  }
}

export const isBuiltInCommand = (input: string): boolean => {
  const command = input.trim().toLowerCase().split(" ")[0]
  return ["help", "clear", "about", "history", "cowsay", "exit"].includes(command)
}

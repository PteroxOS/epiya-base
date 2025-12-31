"use client"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { HelpDisplay } from "@/components/terminal/help-display"
import { AboutDisplay } from "@/components/terminal/about-display"
import type { Message as MessageType, ThemeColor } from "@/types/message.types"
import { AlertCircle } from "lucide-react"
import { useTypewriter } from "@/hooks/use-typewriter"

interface MessageProps {
  message: MessageType
  theme: ThemeColor
  shouldAnimate: boolean
  onAnimationComplete?: () => void
  onCommandClick?: (command: string) => void
}

const themeColors: Record<ThemeColor, { user: string; assistant: string; system: string; cursor: string }> = {
  green: {
    user: "text-white",
    assistant: "text-green-400",
    system: "text-gray-500",
    cursor: "bg-green-400",
  },
  amber: {
    user: "text-white",
    assistant: "text-amber-400",
    system: "text-gray-500",
    cursor: "bg-amber-400",
  },
  cyan: {
    user: "text-white",
    assistant: "text-cyan-400",
    system: "text-gray-500",
    cursor: "bg-cyan-400",
  },
}

export function Message({ message, theme, shouldAnimate, onAnimationComplete, onCommandClick }: MessageProps) {
  const colors = themeColors[theme]

  const { displayedText, isTyping } = useTypewriter(message.content, shouldAnimate && message.type === "assistant", {
    speed: 10,
    onComplete: onAnimationComplete,
  })

  const contentToRender = shouldAnimate && message.type === "assistant" ? displayedText : message.content

  const isHelpCommand = message.type === "system" && message.content.includes("AVAILABLE COMMANDS")
  const isAboutCommand = message.type === "system" && message.content.includes("ABOUT EPIYA-AI TERMINAL")

  if (message.type === "system") {
    const isCancelled = message.content.includes("stopped by user")

    if (isHelpCommand) {
      return (
        <div className="message system-message py-2 animate-in fade-in duration-300">
          <HelpDisplay theme={theme} onCommandClick={onCommandClick} />
        </div>
      )
    }

    if (isAboutCommand) {
      return (
        <div className="message system-message py-2 animate-in fade-in duration-300">
          <AboutDisplay theme={theme} />
        </div>
      )
    }

    return (
      <div className="message system-message py-2 animate-in fade-in duration-300">
        <div className="flex items-start gap-2">
          {isCancelled && <AlertCircle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />}
          <pre
            className={`${isCancelled ? "text-yellow-500/80" : colors.system} text-xs md:text-sm whitespace-pre-wrap font-mono break-words`}
          >
            {message.content}
          </pre>
        </div>
      </div>
    )
  }

  const isUser = message.type === "user"

  return (
    <div
      className={`message py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "flex justify-end" : "flex justify-start"
      }`}
    >
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? "bg-[#3a3a3a] rounded-2xl rounded-br-sm px-3 py-2" : ""}`}>
        {/* Content */}
        <div className={isUser ? "text-white" : colors.assistant}>
          {isUser ? (
            <span className="font-mono text-xs sm:text-sm break-words leading-relaxed">{message.content}</span>
          ) : (
            <div className="text-xs sm:text-sm">
              <MarkdownRenderer content={contentToRender} theme={theme} />
              {isTyping && (
                <span className={`inline-block w-[2px] h-4 ml-0.5 align-middle animate-blink ${colors.cursor}`} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import type { ThemeColor } from "@/types/message.types"
import { Square, Send } from "lucide-react"
import { ModelSelector } from "./model-selector"
import { DEFAULT_MODEL, type ModelId } from "@/constants/models"

interface CommandInputProps {
  onSubmit: (command: string) => void
  onHistoryNavigate: (direction: "up" | "down") => string | null
  disabled?: boolean
  theme: ThemeColor
  isTyping?: boolean
  onStopGeneration?: () => void
  selectedModel?: ModelId
  onModelChange?: (model: ModelId) => void
  onNewChat?: () => void
}

const themeColors: Record<ThemeColor, { text: string; border: string; bg: string }> = {
  green: { text: "text-green-400 caret-green-400", border: "border-[#333]", bg: "bg-[#1a1a1a]" },
  amber: { text: "text-amber-400 caret-amber-400", border: "border-[#333]", bg: "bg-[#1a1a1a]" },
  cyan: { text: "text-cyan-400 caret-cyan-400", border: "border-[#333]", bg: "bg-[#1a1a1a]" },
}

export function CommandInput({
  onSubmit,
  onHistoryNavigate,
  disabled,
  theme,
  isTyping,
  onStopGeneration,
  selectedModel = DEFAULT_MODEL,
  onModelChange,
  onNewChat,
}: CommandInputProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const colors = themeColors[theme]

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim() && !isTyping) {
      onSubmit(input.trim())
      setInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prevCommand = onHistoryNavigate("up")
      if (prevCommand !== null) {
        setInput(prevCommand)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const nextCommand = onHistoryNavigate("down")
      if (nextCommand !== null) {
        setInput(nextCommand)
      }
    }
  }

  const handleSubmit = () => {
    if (input.trim() && !isTyping) {
      onSubmit(input.trim())
      setInput("")
    }
  }

  return (
    <div className="command-input-wrapper p-2 sm:p-3 bg-[#0a0a0a] border-t border-[#222]">
      <div className={`flex flex-col gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#111] border ${colors.border}`}>
        {/* Top row: Model selector */}
        {onModelChange && (
          <div className="flex items-center">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              theme={theme}
              onNewChat={onNewChat}
            />
          </div>
        )}

        {/* Bottom row: Input field */}
        <div className="flex items-center gap-2" onClick={() => inputRef.current?.focus()}>
          <span className={`${colors.text.split(" ")[0]} font-mono text-xs sm:text-sm flex-shrink-0`}>$</span>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={isTyping ? "AI responding..." : "Ask anything..."}
            className={`flex-1 min-w-0 bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 font-mono text-xs sm:text-sm ${colors.text} placeholder:text-gray-600 disabled:opacity-50`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Terminal input"
          />

          {isTyping && onStopGeneration ? (
            <button
              onClick={onStopGeneration}
              className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-200 flex-shrink-0"
              aria-label="Stop generation"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`flex items-center justify-center p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                input.trim()
                  ? `bg-[#1a1a1a] border border-[#333] ${colors.text.split(" ")[0]} hover:bg-[#222]`
                  : "text-gray-600"
              }`}
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[9px] sm:text-[10px] text-gray-600 mt-1.5 sm:mt-2 font-mono">
        Epiya-AI may make mistakes. Please verify important information.
      </p>
    </div>
  )
}

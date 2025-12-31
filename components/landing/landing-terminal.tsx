"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TerminalHeader } from "@/components/terminal/terminal-header"
import { ModelSelector } from "@/components/terminal/model-selector"
import type { ThemeColor } from "@/types/message.types"
import { Send, Github } from "lucide-react"
import { DEFAULT_MODEL, type ModelId } from "@/constants/models"

const theme: ThemeColor = "green"

const themeColors = {
  text: "text-green-400",
  textDim: "text-green-500/60",
  border: "border-green-500/20",
  bg: "bg-green-500/10",
}

export function LandingTerminal() {
  const router = useRouter()
  const [inputValue, setInputValue] = useState("")
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL)

  const handleSubmit = () => {
    if (inputValue.trim()) {
      router.push(`/?message=${encodeURIComponent(inputValue.trim())}&model=${selectedModel}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleSubmit()
    }
  }

  return (
    <div className="w-full h-full rounded-none sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50 border-0 sm:border sm:border-[#222] flex flex-col">
      <TerminalHeader />

      <div className="flex-1 bg-[#0a0a0a] flex flex-col overflow-hidden">
        {/* Scrollable content wrapper */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-8 overflow-y-auto">
          {/* ASCII Art - responsive sizing */}
          <div className="mb-6 sm:mb-8 w-full flex justify-center">
            <pre
              className={`${themeColors.text} text-[5px] sm:text-[7px] md:text-[9px] lg:text-[11px] leading-[1.1] font-mono whitespace-pre text-center select-none`}
            >
              {`███████╗██████╗ ██╗██╗   ██╗ █████╗        █████╗ ██╗
██╔════╝██╔══██╗██║╚██╗ ██╔╝██╔══██╗      ██╔══██╗██║
█████╗  ██████╔╝██║ ╚████╔╝ ███████║█████╗███████║██║
██╔══╝  ██╔═══╝ ██║  ╚██╔╝  ██╔══██║╚════╝██╔══██║██║
███████╗██║     ██║   ██║   ██║  ██║      ██║  ██║██║
╚══════╝╚═╝     ╚═╝   ╚═╝   ╚═╝  ╚═╝      ╚═╝  ╚═╝╚═╝`}
            </pre>
          </div>

          {/* Tagline */}
          <p className={`${themeColors.text} font-mono text-xs sm:text-sm mb-1 text-center`}>
            AI-Powered Terminal Interface
          </p>
          <p className="text-gray-500 font-mono text-[10px] sm:text-xs mb-8 sm:mb-10 text-center">
            Code assistance, explanations, and creative ideas.
          </p>

          {/* Input Card - fixed max width */}
          <div className={`w-full max-w-md ${themeColors.border} border rounded-xl bg-[#111] p-4`}>
            {/* Model Selector */}
            <div className="mb-3">
              <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} theme={theme} />
            </div>

            {/* Input Field */}
            <div className="flex items-center gap-2">
              <span className={`${themeColors.text} font-mono text-sm flex-shrink-0`}>$</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className={`flex-1 min-w-0 bg-transparent border-none outline-none font-mono text-sm ${themeColors.text} placeholder:text-gray-600`}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                  inputValue.trim()
                    ? `${themeColors.bg} border ${themeColors.border} ${themeColors.text} hover:opacity-80`
                    : "text-gray-600"
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Help text */}
          <p className="text-gray-600 font-mono text-[10px] mt-6 text-center">
            Type <span className={themeColors.textDim}>help</span> in chat for commands
          </p>
        </div>

        <div className="flex-shrink-0 border-t border-[#222] bg-[#0a0a0a] px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-center">
            <span className="text-gray-500 font-mono text-[10px] sm:text-xs">Open Source Project</span>
            <span className="text-gray-600">•</span>
            <a
              href="https://github.com/PteroxOS"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs ${themeColors.textDim} hover:${themeColors.text} transition-colors`}
            >
              <Github className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronUp, ChevronDown, Check, Plus } from "lucide-react"
import { AI_MODELS, type ModelId } from "@/constants/models"
import type { ThemeColor } from "@/types/message.types"

interface ModelSelectorProps {
  selectedModel: ModelId
  onModelChange: (model: ModelId) => void
  theme: ThemeColor
  onNewChat?: () => void
}

const themeColors: Record<ThemeColor, { text: string; border: string; bg: string; hover: string }> = {
  green: {
    text: "text-green-400",
    border: "border-green-500/20",
    bg: "bg-green-500/10",
    hover: "hover:bg-green-500/10",
  },
  amber: {
    text: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    hover: "hover:bg-amber-500/10",
  },
  cyan: {
    text: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/10",
    hover: "hover:bg-cyan-500/10",
  },
}

export function ModelSelector({ selectedModel, onModelChange, theme, onNewChat }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openDirection, setOpenDirection] = useState<"up" | "down">("up")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedModelData = AI_MODELS.find((m) => m.id === selectedModel)
  const colors = themeColors[theme]

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const spaceAbove = buttonRect.top
      const spaceBelow = window.innerHeight - buttonRect.bottom
      const dropdownHeight = 320

      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        setOpenDirection("down")
      } else {
        setOpenDirection("up")
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleModelSelect = (modelId: ModelId) => {
    if (modelId !== selectedModel) {
      onModelChange(modelId)
      if (onNewChat) {
        onNewChat()
      }
    }
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border ${colors.border} ${colors.text} font-mono text-xs transition-all duration-200 hover:bg-[#222]`}
      >
        <span>{selectedModelData?.shortName || selectedModelData?.name || selectedModel}</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 w-64 border ${colors.border} rounded-xl bg-[#141414] shadow-2xl shadow-black/80 z-[9999] overflow-hidden animate-in fade-in duration-200 ${
            openDirection === "up" ? "bottom-full mb-2 slide-in-from-bottom-2" : "top-full mt-2 slide-in-from-top-2"
          }`}
          style={{
            maxHeight:
              openDirection === "down"
                ? `calc(100vh - ${buttonRef.current?.getBoundingClientRect().bottom || 0}px - 20px)`
                : `calc(${buttonRef.current?.getBoundingClientRect().top || 0}px - 20px)`,
          }}
        >
          <div className="p-1 max-h-[280px] overflow-y-auto">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  selectedModel === model.id ? `bg-[#1a1a1a]` : `hover:bg-[#1a1a1a]`
                }`}
              >
                <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                  {selectedModel === model.id && <Check className={`w-4 h-4 ${colors.text}`} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm ${selectedModel === model.id ? colors.text : "text-gray-300"}`}>
                      {model.name}
                    </span>
                    {selectedModel !== model.id && onNewChat && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[#222] text-gray-500">
                        <Plus className="w-2.5 h-2.5" />
                        New
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 block mt-0.5">{model.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

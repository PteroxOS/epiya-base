"use client"

import { Minus, Square } from "lucide-react"

interface TerminalHeaderProps {
  title?: string
}

export function TerminalHeader({ title = "epiya-ai@terminal" }: TerminalHeaderProps) {
  return (
    <div className="terminal-header flex items-center h-9 px-2 sm:px-3 md:px-4 bg-gradient-to-b from-[#3d3d3d] to-[#2a2a2a] sm:rounded-t-xl border-b border-[#1a1a1a]">
      {/* Traffic Light Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          className="group w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff7b72] transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              width="6"
              height="6"
              viewBox="0 0 6 6"
              fill="none"
              className="text-[#4a0000] w-1 h-1 sm:w-1.5 sm:h-1.5"
            >
              <path d="M1 1L5 5M5 1L1 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </button>
        <button
          className="group w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffc94d] transition-colors flex items-center justify-center"
          aria-label="Minimize"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Minus className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-[#5a4000]" strokeWidth={3} />
          </span>
        </button>
        <button
          className="group w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] hover:bg-[#3dd656] transition-colors flex items-center justify-center"
          aria-label="Maximize"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Square className="w-1 h-1 sm:w-[6px] sm:h-[6px] text-[#0a4a12]" strokeWidth={3} />
          </span>
        </button>
      </div>

      {/* Title */}
      <div className="flex-1 text-center">
        <span className="text-[#999] text-[10px] sm:text-xs md:text-sm font-mono truncate">
          <span className="sm:hidden">epiya-ai</span>
          <span className="hidden sm:inline">{title}</span>
        </span>
      </div>

      {/* Spacer for symmetry */}
      <div className="w-10 sm:w-14" />
    </div>
  )
}

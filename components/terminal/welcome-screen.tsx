"use client"

import type { ThemeColor } from "@/types/message.types"

interface WelcomeScreenProps {
  theme: ThemeColor
}

const themeColors: Record<ThemeColor, string> = {
  green: "text-green-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
}

export function WelcomeScreen({ theme }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen select-none w-full overflow-hidden">
      {/* Mobile logo */}
      <div className="block sm:hidden">
        <h1 className={`${themeColors[theme]} text-2xl font-bold font-mono tracking-wider`}>EPIYA-AI</h1>
        <div
          className={`h-0.5 w-20 ${theme === "green" ? "bg-green-400" : theme === "amber" ? "bg-amber-400" : "bg-cyan-400"} mt-1`}
        />
      </div>

      {/* Desktop ASCII art */}
      <pre
        className={`hidden sm:block ${themeColors[theme]} text-[6px] md:text-[8px] lg:text-[10px] xl:text-xs leading-[1.1] font-mono whitespace-pre`}
      >
        {`███████╗██████╗ ██╗██╗   ██╗ █████╗        █████╗ ██╗
██╔════╝██╔══██╗██║╚██╗ ██╔╝██╔══██╗      ██╔══██╗██║
█████╗  ██████╔╝██║ ╚████╔╝ ███████║█████╗███████║██║
██╔══╝  ██╔═══╝ ██║  ╚██╔╝  ██╔══██║╚════╝██╔══██║██║
███████╗██║     ██║   ██║   ██║  ██║      ██║  ██║██║
╚══════╝╚═╝     ╚═╝   ╚═╝   ╚═╝  ╚═╝      ╚═╝  ╚═╝╚═╝`}
      </pre>

      <div className="mt-3 sm:mt-4 p-2 sm:p-3 border-l-2 border-gray-600">
        <p className="text-gray-400 font-mono text-[10px] sm:text-xs mb-1">EPIYA-AI TERMINAL v1.0</p>
        <p className="text-gray-500 font-mono text-[9px] sm:text-[11px]">
          Type <span className={themeColors[theme]}>help</span> for commands or start chatting.
        </p>
      </div>
    </div>
  )
}

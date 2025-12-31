"use client"

import { useSearchParams } from "next/navigation"
import { LandingTerminal } from "@/components/landing/landing-terminal"
import { Terminal } from "@/components/terminal/terminal"
import { AI_MODELS, type ModelId } from "@/constants/models"

export function TerminalRouter() {
  const searchParams = useSearchParams()

  const hasChatParams = searchParams.has("message") || searchParams.has("chatid")

  if (!hasChatParams) {
    return <LandingTerminal />
  }

  const initialMessage = searchParams.get("message") || undefined
  const initialModel = searchParams.get("model") as ModelId | null
  const initialChatId = searchParams.get("chatid") || undefined

  const validModel = initialModel && AI_MODELS.some((m) => m.id === initialModel) ? initialModel : undefined

  return (
    <Terminal
      initialMessage={initialMessage ? decodeURIComponent(initialMessage) : undefined}
      initialModel={validModel}
      initialChatId={initialChatId}
    />
  )
}

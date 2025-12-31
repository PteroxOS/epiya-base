"use client"

import { WelcomeScreen } from "./welcome-screen"
import { Message } from "./message"
import { CommandInput } from "./command-input"
import { useTerminalScroll } from "@/hooks/use-terminal-scroll"
import type { Message as MessageType, ThemeColor } from "@/types/message.types"
import type { ModelId } from "@/constants/models"

interface TerminalBodyProps {
  messages: MessageType[]
  theme: ThemeColor
  showWelcome: boolean
  isTyping: boolean
  matrixActive: boolean
  typingMessageId: string | null
  onTypingComplete: () => void
  onSubmit: (command: string) => void
  onHistoryNavigate: (direction: "up" | "down") => string | null
  onStopGeneration?: () => void
  selectedModel: ModelId
  onModelChange: (model: ModelId) => void
  onNewChat?: () => void
}

export function TerminalBody({
  messages,
  theme,
  showWelcome,
  isTyping,
  typingMessageId,
  onTypingComplete,
  onSubmit,
  onHistoryNavigate,
  onStopGeneration,
  selectedModel,
  onModelChange,
  onNewChat,
}: TerminalBodyProps) {
  const { scrollRef } = useTerminalScroll(messages)

  const handleCommandClick = (command: string) => {
    onSubmit(command)
  }

  return (
    <div className="terminal-body relative flex flex-col h-[calc(100%-2.25rem)] sm:h-[calc(100%-2.5rem)] md:h-[calc(100%-2.75rem)] bg-[#0a0a0a]">
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1)_0px,rgba(0,0,0,0.1)_1px,transparent_1px,transparent_2px)] opacity-[0.03] z-10" />

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5 relative z-20 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700"
      >
        {showWelcome && <WelcomeScreen theme={theme} />}

        <div className="messages-container mt-3 sm:mt-4 space-y-3">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              theme={theme}
              shouldAnimate={message.id === typingMessageId}
              onAnimationComplete={message.id === typingMessageId ? onTypingComplete : undefined}
              onCommandClick={handleCommandClick}
            />
          ))}
        </div>
      </div>

      <div className="relative z-20">
        <CommandInput
          onSubmit={onSubmit}
          onHistoryNavigate={onHistoryNavigate}
          disabled={isTyping}
          theme={theme}
          isTyping={isTyping}
          onStopGeneration={onStopGeneration}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          onNewChat={onNewChat}
        />
      </div>
    </div>
  )
}

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TerminalHeader } from "./terminal-header"
import { TerminalBody } from "./terminal-body"
import { useCommandHistory } from "@/hooks/use-command-history"
import { handleCommand, isBuiltInCommand } from "@/utils/command-handler"
import type { Message, ThemeColor } from "@/types/message.types"
import { DEFAULT_MODEL, type ModelId } from "@/constants/models"
import {
  generateConversationId,
  getConversationTitle,
  saveConversation,
  loadConversation,
} from "@/utils/conversation-utils"
import { apiClient } from "@/lib/api-client"

interface TerminalProps {
  initialMessage?: string
  initialModel?: ModelId
  initialChatId?: string
}

export function Terminal({ initialMessage, initialModel, initialChatId }: TerminalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const theme: ThemeColor = "green"
  const [showWelcome, setShowWelcome] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>(initialModel || DEFAULT_MODEL)
  const [conversationId, setConversationId] = useState<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const initializedRef = useRef(false)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const { history, addToHistory, navigateHistory } = useCommandHistory()

  const addMessage = useCallback((type: Message["type"], content: string, isTyping: boolean = false): string => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newMessage: Message = {
      id,
      type,
      content,
      timestamp: new Date(),
      isTyping, // Add typing flag to message
    }
    setMessages((prev) => [...prev, newMessage])
    return id
  }, [])

  const updateMessage = useCallback((id: string, content: string, isTyping: boolean = true) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content, isTyping } : msg))
    )
  }, [])

  // Function to simulate typing effect
  const typeText = useCallback(
    (messageId: string, fullText: string) => {
      console.log('[Typing] Starting typing effect for', fullText.length, 'characters')
      
      // Clear any existing typing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
      
      let currentIndex = 0
      
      // Use setInterval for more reliable timing
      typingIntervalRef.current = setInterval(() => {
        if (currentIndex >= fullText.length) {
          console.log('[Typing] Complete - switching to markdown render')
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current)
            typingIntervalRef.current = null
          }
          // Mark as not typing anymore - this will trigger markdown render
          // Wait a tiny bit before rendering markdown to ensure smooth transition
          setTimeout(() => {
            updateMessage(messageId, fullText, false)
            setIsTyping(false)
            setTypingMessageId(null)
          }, 100)
          return
        }
        
        // Type faster - 8-12 characters at once for smoother effect
        const charsToAdd = Math.min(10, fullText.length - currentIndex)
        currentIndex += charsToAdd
        const textToShow = fullText.substring(0, currentIndex)
        // Keep isTyping=true so it shows as plain text
        updateMessage(messageId, textToShow, true)
        
        // Log every 200 characters to reduce console spam
        if (currentIndex % 200 === 0 || currentIndex === fullText.length) {
          console.log('[Typing] Progress:', currentIndex, '/', fullText.length)
        }
      }, 12) // 12ms interval - smooth and fast
    },
    [updateMessage]
  )

  // Function to process streaming AI response with typing effect
  const processStreamingResponse = useCallback(
    async (reader: ReadableStreamDefaultReader<Uint8Array>, messageId: string) => {
      const decoder = new TextDecoder()
      let fullContent = ""
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('[Stream] Complete - Full content length:', fullContent.length)
            
            // If we have content, start typing effect
            if (fullContent.length > 0) {
              typeText(messageId, fullContent)
            }
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          console.log('[Stream] Raw chunk:', chunk)

          // Process complete lines
          const lines = buffer.split("\n")
          buffer = lines.pop() || "" // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            console.log('[Stream] Processing line:', trimmedLine)

            // Handle SSE format: "data: {...}"
            if (trimmedLine.startsWith("data: ")) {
              const data = trimmedLine.slice(6).trim()

              if (data === "[DONE]") {
                console.log('[Stream] Received [DONE] signal')
                continue
              }

              try {
                const parsed = JSON.parse(data)
                console.log('[Stream] Parsed data:', parsed)
                
                // Try multiple possible content paths
                let content = ""
                
                // OpenAI format
                if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content
                }
                // Alternative format
                else if (parsed.content) {
                  content = parsed.content
                }
                // Another alternative
                else if (parsed.message?.content) {
                  content = parsed.message.content
                }
                // Direct text
                else if (typeof parsed === 'string') {
                  content = parsed
                }

                if (content) {
                  console.log('[Stream] Content chunk:', content)
                  fullContent += content
                }
              } catch (e) {
                console.warn('[Stream] Failed to parse JSON:', data, e)
                // If it's not JSON, treat as plain text
                if (data && data !== "[DONE]") {
                  fullContent += data
                }
              }
            }
            // Handle plain text chunks (no "data:" prefix)
            else if (trimmedLine && !trimmedLine.startsWith("{")) {
              console.log('[Stream] Plain text chunk:', trimmedLine)
              fullContent += trimmedLine + "\n"
            }
            // Handle direct JSON without "data:" prefix
            else if (trimmedLine.startsWith("{")) {
              try {
                const parsed = JSON.parse(trimmedLine)
                console.log('[Stream] Direct JSON:', parsed)
                
                let content = parsed.choices?.[0]?.delta?.content 
                  || parsed.content 
                  || parsed.message?.content
                  || ""
                
                if (content) {
                  fullContent += content
                }
              } catch (e) {
                console.warn('[Stream] Failed to parse direct JSON:', trimmedLine)
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim() && buffer.trim() !== "[DONE]") {
          console.log('[Stream] Processing remaining buffer:', buffer)
          fullContent += buffer
        }

        console.log('[Stream] Final content:', fullContent)

      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('[Stream] Error:', error)
          addMessage("system", `Error: ${error.message}`)
        }
      }
    },
    [typeText, addMessage]
  )

  const handleNewChat = useCallback(() => {
    const newChatId = generateConversationId()
    setConversationId(newChatId)
    setMessages([])
    setShowWelcome(true)
    setIsTyping(false)
    setTypingMessageId(null)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }
    router.push(`/?chatid=${newChatId}`)
  }, [router])

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }
    setIsTyping(false)
    setTypingMessageId(null)
    addMessage("system", "Response generation was stopped by user.")
  }, [addMessage])

  const handleSubmit = useCallback(
    async (input: string) => {
      addToHistory(input)
      setShowWelcome(false)

      let currentChatId = conversationId
      if (!currentChatId) {
        currentChatId = generateConversationId()
        setConversationId(currentChatId)
      }

      // Handle built-in commands
      if (isBuiltInCommand(input)) {
        const result = handleCommand(input, history)

        if (result.action === "clear") {
          setMessages([])
          setShowWelcome(true)
          return
        }

        if (result.action === "exit") {
          router.push("/")
          return
        }

        if (result.action === "history") {
          const historyResult = handleCommand("history", history)
          if (historyResult.output) {
            addMessage("system", historyResult.output)
          }
          return
        }

        if (result.output) {
          addMessage("system", result.output)
        }
        return
      }

      // Add user message
      const userMessage = addMessage("user", input)

      // Update URL with conversation state
      const params = new URLSearchParams()
      params.set("message", encodeURIComponent(input))
      params.set("model", selectedModel)
      params.set("chatid", currentChatId)
      router.push(`/?${params.toString()}`, { scroll: false })

      // Prepare AI request
      setIsTyping(true)
      abortControllerRef.current = new AbortController()

      // Create empty assistant message for streaming
      const assistantMessageId = addMessage("assistant", "", true) // Mark as typing
      setTypingMessageId(assistantMessageId)

      try {
        // Prepare conversation history
        const conversationHistory = messages
          .filter((m) => m.type !== "system")
          .map((m) => ({
            role: m.type === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content,
          }))

        console.log('[API] Sending request:', {
          conversationId: currentChatId,
          model: selectedModel,
          historyLength: conversationHistory.length,
        })

        // Call streaming API
        const reader = await apiClient.sendMessageStream({
          message: input,
          model: selectedModel,
          conversationId: currentChatId,
          history: conversationHistory,
          stream: true,
        })

        // Process the stream with typing effect
        await processStreamingResponse(reader, assistantMessageId)

        // Save conversation to localStorage
        setMessages((currentMessages) => {
          const updatedMessages = currentMessages
          saveConversation(currentChatId, {
            id: currentChatId,
            title: getConversationTitle(input),
            messages: updatedMessages,
            model: selectedModel,
            createdAt: messages.length === 0 ? new Date() : loadConversation(currentChatId)?.createdAt || new Date(),
            updatedAt: new Date(),
          })
          return currentMessages
        })
      } catch (error) {
        console.error('[API] Error:', error)
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            // User cancelled - already handled by handleStopGeneration
            return
          }
          
          // Show error message
          updateMessage(
            assistantMessageId,
            `❌ **Error**: ${error.message}\n\nPlease check:\n- Backend server is running\n- API endpoint is correct: \`${process.env.NEXT_PUBLIC_API_BASE_URL}\`\n- CORS is configured properly`
          )
        } else {
          updateMessage(
            assistantMessageId,
            "❌ **Error**: An unexpected error occurred. Please try again."
          )
        }
      } finally {
        setIsTyping(false)
        setTypingMessageId(null)
        abortControllerRef.current = null
      }
    },
    [
      addMessage,
      updateMessage,
      addToHistory,
      history,
      router,
      conversationId,
      selectedModel,
      messages,
      processStreamingResponse,
    ]
  )

  // Initialize conversation on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Load existing conversation or create new one
    if (initialChatId) {
      setConversationId(initialChatId)
      const savedConversation = loadConversation(initialChatId)
      if (savedConversation && savedConversation.messages) {
        setMessages(savedConversation.messages)
        setShowWelcome(false)
      }
    } else {
      const newChatId = generateConversationId()
      setConversationId(newChatId)
    }

    // Process initial message if provided
    if (initialMessage && initialChatId) {
      // Delay to ensure state is ready
      setTimeout(() => {
        handleSubmit(initialMessage)
      }, 100)
    }
  }, [initialMessage, initialModel, initialChatId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="terminal-container w-full h-full mx-auto rounded-lg sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-[#222] flex flex-col animate-in fade-in zoom-in-95 duration-500">
      <TerminalHeader />
      <TerminalBody
        messages={messages}
        theme={theme}
        showWelcome={showWelcome}
        isTyping={isTyping}
        matrixActive={false}
        typingMessageId={typingMessageId}
        onTypingComplete={useCallback(() => {
          setIsTyping(false)
          setTypingMessageId(null)
          abortControllerRef.current = null
        }, [])}
        onSubmit={handleSubmit}
        onHistoryNavigate={navigateHistory}
        onStopGeneration={handleStopGeneration}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onNewChat={handleNewChat}
      />
    </div>
  )
}
"use client"

import { useEffect, useRef, useCallback } from "react"

export const useTerminalScroll = (dependency: unknown) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [dependency, scrollToBottom])

  return { scrollRef, scrollToBottom }
}

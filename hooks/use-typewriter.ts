"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseTypewriterOptions {
  speed?: number
  onComplete?: () => void
}

export const useTypewriter = (text: string, isActive: boolean, options: UseTypewriterOptions = {}) => {
  const { speed = 20, onComplete } = options
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const reset = useCallback(() => {
    indexRef.current = 0
    setDisplayedText("")
    setIsTyping(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isActive) {
      setDisplayedText(text)
      return
    }

    reset()
    setIsTyping(true)

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1))
        indexRef.current++
        timeoutRef.current = setTimeout(typeNextChar, speed)
      } else {
        setIsTyping(false)
        onComplete?.()
      }
    }

    timeoutRef.current = setTimeout(typeNextChar, speed)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, isActive, speed, onComplete, reset])

  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setDisplayedText(text)
    setIsTyping(false)
    indexRef.current = text.length
    onComplete?.()
  }, [text, onComplete])

  return { displayedText, isTyping, skipToEnd }
}

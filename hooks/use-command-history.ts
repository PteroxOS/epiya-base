"use client"

import { useState, useCallback } from "react"

const MAX_HISTORY = 50

export const useCommandHistory = () => {
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const addToHistory = useCallback((command: string) => {
    if (!command.trim()) return

    setHistory((prev) => {
      const newHistory = [...prev, command].slice(-MAX_HISTORY)
      return newHistory
    })
    setHistoryIndex(-1)
  }, [])

  const navigateHistory = useCallback(
    (direction: "up" | "down"): string | null => {
      if (history.length === 0) return null

      let newIndex: number
      if (direction === "up") {
        newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
      } else {
        newIndex = historyIndex === -1 ? -1 : Math.min(history.length - 1, historyIndex + 1)
        if (newIndex === history.length - 1 && historyIndex === history.length - 1) {
          setHistoryIndex(-1)
          return ""
        }
      }

      setHistoryIndex(newIndex)
      return history[newIndex] ?? ""
    },
    [history, historyIndex],
  )

  const resetHistoryIndex = useCallback(() => {
    setHistoryIndex(-1)
  }, [])

  return {
    history,
    addToHistory,
    navigateHistory,
    resetHistoryIndex,
  }
}

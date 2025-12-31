export function generateConversationId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function getConversationTitle(firstMessage: string): string {
  const maxLength = 50
  const title = firstMessage.trim()
  return title.length > maxLength ? title.substring(0, maxLength) + "..." : title
}

export function saveConversation(conversationId: string, data: any): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`conversation-${conversationId}`, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save conversation:", error)
  }
}

export function loadConversation(conversationId: string): any | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(`conversation-${conversationId}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Failed to load conversation:", error)
    return null
  }
}

export function getAllConversations(): any[] {
  if (typeof window === "undefined") return []
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("conversation-"))
    return keys
      .map((key) => {
        try {
          return JSON.parse(localStorage.getItem(key) || "")
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    console.error("Failed to get conversations:", error)
    return []
  }
}

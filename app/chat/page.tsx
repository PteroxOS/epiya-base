import { Suspense } from "react"
import { Terminal } from "@/components/terminal/terminal"

function ChatContent() {
  return <Terminal />
}

export default function ChatPage() {
  return (
    <main className="h-[100dvh] w-screen bg-[#0d0d0d] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-green-400 font-mono text-sm animate-pulse">Loading...</div>
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </main>
  )
}

import { Suspense } from "react"
import { TerminalRouter } from "@/components/terminal/terminal-router"

export default function Home() {
  return (
    <main className="h-screen w-screen bg-[#0d0d0d] sm:p-4 md:p-6 lg:p-8 overflow-hidden">
      <div className="w-full h-full sm:max-w-[1400px] sm:mx-auto">
        <Suspense fallback={null}>
          <TerminalRouter />
        </Suspense>
      </div>
    </main>
  )
}

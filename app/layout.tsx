import type React from "react"
import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Epiya-AI Terminal - AI Chat Interface",
  description: "A modern terminal-style AI chat interface with markdown support and theming",
  keywords: ["AI", "terminal", "chat", "Epiya", "CLI", "markdown"],
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono antialiased bg-[#0d0d0d]`}>{children}</body>
    </html>
  )
}

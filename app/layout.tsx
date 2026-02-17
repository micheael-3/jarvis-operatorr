import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JARVIS | Autonomous Execution Operator',
  description: 'Execute tasks, get results. No chat, just outcomes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-jarvis-bg min-h-screen">{children}</body>
    </html>
  )
}
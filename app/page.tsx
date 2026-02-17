'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const JARVIS_API = 'https://www.sim.ai/api/workflows/0f32eaf4-001f-4283-b574-0a618a8b9cd1/run'
const STORAGE_KEY = 'jarvis_chat_history'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }
    setMounted(true)
  }, [])

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (mounted && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages, mounted])

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    // Handle /reset command
    if (trimmed === '/reset') {
      localStorage.removeItem(STORAGE_KEY)
      setMessages([])
      setInput('')
      return
    }

    const msg: Message = { role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    const newMessages = [...messages, msg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setStatus('EXECUTING')

    try {
      const res = await fetch(JARVIS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed })
      })
      const data = await res.json()
      const reply: Message = {
        role: 'assistant',
        content: data.output?.content || data.content || JSON.stringify(data, null, 2),
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, reply])
      setStatus('COMPLETED')
    } catch (e) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `Error: ${e instanceof Error ? e.message : 'Unknown'}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMsg])
      setStatus('ERROR')
    } finally {
      setIsLoading(false)
      setTimeout(() => setStatus(null), 3000)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      <header className="border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"/>
            <h1 className="text-xl font-semibold text-white">JARVIS</h1>
            <span className="text-xs text-gray-500 bg-[#12121a] px-2 py-1 rounded">OPERATOR</span>
          </div>
          <div className="flex items-center gap-4">
            {status && <span className={`text-sm ${status==='COMPLETED'?'text-green-500':status==='ERROR'?'text-red-500':'text-yellow-500'}`}>{status}</span>}
            <span className="text-xs text-gray-600">{messages.length} messages</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl rounded-lg px-4 py-3 ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-[#12121a] border border-[#1e1e2e] text-white'}`}>
                {m.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert max-w-none">{m.content}</ReactMarkdown> : m.content}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-gray-500">Executing...</div></div>}
          <div ref={endRef}/>
        </div>
      </main>

      <footer className="border-t border-[#1e1e2e] px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-4">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Enter task... (type /reset to clear history)" className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"/>
          <button onClick={send} disabled={isLoading||!input.trim()} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">Execute</button>
        </div>
      </footer>
    </div>
  )
}
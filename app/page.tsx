'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const JARVIS_API = 'https://www.sim.ai/api/workflows/0f32eaf4-001f-4283-b574-0a618a8b9cd1/run'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || isLoading) return
    const msg: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(p => [...p, msg])
    setInput('')
    setIsLoading(true)
    setStatus('EXECUTING')

    try {
      const res = await fetch(JARVIS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: msg.content })
      })
      const data = await res.json()
      setMessages(p => [...p, {
        role: 'assistant',
        content: data.output?.content || data.content || JSON.stringify(data, null, 2),
        timestamp: new Date()
      }])
      setStatus('COMPLETED')
    } catch (e) {
      setMessages(p => [...p, {
        role: 'assistant',
        content: `Error: ${e instanceof Error ? e.message : 'Unknown'}`,
        timestamp: new Date()
      }])
      setStatus('ERROR')
    } finally {
      setIsLoading(false)
      setTimeout(() => setStatus(null), 3000)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      <header className="border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"/>
            <h1 className="text-xl font-semibold text-white">JARVIS</h1>
            <span className="text-xs text-gray-500 bg-[#12121a] px-2 py-1 rounded">OPERATOR</span>
          </div>
          {status && <span className={`text-sm ${status==='COMPLETED'?'text-green-500':status==='ERROR'?'text-red-500':'text-yellow-500'}`}>{status}</span>}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-2xl text-white mb-2">Autonomous Execution Operator</h2>
              <p className="text-gray-500">Execute tasks. Get results.</p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {['Research top AI tools', 'Check my calendar', 'Summarize tech news'].map((ex, i) => (
                  <button key={i} onClick={() => setInput(ex)} className="p-4 bg-[#12121a] border border-[#1e1e2e] rounded-lg text-sm text-gray-400 hover:text-white hover:border-blue-500 transition-colors text-left">{ex}</button>
                ))}
              </div>
            </div>
          )}
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
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Enter task..." className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"/>
          <button onClick={send} disabled={isLoading||!input.trim()} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">Execute</button>
        </div>
      </footer>
    </div>
  )
}
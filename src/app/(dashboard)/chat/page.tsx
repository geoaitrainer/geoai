'use client'

import { useRef, useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'დღეს რა ვჭამო?',
  'რამდენი ცილა მჭირდება?',
  'დღეს ფეხების ვარჯიში მაქვს?',
  'რამდენი წყალი უნდა დავლიო?',
  'რატომ არ ვიკლებ?',
  'ვარჯიშის შემდეგ რა ვჭამო?',
  'კარგი საუზმე შემომთავაზე',
  'ბოდიმასა ინდექსი ახსნე',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: 'შეცდომა. სცადეთ ხელახლა.' } : m
        ))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        ))
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: 'შეცდომა. სცადეთ ხელახლა.' } : m
        ))
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex flex-col h-dvh pb-16 md:pb-0">
      <TopBar title="AI ჩატი" subtitle="პირადი ტრენერი და კვების სპეციალისტი" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="w-20 h-20 rounded-3xl bg-primary-600 flex items-center justify-center text-4xl mb-4">
              🤖
            </div>
            <h2 className="text-xl font-semibold mb-2">AI ტრენერი მზადაა!</h2>
            <p className="text-[var(--muted-foreground)] text-sm mb-8 max-w-sm">
              მე ვიცი შენი კვების გეგმა, ვარჯიშის პროგრამა და პროგრესი. ნებისმიერ კითხვაზე გიპასუხებ ქართულად.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-primary-500 text-sm transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">
                🤖
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-[var(--card)] border border-[var(--border)] rounded-tl-sm'
            }`}>
              {msg.content === '' && msg.role === 'assistant' ? (
                <div className="flex gap-1 py-1">
                  <span className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm ml-2 mt-1 flex-shrink-0">
                👤
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts when chatting */}
      {messages.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-[var(--border)] bg-[var(--card)]">
          {QUICK_PROMPTS.slice(0, 4).map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-[var(--muted)] hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="დაწერე შეკითხვა..."
            disabled={isLoading}
            className="flex-1 input-field"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="md">
            {isLoading ? '⏳' : '➤'}
          </Button>
        </form>
      </div>
    </div>
  )
}

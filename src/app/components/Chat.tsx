'use client'

import { useState, useRef, useEffect } from 'react'

interface Source {
    id: string
    title: string
    score: number
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: Source[]
}

export function Chat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setLoading(true)

        // Optimistic update — affiche le message user immédiatement
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])

        // Placeholder message assistant
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, conversationId }),
            })

            if (!res.body) throw new Error('No stream')

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            // Lit le stream chunk par chunk
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                fullText += decoder.decode(value, { stream: true })

                // Détecte et extrait le bloc __META__
                const metaIndex = fullText.indexOf('__META__')
                const displayText = metaIndex !== -1
                    ? fullText.slice(0, metaIndex)
                    : fullText

                // Met à jour le dernier message assistant en temps réel
                setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: displayText,
                    }
                    return updated
                })
            }

            // Extrait les métadonnées finales
            const metaMatch = fullText.match(/__META__(.+?)__META__/)
            if (metaMatch) {
                const meta = JSON.parse(metaMatch[1])
                setConversationId(meta.conversationId)

                // Ajoute les sources au dernier message
                setMessages(prev => {
                    const updated = [...prev]
                    const lastMsg = updated[updated.length - 1]
                    updated[updated.length - 1] = {
                        ...lastMsg,
                        content: fullText.slice(0, fullText.indexOf('__META__')),
                        sources: meta.sources,
                    }
                    return updated
                })
            }

        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: 'Une erreur est survenue. Réessaie.',
                }
                return updated
            })
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-6 p-6">
                {messages.length === 0 && (
                    <div className="text-center py-20 space-y-3">
                        <div className="text-4xl opacity-20">🧠</div>
                        <p className="text-zinc-600 font-mono text-sm">
                            Pose une question — je cherche dans tes notes.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {[
                                "Qu'est ce qu'un embedding ?",
                                "Explique moi l'apprentissage automatique",
                                "Résume mes notes sur l'IA",
                            ].map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => { setInput(suggestion); }}
                                    className="text-xs font-mono text-zinc-600 border border-zinc-800 px-3 py-1.5 rounded hover:border-zinc-600 hover:text-zinc-400 transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>

                            {/* Bubble */}
                            <div className={`
                px-4 py-3 rounded-lg text-sm leading-relaxed font-mono whitespace-pre-wrap
                ${msg.role === 'user'
                                ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
                                : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                            }
              `}>
                                {msg.content || (
                                    <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>·</span>
                  </span>
                                )}
                            </div>

                            {/* Sources */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="space-y-1 w-full">
                                    <p className="text-xs text-zinc-600 font-mono">Sources :</p>
                                    {msg.sources.map((source, j) => (
                                        <div
                                            key={j}
                                            className="flex items-center gap-2 text-xs font-mono text-zinc-500 border border-zinc-800 px-3 py-1.5 rounded bg-zinc-900/50"
                                        >
                                            <span className="text-emerald-500">◆</span>
                                            <span className="flex-1 truncate">{source.title}</span>
                                            <span className="text-zinc-700">
                        {Math.round(source.score * 100)}%
                      </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-800 p-4">
                {conversationId && (
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={() => {
                                setMessages([])
                                setConversationId(null)
                            }}
                            className="text-xs text-zinc-700 hover:text-zinc-500 font-mono transition-colors"
                        >
                            + Nouvelle conversation
                        </button>
                    </div>
                )}
                <div className="flex gap-3">
          <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose une question sur tes notes... (Enter pour envoyer)"
              rows={2}
              disabled={loading}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono resize-none disabled:opacity-50 transition-colors"
          />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="px-5 bg-emerald-500 text-black font-mono font-bold text-sm rounded-lg hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end pb-3 pt-3"
                    >
                        {loading ? '...' : '→'}
                    </button>
                </div>
                <p className="text-xs text-zinc-700 font-mono mt-2 text-center">
                    Shift+Enter pour nouvelle ligne · Enter pour envoyer
                </p>
            </div>
        </div>
    )
}
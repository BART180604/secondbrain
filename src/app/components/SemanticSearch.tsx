"use client"
import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'

interface SearchResult {
    id: string
    title: string
    content: string
    sourceUrl?: string | null
    tags: string[]
    createdAt: string
    score: number
}

interface SemanticSearchProps {
    onResultsChange: (results: SearchResult[], query: string) => void
    onClear: () => void
}
export function SemanticSearch({ onResultsChange, onClear }: SemanticSearchProps) {

    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [debouncedQuery] = useDebounce(query, 600)

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            onClear()
            return
        }

        const search = async () => {
            setLoading(true)
            try {
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`
                )
                const data = await res.json()
                onResultsChange(data.results || [], debouncedQuery)
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }

        search()
    }, [debouncedQuery])

    return (
        <div className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Recherche sémantique — pose une question..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                />

                {/* Indicateur état */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    ) : query ? (
                        <button
                            onClick={() => { setQuery(''); onClear(); }}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors text-lg leading-none"
                        >
                            ×
                        </button>
                    ) : (
                        <span className="text-zinc-700 text-xs">⌕</span>
                    )}
                </div>
            </div>

            {/* Badge mode */}
            {query && (
                <div className="absolute -bottom-5 left-0">
          <span className="text-xs font-mono text-emerald-500 opacity-70">
            {loading ? 'génération embedding...' : '● sémantique'}
          </span>
                </div>
            )}
        </div>
    )
}
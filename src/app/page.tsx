'use client'

import { useEffect, useState } from 'react'
import { NoteCard } from '@/app/components/NoteCard'
import { NoteForm } from '@/app/components/NoteForm'
import { TagBadge } from '@/app/components/TagBadge'
import { SemanticSearch } from '@/app/components/SemanticSearch'
import { SearchResultCard } from '@/app/components/SearchResultCard'
import { Chat } from '@/app/components/Chat'

interface Note {
  id: string
  title: string
  content: string
  sourceUrl?: string | null
  tags: string[]
  createdAt: string
}

interface SearchResult extends Note {
  score: number
}

type ViewMode = 'notes' | 'search'
type ActiveTab = 'notes' | 'chat'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('notes')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('notes')

  useEffect(() => {
    const fetchNotes = async () => {
      const params = new URLSearchParams()
      if (activeTag) params.set('tag', activeTag)
      const res = await fetch(`/api/notes?${params}`)
      const data = await res.json()
      setNotes(data.notes || [])
      setLoading(false)
    }
    fetchNotes()
  }, [activeTag])

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div>
            <h1 className="font-mono font-bold text-lg tracking-tight">
              <span className="text-emerald-400">⬡</span> SecondBrain
            </h1>
            <p className="text-xs text-zinc-600 font-mono">{notes.length} notes indexées</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border border-zinc-800 rounded-lg p-1">
            {(['notes', 'chat'] as ActiveTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-1.5 rounded text-xs font-mono transition-all
                  ${activeTab === tab
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-400'
                  }
                `}
              >
                {tab === 'notes' ? '📝 Notes' : '🧠 Chat'}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-700 font-mono">Sprint 4 · RAG Chat</div>
        </div>

        {/* Search — uniquement sur l'onglet notes */}
        {activeTab === 'notes' && (
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <SemanticSearch
              onResultsChange={(results, query) => {
                setSearchResults(results)
                setSearchQuery(query)
                setViewMode('search')
              }}
              onClear={() => {
                setSearchResults([])
                setSearchQuery('')
                setViewMode('notes')
              }}
            />
          </div>
        )}
      </header>

      {/* Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        {activeTab === 'chat' ? (
          /* CHAT TAB */
          <div className="h-[calc(100vh-180px)] border border-zinc-800 rounded-lg overflow-hidden">
            <Chat />
          </div>

        ) : viewMode === 'search' ? (
          /* SEARCH RESULTS */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-mono">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} pour
                </p>
                <p className="text-sm text-emerald-400 font-mono mt-0.5">&#34;{searchQuery}&#34;</p>
              </div>
              <button
                onClick={() => { setSearchResults([]); setViewMode('notes') }}
                className="text-xs text-zinc-600 hover:text-zinc-400 font-mono border border-zinc-800 px-3 py-1.5 rounded hover:border-zinc-600 transition-all"
              >
                ← Toutes les notes
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-600 font-mono text-sm">Aucun résultat pertinent.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map(result => (
                  <SearchResultCard key={result.id} result={result} query={searchQuery} />
                ))}
              </div>
            )}
          </div>

        ) : (
          /* NOTES TAB */
          <div className="space-y-6">
            <NoteForm onNoteCreated={(note) => setNotes(prev => [note, ...prev])} />

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-zinc-600 font-mono">Filter:</span>
                <TagBadge tag="tout" active={activeTag === null} onClick={() => setActiveTag(null)} />
                {allTags.map(tag => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    active={activeTab === tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  />
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-zinc-700 font-mono text-sm">Chargement...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="text-4xl opacity-20">🧠</div>
                <p className="text-zinc-600 font-mono text-sm">
                  {activeTag ? 'Aucune note avec ce tag.' : "Ton second cerveau t'attend."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onDelete={(id) => setNotes(prev => prev.filter(n => n.id !== id))}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

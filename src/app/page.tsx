'use client'

import { useEffect, useState } from 'react'
import { NoteCard } from '@/app/components/NoteCard'
import { NoteForm } from '@/app/components/NoteForm'
import { TagBadge } from '@/app/components/TagBadge'
import { SemanticSearch } from '@/app/components/SemanticSearch'
import { SearchResultCard } from '@/app/components/SearchResultCard'

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

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('notes')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleSearchResults = (results: SearchResult[], query: string) => {
    setSearchResults(results)
    setSearchQuery(query)
    setViewMode('search')
  }

  const handleSearchClear = () => {
    setSearchResults([])
    setSearchQuery('')
    setViewMode('notes')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-mono font-bold text-lg tracking-tight">
                <span className="text-emerald-400">⬡</span> SecondBrain
              </h1>
              <p className="text-xs text-zinc-600 font-mono">{notes.length} notes indexées</p>
            </div>
            <div className="text-xs text-zinc-700 font-mono">Sprint 3 · RAG</div>
          </div>

          {/* Semantic Search */}
          <SemanticSearch
            onResultsChange={handleSearchResults}
            onClear={handleSearchClear}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {viewMode === 'search' ? (
          /* MODE RECHERCHE SÉMANTIQUE */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-mono">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} pour
                </p>
                <p className="text-sm text-emerald-400 font-mono mt-0.5">
                  &#34;{searchQuery}&#34;
                </p>
              </div>
              <button
                onClick={handleSearchClear}
                className="text-xs text-zinc-600 hover:text-zinc-400 font-mono transition-colors border border-zinc-800 px-3 py-1.5 rounded hover:border-zinc-600"
              >
                ← Toutes les notes
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-3xl opacity-20">🔍</div>
                <p className="text-zinc-600 font-mono text-sm">
                  Aucun résultat pertinent trouvé.
                </p>
                <p className="text-zinc-700 font-mono text-xs">
                  Essaie une formulation différente ou capture plus de notes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(result => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    query={searchQuery}
                  />
                ))}
              </div>
            )}
          </div>

        ) : (
          /* MODE NOTES */
          <div className="space-y-6">
            <NoteForm onNoteCreated={(note) => setNotes(prev => [note, ...prev])} />

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-zinc-600 font-mono">Filter:</span>
                <TagBadge
                  tag="tout"
                  active={activeTag === null}
                  onClick={() => setActiveTag(null)}
                />
                {allTags.map(tag => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    active={activeTag === tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  />
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-zinc-700 font-mono text-sm">
                Chargement...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="text-4xl opacity-20">🧠</div>
                <p className="text-zinc-600 font-mono text-sm">
                  {activeTag
                    ? 'Aucune note avec ce tag.'
                    : "Ton second cerveau t'attend. Capture ta première note."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

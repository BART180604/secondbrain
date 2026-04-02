'use client'

import { useEffect, useState } from 'react'
import { NoteCard } from '@/app/components/NoteCard'
import { NoteForm } from '@/app/components/NoteForm'
import { TagBadge } from '@/app/components/TagBadge'
/*Ce composant fait 4 choses :

Récupérer les notes depuis l’API
Gérer les filtres (recherche + tag)
Gérer l’état global (notes, loading…)
Distribuer les données aux composants enfants*/
interface Note {
  id: string
  title: string
  content: string
  sourceUrl?: string | null
  tags: string[]
  createdAt: string
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotes = async () => {
      //le filtre
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (activeTag) params.set('tag', activeTag)
      //appel api
      const res = await fetch(`/api/notes?${params}`)
      const data = await res.json()

      setNotes(data.notes || [])
      setLoading(false)
    }

    fetchNotes()
  }, [search, activeTag])

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)))

  return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
            <div>
              <h1 className="font-mono font-bold text-lg tracking-tight">
                <span className="text-emerald-400">⬡</span> SecondBrain
              </h1>
              <p className="text-xs text-zinc-600 font-mono">{notes.length} notes</p>
            </div>
            <div className="flex-1 max-w-sm">
              <input
                  type="text"
                  placeholder="Recherche rapide..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
              />
            </div>
            <div className="text-xs text-zinc-700 font-mono">Sprint 1</div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
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
                  {search || activeTag
                      ? 'Aucun résultat.'
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
        </main>
      </div>
  )
}
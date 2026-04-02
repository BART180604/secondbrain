'use client'

import { useState } from 'react'
import { TagBadge } from './TagBadge'

//Réflexe : toujours typé les donnés venant du backend
interface Note {
    id: string
    title: string
    content: string
    sourceUrl?: string | null
    tags: string[]
    createdAt: string
}

//le composant attend une note et une fonction de suppression
interface NoteCardProps {
    note: Note
    onDelete: (id: string) => void
}

export function NoteCard({ note, onDelete }: Readonly<NoteCardProps>) {
    const [expanded, setExpanded] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Supprimer cette note ?')) return
        setDeleting(true)
        await fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
        onDelete(note.id)
    }

    const preview = note.content.slice(0, 200)
    const hasMore = note.content.length > 200

    return (
        <div className="group border border-zinc-800 bg-zinc-900/50 rounded-lg p-4 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-zinc-200 text-sm leading-snug flex-1">
                    {note.title}
                </h3>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all text-xs px-2 py-1 border border-transparent hover:border-red-900/50 rounded"
                >
                    {deleting ? '...' : '✕'}
                </button>
            </div>

            <p className="text-zinc-500 text-xs leading-relaxed font-mono mb-3">
                {expanded ? note.content : preview}
                {hasMore && !expanded && '...'}
            </p>

            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-3 block"
                >
                    {expanded ? '▲ Réduire' : '▼ Voir tout'}
                </button>
            )}

            {note.sourceUrl && (
                <a
                    href={note.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-zinc-600 hover:text-emerald-400 font-mono truncate mb-3 transition-colors"
                >
                    ↗ {note.sourceUrl}
                </a>
            )}

            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                        <TagBadge key={tag} tag={tag} />
                    ))}
                </div>
                <span className="text-xs text-zinc-700 font-mono flex-shrink-0">
                    {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short'
                    })}
                </span>
            </div>
        </div>
    )
}
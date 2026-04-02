import { useState } from 'react'

interface Note {
    id: string
    title: string
    content: string
    sourceUrl?: string | null
    tags: string[]
    createdAt: string
}

interface NoteFormProps {
    onNoteCreated: (note: Note) => void
}

export function NoteForm({ onNoteCreated }: Readonly<NoteFormProps>) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: '',
        content: '',
        sourceUrl: '',
        tags: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.content) return
        setLoading(true)
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    tags: form.tags
                        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
                        : [],
                }),
            })
            const data = await res.json()
            if (data.note) {
                onNoteCreated(data.note)
                setForm({ title: '', content: '', sourceUrl: '', tags: '' })
                setOpen(false)
            }
        } finally {
            setLoading(false)
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full border border-dashed border-zinc-700 rounded-lg p-4 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-all text-sm font-mono text-left"
            >
                + Nouvelle note...
            </button>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="border border-zinc-700 rounded-lg p-5 bg-zinc-900 space-y-4"
        >
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Nouvelle note</span>
                <button type="button" onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-400 text-sm">✕</button>
            </div>

            <input
                type="text"
                placeholder="Titre *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                required
            />

            <textarea
                placeholder="Contenu * — colle du texte, une idée, un résumé..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={5}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono resize-none"
                required
            />

            <input
                type="url"
                placeholder="URL source (optionnel)"
                value={form.sourceUrl}
                onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />

            <input
                type="text"
                placeholder="Tags séparés par virgules (ex: IA, notes, produit)"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={loading || !form.title || !form.content}
                    className="px-5 py-2 bg-emerald-500 text-black text-xs font-mono font-bold rounded hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Saving...' : 'Sauvegarder →'}
                </button>
            </div>
        </form>
    )
}
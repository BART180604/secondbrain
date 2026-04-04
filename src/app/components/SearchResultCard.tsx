'use client'

import { TagBadge } from './TagBadge'

interface SearchResult {
    id: string
    title: string
    content: string
    sourceUrl?: string | null
    tags: string[]
    createdAt: string
    score: number
}

interface SearchResultCardProps {
    result: SearchResult
    query: string
}

function ScoreBar({ score }: { score: number }) {

    const percent = Math.round(score * 100)
    const color = percent >= 70 ? 'bg-emerald-500' : percent >= 55 ? 'bg-yellow-500' :  'bg-zinc-600'

    return(
        <div className="flex item-center gap-2">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{width: `${percent}%` }}/>
            </div>
            <span className="text-xs font-mono text-zinc-600 w-8 text-right">
                {percent}%
            </span>
        </div>
    )
}

export function SearchResultCard({ result, query }: SearchResultCardProps) {
    const preview = result.content.slice(0, 180)

    return(
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-lg p-4 hover:border-zinc-700 transition-all duration-200">
            {/* Score */}
            <div className="mb-3">
                <ScoreBar score={result.score} />
            </div>
            {/* Titre */}
            <h3 className="font-semibold text-zinc-200 text-sm mb-2 leading-snug">
                {result.title}
            </h3>
            {/* Preview */}
            <p className="text-zinc-500 text-xs leading-relaxed font-mono mb-3">
                {preview}{result.content.length > 180 && '...'}
            </p>
            {/* Source */}
            {
                result.sourceUrl &&( <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-zinc-600 hover:text-emerald-400 font-mono truncate mb-3 transition-colors">
                        ↗ {result.sourceUrl}
                </a>)
            }
            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                    {result.tags?.map(tag => (
                        <TagBadge key={tag} tag={tag} />
                    ))}
                </div>
            </div>
            <span className="text-xs text-zinc-700 font-mono">
                {new Date(result.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short'
                })}
             </span>
        </div>
    )
}
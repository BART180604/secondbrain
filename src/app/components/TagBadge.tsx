interface TagBadgeProps {
    tag: string
    onClick?: () => void
    active?: boolean
}

export function TagBadge({ tag, onClick, active }: Readonly<TagBadgeProps>) {
    return (
        <span
            onClick={onClick}
            className={`
        inline-flex items-center px-2 py-0.5 rounded text-xs font-mono
        cursor-pointer transition-all duration-150 select-none
        ${active
                ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
            }
      `}
        >
      #{tag}
    </span>
    )
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from '@/lib/embeddings'

type NoteSearchResult = {
  id: string
  title: string
  content: string
  sourceUrl: string | null
  tags: string[]
  createdAt: Date
  score: number
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const limit = Number.parseInt(searchParams.get('limit') || '5')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Paramètre q requis' },
        { status: 400 }
      )
    }

    // 1. Transforme la query en vecteur
    const queryEmbedding = await generateEmbedding(query)
    const vectorString = `[${queryEmbedding.join(',')}]`

    // 2. Recherche sémantique via pgvector
    const results = await prisma.$queryRawUnsafe<NoteSearchResult[]>(`
      SELECT
        id,
        title,
        content,
        source_url AS "sourceUrl",
        tags,
        created_at AS "createdAt",
        1 - (embedding <=> '${vectorString}'::vector) AS score
      FROM notes
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> '${vectorString}'::vector) > 0.55
      ORDER BY embedding <=> '${vectorString}'::vector
      LIMIT ${limit}
    `)

    return NextResponse.json({
      query,
      results,
      total: results.length,
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Erreur recherche sémantique' },
      { status: 500 }
    )
  }
}

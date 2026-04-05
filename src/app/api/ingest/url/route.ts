import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'  //pour extraire une page web et y récupérer des informations
import { prisma } from '@/lib/prisma'
import {generateEmbedding} from "@/lib/embeddings";

type NoteSearchResult = {
    id: string
    title: string
    content: string
    sourceUrl: string | null
    tags: string[]
    createdAt: Date
    score: number
}

export async function POST(req: NextRequest){
    try {
        const {url,tags} = await req.json();
        if (!url) {
            return NextResponse.json({ error: 'URL requise' }, { status: 400 })
        }
        //Fetch la page si trouvé
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SecondBrain/1.0)',
            },
            signal: AbortSignal.timeout(10000), // 10s timeout
        })
        if (!response.ok) {
            return NextResponse.json(
                { error: `Impossible de fetch l'URL : ${response.status}` },
                { status: 400 }
            )
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        // Supprime les éléments inutiles
        $('script, style, nav, footer, header, iframe, img, svg').remove();
        // Extrait le titre
        const title =
            $('meta[property="og:title"]').attr('content') ||
            $('title').text() ||
            new URL(url).hostname

        // Extrait le contenu principal
        const content =
            $('article').text() ||
            $('main').text() ||
            $('body').text()

        // Nettoie le texte
        const cleanContent = content
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 10000) // limite à 10k caractères

        if (!cleanContent) {
            return NextResponse.json(
                { error: 'Impossible d\'extraire le contenu' },
                { status: 400 }
            )
        }

        //Générer l'embedding
        const embedding = await generateEmbedding(`${title}\n\n${cleanContent}`)
        const vectorString = `[${embedding.join(",")}]`
        const result = await prisma.$queryRawUnsafe<NoteSearchResult[]>(`
            INSERT INTO notes (id, title, content, source_url, tags, embedding, created_at, updated_at)
            VALUES (
                gen_random_uuid()::text,
                '${title.trim().slice(0, 255).replace(/'/g, "''")}',
                '${cleanContent.replace(/'/g, "''")}',
                '${url.replace(/'/g, "''")}',
                 ARRAY[${(tags || ['web']).map((t: string) => `'${t}'`).join(',')}]::text[],
                '${vectorString}'::vector,
                 NOW(),
                 NOW()
            )
            RETURNING id, title, content, source_url as "sourceUrl", tags, created_at as "createdAt"
        `)

        return NextResponse.json({ note: result[0] }, { status: 201 })
    }catch(err){
        console.log("[URL INGEST POST ERROR]",err);
        if (err instanceof Error && err.name === 'TimeoutError') {
            return NextResponse.json({ error: 'Timeout : URL trop lente' }, { status: 408 })
        }
        return NextResponse.json({success:false,message:"Internal server error"},{status:500})
    }
}
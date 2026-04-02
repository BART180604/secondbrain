import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'  //pour extraire une page web et y récupérer des informations
import { prisma } from '@/lib/prisma'


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
        const note = await prisma.note.create({
            data: {
                title: title.trim().slice(0, 255),
                content: cleanContent,
                sourceUrl: url,
                tags: tags || ['web'],
            },
        })
        return NextResponse.json({ note }, { status: 201 })
    }catch(err){
        console.log("[URL INGEST POST ERROR]",err);
        if (err instanceof Error && err.name === 'TimeoutError') {
            return NextResponse.json({ error: 'Timeout : URL trop lente' }, { status: 408 })
        }
        return NextResponse.json({success:false,message:"Internal server error"},{status:500})
    }
}
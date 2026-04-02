
import { NextRequest, NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { prisma } from '@/lib/prisma'

export const config = {
    api: {
        bodyParser: false,
    },
}

export async function POST(raq:NextRequest){

    try{
        const formData = await raq.formData();
        const file = formData.get('file') as File | null;
        const tags = formData.get("tags") as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 })
        }
        if (!file.name.endsWith('.pdf')) {
            return NextResponse.json({ error: 'Fichier doit être un PDF' }, { status: 400 })
        }

        // Convertit le File en Buffer
        const arrayBuffer = await file.arrayBuffer()
        const { text } = await extractText(new Uint8Array(arrayBuffer));
        const pages = text.length // chaque élément du tableau = une page
        const fullText = text.join('\n\n') // une string, pages séparées par un saut de ligne

        if (!fullText ||fullText.trim().length === 0) {
            return NextResponse.json(
                { error: 'PDF vide ou non lisible (scan ?)' },
                { status: 400 }
            )
        }

        // Nettoie le texte extrait
        const cleanContent =fullText
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 10000)

        const title = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')

        const parsedTags = tags
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : ['pdf']

        const note = await prisma.note.create({
            data: {
                title,
                content: cleanContent,
                sourceUrl: null,
                tags: parsedTags,
            },
        })

        return NextResponse.json({
            note,
            meta: {
                pages: pages,
                characters: cleanContent.length,
            },
        }, { status: 201 })


    }catch(error){
        console.log("[PDF INGEST ERROR]",error);
        return NextResponse.json({success:false, message:"Internal Server Error"},{status:500});
    }
}
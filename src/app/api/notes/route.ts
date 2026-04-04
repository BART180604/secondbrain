import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {generateEmbedding} from "@/lib/embeddings";


export async function GET(request:NextRequest){
    try {
        const {searchParams} = new URL(request.url);
        const tag = searchParams.get("tag");
        const search = searchParams.get("search")
        const notes = await prisma.note.findMany({
            where:{
                ...(tag?{tags:{has:tag}} :{}),
                ...(search?{
                    OR:[
                        {title:{contains:search, mode:"insensitive"}},
                        {content:{contains:search, mode:"insensitive"}}
                    ]
                }:{}),
            },
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json({notes})
    }catch(error){
        console.error("[GET ERROR]  ", error);
        return NextResponse.json({
            success: false, message: "Internal server error"
        },{status:500})
    }
}

export async function POST(request:NextRequest){
    try {
        const body = await request.json()
        const {title, content, tags,sourceUrl} = body

        if(!title || !content){
            return NextResponse.json({
                success: false, message: "Title and content are required"
            },{status:400})
        }
        // Génère l'embedding
        const embedding = await generateEmbedding(`${title}\n\n${content}`)
        const note = await prisma.$queryRaw`
          INSERT INTO notes (id, title, content, source_url, tags, embedding, created_at, updated_at)
          VALUES (
             gen_random_uuid()::text,
             ${title},
             ${content},
             ${sourceUrl || null},
             ${tags || []}::text[],
             ${`[${embedding.join(',')}]`}::vector,
             NOW(),
             NOW()
         )
         RETURNING id, title, content, source_url as "sourceUrl", tags, created_at as "createdAt", updated_at as "updatedAt"
       `

        return NextResponse.json({ note: (note as any[])[0] }, { status: 201 })
    }catch(error){
        console.error("[POST ERROR]  ", error);
        return NextResponse.json({success:false, message: "Internal server error"},{status:500})
    }
}
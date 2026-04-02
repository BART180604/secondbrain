import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";


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

        const note = await prisma.note.create({
            data:{
                title,
                content,
                sourceUrl : sourceUrl || null,
                tags : tags || []
            }
        })

        return NextResponse.json({
            success: true, message: "Note created", note
        },{status:201})
    }catch(error){
        console.error("[POST ERROR]  ", error);
        return NextResponse.json({success:false, message: "Internal server error"},{status:500})
    }
}
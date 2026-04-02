import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";


type Params = {params:Promise<{id:string}>}

// GET /api/notes/:id
export async function GET( request: NextRequest,{params}:Params) {
    try {
        const { id } = await params;
        const note = await prisma.note.findUnique({ where: { id } });

        if (!note) {
            return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
        }

        return NextResponse.json({ note });
    }catch(error) {
        console.log(`Exception while trying to get note: ${error}`);
        return NextResponse.json({success:false, message:"Internal Server Error"}, { status: 500 });
    }
}

// PATCH /api/notes/:id
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, content, tags, sourceUrl } = body;

        const note = await prisma.note.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(tags && { tags }),
                ...(sourceUrl !== undefined && { sourceUrl }),
            },
        });

        return NextResponse.json({ note });
    } catch (error) {
        console.log(`Exception while trying to patch note: ${error}`);
        return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
    }
}

// DELETE /api/notes/:id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.note.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.log(`Exception while trying to delete a note: ${error}`);
        return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from '@/lib/embeddings'

import Groq from 'groq-sdk'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
})

type NoteSearchResult={
    id: string
    title: string
    content: string
    score: number
}

export async function POST (req:NextRequest){
    try {
        const {message, conversationId} = await req.json();
        if (!message) {
            return NextResponse.json({ error: 'Message requis' }, { status: 400 })
        }
        // 1. Récupèrer ou créer la conversation
        let conversation
        if (conversationId) {
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { messages: { orderBy: { createdAt: 'asc' } } },
            })
        }

        conversation ??= await prisma.conversation.create({
            data: {title: message.slice(0, 50)},
            include: {messages: true},
        });

        // 2. Recherche sémantique dans les notes
        const queryEmbedding = await generateEmbedding(message)
        const vectorString = `[${queryEmbedding.join(',')}]`

        const relevantNotes = await prisma.$queryRawUnsafe<NoteSearchResult[]>(`
            SELECT id, title, content,
                1 - (embedding <=> '${vectorString}'::vector) AS score
             FROM notes
             WHERE embedding IS NOT NULL
             AND 1 - (embedding <=> '${vectorString}'::vector) > 0.4
             ORDER BY embedding <=> '${vectorString}'::vector
             LIMIT 4
          `)
        //construire le contexte RAG

        const context = relevantNotes.length >0 ? relevantNotes.map((n,i)=>`[Source ${i+1}: ${n.title}]\n${n.content.slice(0,1500)}`).join('\n\n---\n\n') : null

        //construire l'historique de conversation pour claude
        const history = conversation.messages.map(m=>({role:m.role as 'user' | "assistant", content:m.content }))

        //sauvegarder le message utilisateur
        await prisma.message.create({
            data:{
                role:'user',
                content:message,
                conversationId:conversation.id
            }
        })

        //construire le systeme prompt rag
        const systemPrompt = context ? `
        Tu es l'assistant personnel de SecondBrain. Tu as accès aux notes personnelles de l'utilisateur.

        Réponds en te basant UNIQUEMENT sur les notes fournies. Si la réponse ne se trouve pas dans les notes, dis-le clairement.

        Pour chaque information importante, cite ta source entre crochets comme ceci : [Source 1] ou [Source 2].

        Notes pertinentes trouvées : ${context}
        ` : `Tu es l'assistant personnel de SecondBrain. Aucune note pertinente n'a été trouvée pour cette question. Informe l'utilisateur et suggère-lui de capturer des notes sur ce sujet.`

        //On appelle claude avec streaming
        //appel stream anthropic
        /*const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [...history, { role: 'user', content: message }],
        })*/

        //appel stream groq
        const stream = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1024,
            stream: true,
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: message },
            ],
        })

        //La réponse au client via readableStream
        let fullResponse =""
        const readableStream = new ReadableStream({
            async start(controller){
                //streaming claudeAi
               /* for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.type=="text_delta"){
                        const text = chunk.delta.text
                        fullResponse += text
                        controller.enqueue(new TextEncoder().encode(text))
                    }
                }*/

                //Streaming groq
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || ''
                    if (text) {
                        fullResponse += text
                        controller.enqueue(new TextEncoder().encode(text))
                    }
                }
                //sauvegarder la réponse complete en db
                await prisma.message.create({
                    data: {
                        role: 'assistant',
                        content: fullResponse,
                        sources: relevantNotes.map(n => n.id),
                        conversationId: conversation.id,
                    },
                })
                // 10. Envoie l'ID de conversation à la fin du stream
                const meta = JSON.stringify({
                    conversationId : conversation.id,
                    sources : relevantNotes.map(n =>({id:n.id,title:n.title,score:n.score,}))
                })
                controller.enqueue(new TextEncoder().encode(`\n__META__${meta}__META__`))
                controller.close()
            }
        })
        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Conversation-Id': conversation.id,
            },
        })
    }catch(error){
        console.error('Chat error:', error)
        return NextResponse.json({ error: 'Erreur chat' }, { status: 500 })
    }
}

// Récupère l'historique d'une conversation
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('conversationId')

        if (!conversationId) {
            // Retourne toutes les conversations
            const conversations = await prisma.conversation.findMany({
                orderBy: { updatedAt: 'desc' },
                include: {
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            })
            return NextResponse.json({ conversations })
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        })

        return NextResponse.json({ conversation })
    } catch (error) {
        console.error("[GET CONVERSATION]",error);
        return NextResponse.json({ error: 'Erreur récupération' }, { status: 500 })
    }
}
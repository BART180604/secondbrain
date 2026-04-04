import 'dotenv/config'
import { generateEmbedding } from '../lib/embeddings'
import { prisma } from '../lib/prisma'

async function backfill() {
  const notes = await prisma.$queryRaw<{ id: string; title: string; content: string }[]>`
    SELECT id, title, content FROM notes WHERE embedding IS NULL
  `

  console.log(`${notes.length} notes à embedder...`)

  for (const note of notes) {
    try {
      // Limite le texte à 2000 caractères pour Ollama
      const text = `${note.title}\n\n${note.content}`.slice(0, 2000)
      const embedding = await generateEmbedding(text)
      const vectorString = `[${embedding.join(',')}]`

      await prisma.$queryRawUnsafe(`
        UPDATE notes 
        SET embedding = '${vectorString}'::vector
        WHERE id = '${note.id}'
      `)

      console.log(`✅ ${note.title}`)
    } catch (error) {
      console.error(`❌ ${note.title}:`, error)
    }
  }

  console.log('Backfill terminé.')
  process.exit(0)
}

backfill()

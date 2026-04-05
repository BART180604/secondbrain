// Ollama — local, gratuit
const PROVIDER = process.env.EMBEDDING_PROVIDER || 'ollama'
// Ollama supporte ~500 tokens max (~2000 caractères)
const MAX_CHARS = PROVIDER === 'ollama' ? 2000 : 8000
async function embedWithOllama(text: string): Promise<number[]> {
    const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: text,
        }),
    })

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`)
    }

    const data = await response.json()
    return data.embedding
}

// OpenAI — cloud, prod
async function embedWithOpenAI(text: string): Promise<number[]> {
    const OpenAI = (await import('openai')).default
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 768, // on force 768 pour matcher pgvector
    })

    return response.data[0].embedding
}

// Fonction principale — switche selon EMBEDDING_PROVIDER
export async function generateEmbedding(text: string): Promise<number[]> {
    // Nettoie et tronque le texte
    const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS)

    if (PROVIDER === 'openai') {
        return embedWithOpenAI(cleanText)
    }

    return embedWithOllama(cleanText)
}
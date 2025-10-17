'use server'

import { pipeline } from '@xenova/transformers'

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string') {
        console.warn('Invalid text input for embedding generation')
        return new Array(512).fill(0)
    }

    try {
        console.log('Generating embedding for text:', text.substring(0, 100) + '...')

        // Use Supabase/gte-small which is more reliable and generates 384 dimensions
        const extractor = await pipeline('feature-extraction', 'Supabase/gte-small')

        // Generate the embedding
        const result = await extractor(text, {
            pooling: 'mean',
            normalize: true,
        })

        let embedding = Array.from(result.data)
        console.log(`Generated embedding with ${embedding.length} dimensions`)

        // Pad to 512 dimensions to match database schema
        if (embedding.length < 512) {
            const padding = new Array(512 - embedding.length).fill(0)
            embedding = [...embedding, ...padding]
            console.log(`Padded embedding to ${embedding.length} dimensions`)
        } else if (embedding.length > 512) {
            embedding = embedding.slice(0, 512)
            console.log(`Truncated embedding to ${embedding.length} dimensions`)
        }

        // Verify we have meaningful values (not all zeros)
        const nonZeroCount = embedding.filter(val => val !== 0).length
        console.log(`Embedding has ${nonZeroCount} non-zero values out of ${embedding.length}`)

        if (nonZeroCount === 0) {
            console.error('Generated embedding is all zeros - this indicates an error')
        }
        return embedding as number[]
    } catch (error) {
        console.error('Error generating embedding:', error)
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
        // Return a zero vector of 512 dimensions as fallback
        return new Array(512).fill(0)
    }
}

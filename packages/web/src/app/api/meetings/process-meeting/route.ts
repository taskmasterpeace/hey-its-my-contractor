import { NextRequest, NextResponse } from 'next/server'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { db } from '@/db'
import { meetings, transcripts } from '@/db/schema/meetings'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { generateEmbedding } from '@/utils/embedding'

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 50,
})

async function processTranscriptText(transcriptText: string): Promise<string[]> {
  if (!transcriptText || typeof transcriptText !== 'string') return []
  const chunks = await textSplitter.createDocuments([transcriptText])
  return chunks
    .map((chunk: { pageContent: string }) => chunk.pageContent.trim())
    .filter((content: string) => content.length > 0)
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting meeting transcript processing...')

    const recentMeetings = await db
      .select({
        id: meetings.id,
        transcript: meetings.transcript,
        status: meetings.status,
        updatedAt: meetings.updatedAt,
      })
      .from(meetings)
      .where(
        and(
          isNotNull(meetings.transcript),
          sql`${meetings.status} != 'completed' AND ${meetings.updatedAt} < NOW() - INTERVAL '1 hour'`
        )
      )
    console.log(`Found ${recentMeetings.length} meetings to process (completed OR not completed + 1h old)`)

    if (recentMeetings.length === 0) {
      return NextResponse.json({
        message: 'No recent meetings found for processing',
        processed: 0,
      })
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as Array<{ meetingId: string; error: string }>,
    }

    for (const meeting of recentMeetings) {
      const { id: meetingId, transcript } = meeting
      try {
        if (!transcript || transcript.trim().length === 0) {
          console.log(`Meeting ${meetingId} has empty transcript — skipped`)
          results.skipped++
          continue
        }

        // Check if already processed in transcripts table
        const existing = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(transcripts)
          .where(eq(transcripts.meetingId, meetingId))

        const transcriptCount = Number(existing[0]?.count || 0)
        if (transcriptCount > 0) {
          console.log(`Meeting ${meetingId} already processed — skipped`)
          results.skipped++
          continue
        }

        // Split transcript text into chunks
        const chunks = await processTranscriptText(transcript)
        if (chunks.length === 0) {
          console.log(`Meeting ${meetingId} produced no valid chunks`)
          results.skipped++
          continue
        }

        console.log(`Meeting ${meetingId} -> ${chunks.length} chunks`)

        // Generate embeddings for each chunk
        const transcriptInserts: typeof transcripts.$inferInsert[] = []
        console.log("transcriptInserts", transcriptInserts)
        for (const chunk of chunks) {
          try {
            const embedding = await generateEmbedding(chunk)
            transcriptInserts.push({
              meetingId,
              provider: 'assemblyai',
              language: 'en',
              text: chunk,
              textEmbeddings: JSON.stringify(embedding),
              createdAt: new Date(),
            })
          } catch (embeddingError) {
            console.error(
              `Embedding generation failed for meeting ${meetingId}`,
              embeddingError
            )
          }
        }

        if (transcriptInserts.length === 0) {
          console.log(`No embeddings generated for meeting ${meetingId}`)
          results.skipped++
          continue
        }

        // Bulk insert chunks
        await db.insert(transcripts).values(transcriptInserts)
        console.log(`Inserted ${transcriptInserts.length} chunks for ${meetingId}`)

        // Update meeting status to completed
        await db
          .update(meetings)
          .set({
            status: 'completed',
            updatedAt: new Date()
          })
          .where(eq(meetings.id, meetingId))

        console.log(`Meeting ${meetingId} status updated to completed`)
        results.processed++
      } catch (error) {
        console.error(`Error processing meeting ${meeting.id}:`, error)
        results.errors.push({
          meetingId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('Meeting transcript processing complete', results)

    return NextResponse.json({
      message: 'Meeting processing completed',
      processed: results.processed,
      skipped: results.skipped,
      errors: results.errors.length,
      details: results.errors,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
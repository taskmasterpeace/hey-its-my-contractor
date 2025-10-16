import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { meetings } from '@/db/schema/meetings'
import { eq } from 'drizzle-orm'
import console from "console"

const updateMeetingSchema = z.object({
  meetingId: z.string(),
  transcriptText: z.string().optional(),
  recordingUrl: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional()
})

type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = updateMeetingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { meetingId, transcriptText, recordingUrl, status } = validationResult.data as UpdateMeetingInput

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1)

    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }


    // Build update object dynamically based on provided fields
    type MeetingUpdate = {
      transcript?: string
      recordingUrl?: string
      status?: typeof existingMeeting.status
      endsAt?: Date
      updatedAt: Date
    }

    const updateData: MeetingUpdate = {
      updatedAt: new Date(),
    }
    // here bellow updateData
    if (transcriptText !== undefined) {
      updateData.transcript = transcriptText
    }

    // Only update recording URL if provided
    if (recordingUrl !== undefined && recordingUrl.length > 0) {
      updateData.recordingUrl = recordingUrl
    }

    // Only update status if provided
    if (status) {
      updateData.status = status
      // Set endsAt when status changes to completed
      if (status === 'completed') {
        updateData.endsAt = new Date()
      }
    }

    const [updatedMeeting] = await db
      .update(meetings)
      .set(updateData)
      .where(eq(meetings.id, meetingId))
      .returning()

    return NextResponse.json(
      {
        success: true,
        meeting: {
          id: updatedMeeting.id,
          projectId: updatedMeeting.projectId,
          title: updatedMeeting.title,
          type: updatedMeeting.type,
          status: updatedMeeting.status,
          startsAt: updatedMeeting.startsAt,
          endsAt: updatedMeeting.endsAt,
          transcript: updatedMeeting.transcript,
          updatedAt: updatedMeeting.updatedAt,
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error updating meeting:', error)

    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'Duplicate entry detected' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to update meeting', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

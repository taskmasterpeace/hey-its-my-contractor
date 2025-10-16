import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { meetings } from '@/db/schema/meetings'

const createMeetingSchema = z.object({
  projectId: z
    .string()
    .refine((val) => !!val, { message: 'Invalid project ID format' }),
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(255, { message: 'Title must be 255 characters or less' }),
  meetingType: z.enum([
    'consultation',
    'progress_review',
    'change_order',
    'walkthrough',
    'inspection'
  ]).default('consultation'),
  tags: z.array(z.string()).optional().default([]),
  userId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = createMeetingSchema.safeParse(body)

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

    const { projectId, title, meetingType, tags, userId } = validationResult.data

    // Create meeting in database
    const [meeting] = await db
      .insert(meetings)
      .values({
        userId,
        projectId,
        title,
        type: meetingType,
        tags: tags,
        status: 'in_progress',
        startsAt: new Date()
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        meeting: {
          id: meeting.id,
          projectId: meeting.projectId,
          title: meeting.title,
          type: meeting.type,
          tags: meeting.tags,
          createdAt: meeting.createdAt,
          startsAt: meeting.startsAt,
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating meeting:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          { error: 'Invalid project ID - project not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create meeting', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

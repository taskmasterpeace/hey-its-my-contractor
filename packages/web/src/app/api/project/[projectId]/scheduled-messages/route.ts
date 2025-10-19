import { NextRequest, NextResponse } from "next/server";
import {
  ScheduledMessageService,
  ScheduledMessageError,
} from "@/lib/services/scheduled-message-service";
import { ScheduledMessageStatus } from "@contractor-platform/types";

/**
 * GET /api/project/[projectId]/scheduled-messages
 * Fetch all scheduled messages for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Get userId and status filter from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const status = searchParams.get("status") as
      | ScheduledMessageStatus
      | undefined;

    // Use the service to fetch scheduled messages
    const messages = await ScheduledMessageService.getScheduledMessages({
      projectId,
      userId,
      status,
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching scheduled messages:", error);

    if (error instanceof ScheduledMessageError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

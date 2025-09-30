import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  InvitationService,
  InvitationError,
} from "@/lib/services/invitation-service";
import { createClient } from "@/utils/supabase/server";

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * POST /api/invitations/accept
 * Accept an invitation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    // Validate request body
    const { token } = acceptInvitationSchema.parse(body);

    // Accept invitation
    const result = await InvitationService.acceptInvitation(token, user.id);

    return NextResponse.json({
      success: true,
      data: {
        invitation: result.invitation,
        companyMembership: result.companyMembership,
        projectMembership: result.projectMembership,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof InvitationError) {
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

/**
 * GET /api/invitations/accept?token=xxx
 * Get invitation details for preview before accepting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token is required",
        },
        { status: 400 }
      );
    }

    // Get invitation details
    const invitation = await InvitationService.getInvitationWithDetails(token);

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation not found",
        },
        { status: 404 }
      );
    }

    // Return public invitation details (no sensitive info)
    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        companyName: invitation.company.name,
        projectName: invitation.project?.name,
        invitedBy: invitation.invitedByUser.fullName,
        companyRole: invitation.companyRole,
        projectRole: invitation.projectRole,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        customMessage: invitation.customMessage,
      },
    });
  } catch (error) {
    console.error("Error getting invitation details:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  InvitationService,
  InvitationError,
} from "@/lib/services/invitation-service";
import { createClient } from "@/utils/supabase/server";

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
 * POST /api/invitations/[id]/resend
 * Resend an invitation with new token and expiry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { id: invitationId } = await params;

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation ID is required",
        },
        { status: 400 }
      );
    }

    const invitation = await InvitationService.resendInvitation(invitationId);

    return NextResponse.json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    console.error("Error resending invitation:", error);

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

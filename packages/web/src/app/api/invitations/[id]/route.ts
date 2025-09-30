import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
 * DELETE /api/invitations/[id]
 * Cancel a pending invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const invitationId = params.id;

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation ID is required",
        },
        { status: 400 }
      );
    }

    const invitation = await InvitationService.cancelInvitation(
      invitationId,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    console.error("Error cancelling invitation:", error);

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

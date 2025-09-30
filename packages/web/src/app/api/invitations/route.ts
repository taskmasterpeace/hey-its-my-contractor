import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  InvitationService,
  InvitationError,
} from "@/lib/services/invitation-service";
import { createClient } from "@/utils/supabase/server";

// Validation schemas
const createInvitationSchema = z.object({
  email: z.string().email("Invalid email format"),
  companyId: z.string().uuid("Invalid company ID"),
  companyRole: z.enum(["admin", "project_manager", "member"]),
  projectId: z.string().uuid().optional(),
  projectRole: z
    .enum(["project_manager", "contractor", "homeowner"])
    .optional(),
  customMessage: z.string().max(500).optional(),
  expiresInDays: z.number().min(1).max(30).optional(),
});

const getInvitationsSchema = z.object({
  companyId: z.string().uuid(),
  status: z
    .enum(["all", "pending", "accepted", "declined", "expired", "cancelled"])
    .optional(),
  projectId: z.string().uuid().optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
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
 * POST /api/invitations
 * Create a new invitation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    // Validate request body
    const validatedData = createInvitationSchema.parse(body);

    console.log("🔄 API: Creating invitation with data:", {
      ...validatedData,
      invitedBy: user.id,
    });

    // Create invitation
    const invitation = await InvitationService.createInvitation({
      ...validatedData,
      invitedBy: user.id,
    });

    console.log("✅ API: Invitation created successfully:", {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token.substring(0, 8) + "...",
    });

    return NextResponse.json(
      {
        success: true,
        data: invitation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invitation:", error);

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
 * GET /api/invitations
 * List invitations for a company
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryData = getInvitationsSchema.parse({
      companyId: searchParams.get("companyId"),
      status: searchParams.get("status") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    const page = queryData.page || 1;
    const limit = queryData.limit || 20;
    const offset = (page - 1) * limit;

    // Get invitations
    const result = await InvitationService.getInvitationsForCompany(
      queryData.companyId,
      {
        status: queryData.status,
        projectId: queryData.projectId,
        limit,
        offset,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        invitations: result.invitations,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.issues,
        },
        { status: 400 }
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

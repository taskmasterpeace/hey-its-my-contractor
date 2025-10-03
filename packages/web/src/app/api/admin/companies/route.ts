import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  users,
  companies,
  companySubscriptions,
  invitations,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { EmailService } from "@/lib/services/email-service";
import { isSuperAdmin } from "@/lib/auth/permissions";

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  industry: z.string().optional(),
  adminEmail: z.string().email("Invalid admin email format"),
  logoUrl: z.string().url().optional().nullable(),
  maxSeats: z.number().min(1).max(1000).default(10),
  subscriptionStatus: z
    .enum(["active", "trial", "past_due", "cancelled"])
    .default("active"),
  billingStartDate: z.string().optional(),
  billingEndDate: z.string().optional(),
  externalInvoiceId: z.string().max(255).optional(),
  monthlyRate: z.number().min(0).default(99),
  billingCycle: z.string().default("monthly"),
  notes: z.string().optional(),
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

async function validateSuperAdmin(userId: string) {
  const userData = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // 🔒 SECURITY: Use scoped permission check instead of global systemRole
  const hasAdminAccess = await isSuperAdmin(userId);

  if (!hasAdminAccess) {
    throw new Error("Super admin access required");
  }

  return userData[0];
}

/**
 * POST /api/admin/companies
 * Create a new company (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    await validateSuperAdmin(user.id);

    const body = await request.json();
    const validatedData = createCompanySchema.parse(body);

    // Check if admin user exists
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.adminEmail))
      .limit(1);

    let adminUserId: string;
    const needsInvitation = true; // Always need invitation for each company
    let existingUser = false;

    if (adminUser.length === 0) {
      // Admin user doesn't exist, we'll need to send an invitation
      adminUserId = ""; // Will be set when they accept invitation
    } else {
      existingUser = true;
      adminUserId = adminUser[0].id;
    }

    // Create company
    const [newCompany] = await db
      .insert(companies)
      .values({
        name: validatedData.name,
        industry: validatedData.industry,
        email: validatedData.adminEmail,
        logoUrl: validatedData.logoUrl,
        subscriptionStatus: validatedData.subscriptionStatus,
        createdBy: user.id,
        settings: {},
        metadata: {
          billingNotes: validatedData.notes,
          monthlyRate: validatedData.monthlyRate,
        },
      })
      .returning();

    // Create subscription record
    await db.insert(companySubscriptions).values({
      companyId: newCompany.id,
      plan: "starter",
      maxSeats: validatedData.maxSeats,
      usedSeats: 0, // Always start with 0 since we always send invitations now
      status: validatedData.subscriptionStatus,
      billingCycle: validatedData.billingCycle || "monthly",
      price: validatedData.monthlyRate?.toString(),
      startDate: validatedData.billingStartDate
        ? new Date(validatedData.billingStartDate)
        : new Date(),
      endDate: validatedData.billingEndDate
        ? new Date(validatedData.billingEndDate)
        : null,
      externalInvoiceId: validatedData.externalInvoiceId,
    });

    let invitationResult = null;

    // Always create invitation for company admin (even if user exists)
    // This ensures proper per-company invitation flow
    // Create invitation for new admin
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    console.log(
      "🔄 Admin: Creating invitation for new company admin:",
      validatedData.adminEmail
    );

    const [invitation] = await db
      .insert(invitations)
      .values({
        companyId: newCompany.id,
        email: validatedData.adminEmail,
        invitedBy: user.id,
        companyRole: "project_manager",
        token,
        expiresAt,
        customMessage: `You have been selected as the administrator for ${validatedData.name}. Please accept this invitation to get started.`,
      })
      .returning();

    invitationResult = invitation;

    // Send invitation email
    try {
      console.log(
        "📧 Admin: Sending invitation email to:",
        validatedData.adminEmail
      );

      // Get inviter info (super admin)
      const inviterInfo = await db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const emailSent = await EmailService.sendInvitationEmail({
        invitation,
        companyName: newCompany.name,
        projectName: undefined, // No project for company admin invitation
        inviterName: inviterInfo[0]?.fullName || "System Administrator",
        acceptUrl: EmailService.generateAcceptUrl(invitation.token),
      });

      console.log("📧 Admin: Email sending result:", emailSent);

      if (!emailSent) {
        console.warn(
          "❌ Admin: Failed to send invitation email to:",
          validatedData.adminEmail
        );
      } else {
        console.log(
          "✅ Admin: Invitation email sent successfully to:",
          validatedData.adminEmail
        );
      }
    } catch (emailError) {
      console.error("❌ Admin: Error sending invitation email:", emailError);
      // Don't throw error - invitation was created successfully
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          company: newCompany,
          invitation: invitationResult,
          needsInvitation,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating company:", error);

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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 }
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
 * GET /api/admin/companies
 * List all companies (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    await validateSuperAdmin(user.id);

    const companiesData = await db
      .select({
        id: companies.id,
        name: companies.name,
        industry: companies.industry,
        logoUrl: companies.logoUrl,
        subscriptionStatus: companies.subscriptionStatus,
        createdAt: companies.createdAt,
        // Get subscription info
        subscription: {
          plan: companySubscriptions.plan,
          maxSeats: companySubscriptions.maxSeats,
          usedSeats: companySubscriptions.usedSeats,
        },
      })
      .from(companies)
      .leftJoin(
        companySubscriptions,
        eq(companies.id, companySubscriptions.companyId)
      );

    return NextResponse.json({
      success: true,
      data: companiesData,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 }
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

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, companies, companySubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const updateCompanySchema = z.object({
  // Company fields
  name: z.string().min(1).max(255),
  industry: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  subscriptionStatus: z.enum(["active", "past_due", "cancelled", "trial"]),

  // Subscription fields
  plan: z.enum(["starter", "pro", "enterprise"]),
  maxSeats: z.number().min(1).max(1000),
  price: z.string().optional(),
  billingCycle: z.string().optional(),
  subscriptionStatus2: z.enum(["active", "past_due", "cancelled", "trial"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  externalInvoiceId: z.string().optional(),

  // Metadata fields
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

  if (!userData.length || userData[0].systemRole !== "super_admin") {
    throw new Error("Super admin access required");
  }

  return userData[0];
}

/**
 * PUT /api/admin/companies/[id]
 * Update company information (super admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    await validateSuperAdmin(user.id);

    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    // Await params before using
    const { id } = await params;

    // Update company record
    const [updatedCompany] = await db
      .update(companies)
      .set({
        name: validatedData.name,
        industry: validatedData.industry || null,
        address: validatedData.address || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        website: validatedData.website || null,
        stripeCustomerId: validatedData.stripeCustomerId || null,
        subscriptionStatus: validatedData.subscriptionStatus,
        metadata: {
          billingNotes: validatedData.notes,
        },
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();

    if (!updatedCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 }
      );
    }

    // Update subscription record
    const existingSubscription = await db
      .select()
      .from(companySubscriptions)
      .where(eq(companySubscriptions.companyId, id))
      .limit(1);

    if (existingSubscription.length > 0) {
      // Update existing subscription
      await db
        .update(companySubscriptions)
        .set({
          plan: validatedData.plan,
          maxSeats: validatedData.maxSeats,
          price: validatedData.price || null,
          billingCycle: validatedData.billingCycle || "monthly",
          status: validatedData.subscriptionStatus2,
          startDate: validatedData.startDate
            ? new Date(validatedData.startDate)
            : null,
          endDate: validatedData.endDate
            ? new Date(validatedData.endDate)
            : null,
          externalInvoiceId: validatedData.externalInvoiceId || null,
          updatedAt: new Date(),
        })
        .where(eq(companySubscriptions.companyId, id));
    } else {
      // Create new subscription record
      await db.insert(companySubscriptions).values({
        companyId: id,
        plan: validatedData.plan,
        maxSeats: validatedData.maxSeats,
        usedSeats: 0,
        price: validatedData.price || null,
        billingCycle: validatedData.billingCycle || "monthly",
        status: validatedData.subscriptionStatus2,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : new Date(),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        externalInvoiceId: validatedData.externalInvoiceId || null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        company: updatedCompany,
      },
    });
  } catch (error) {
    console.error("Error updating company:", error);

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
 * GET /api/admin/companies/[id]
 * Get company details (super admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    await validateSuperAdmin(user.id);

    // Await params before using
    const { id } = await params;

    const companyData = await db
      .select({
        company: companies,
        subscription: companySubscriptions,
      })
      .from(companies)
      .leftJoin(
        companySubscriptions,
        eq(companies.id, companySubscriptions.companyId)
      )
      .where(eq(companies.id, id))
      .limit(1);

    if (!companyData.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: companyData[0],
    });
  } catch (error) {
    console.error("Error fetching company:", error);

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

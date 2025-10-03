import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, companies, companyUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userProfile.length) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Fetch user's company memberships with company details
    const companyMemberships = await db
      .select({
        id: companyUsers.id,
        companyId: companyUsers.companyId,
        companyRole: companyUsers.companyRole,
        isActive: companyUsers.isActive,
        joinedAt: companyUsers.joinedAt,
        company: {
          id: companies.id,
          name: companies.name,
          industry: companies.industry,
          logoUrl: companies.logoUrl,
        },
      })
      .from(companyUsers)
      .innerJoin(companies, eq(companyUsers.companyId, companies.id))
      .where(
        and(eq(companyUsers.userId, user.id), eq(companyUsers.isActive, true))
      );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: userProfile[0].fullName || user.user_metadata?.full_name,
        profile: userProfile[0].profile || {},
        systemRole: userProfile[0].systemRole,
      },
      companies: companyMemberships,
    });
  } catch (error) {
    console.error("Error fetching user companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch user companies" },
      { status: 500 }
    );
  }
}

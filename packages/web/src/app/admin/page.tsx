import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, companies, companyUsers, invitations } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is super admin
  const userData = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const userRecord = userData[0];

  if (!userRecord || userRecord.systemRole !== "super_admin") {
    redirect("/dashboard"); // Redirect non-admins to regular dashboard
  }

  // Fetch all companies for admin dashboard
  const companiesData = await db
    .select({
      id: companies.id,
      name: companies.name,
      industry: companies.industry,
      subscriptionStatus: companies.subscriptionStatus,
      createdAt: companies.createdAt,
      createdBy: companies.createdBy,
      // Get admin info (who gets the invitation)
      adminEmail: invitations.email,
      adminInvitationStatus: invitations.status,
      // Get super admin who created the company
      createdByUser: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      },
    })
    .from(companies)
    .leftJoin(users, eq(companies.createdBy, users.id))
    .leftJoin(
      invitations,
      and(
        eq(invitations.companyId, companies.id),
        eq(invitations.companyRole, "project_manager")
      )
    )
    .orderBy(desc(companies.createdAt));

  // Get all users for PM assignment
  const availableProjectManagers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      systemRole: users.systemRole,
    })
    .from(users)
    .where(eq(users.systemRole, "project_manager"));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              System Administration
            </h1>
            <p className="text-gray-600 mt-2">
              Manage companies, project managers, and system-wide settings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SuperAdminDashboard
          companies={companiesData}
          availableProjectManagers={availableProjectManagers}
        />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserPermissions } from "@/lib/auth/permissions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's scoped permissions
  const permissions = await getUserPermissions(user.id);

  if (permissions.systemRole === "super_admin") {
    // Super admin - redirect to first company
    const firstCompany = await db
      .select({ id: companies.id })
      .from(companies)
      .limit(1);

    if (firstCompany.length > 0) {
      redirect(`/dashboard/${firstCompany[0].id}`);
    } else {
      // No companies exist yet
      redirect("/admin");
    }
  } else {
    // Regular user - redirect to first company they have access to
    const userCompany = await db
      .select({ companyId: companyUsers.companyId })
      .from(companyUsers)
      .where(
        and(eq(companyUsers.userId, user.id), eq(companyUsers.isActive, true))
      )
      .limit(1);

    if (userCompany.length > 0) {
      redirect(`/dashboard/${userCompany[0].companyId}`);
    } else {
      // User has no company access
      redirect("/account?message=no-company-access");
    }
  }
}

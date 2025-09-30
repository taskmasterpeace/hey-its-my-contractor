import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, companies, companyUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import AccountForm from "./account-form";

export default async function Account() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user data from custom schema
  const userData = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      systemRole: users.systemRole,
      profile: users.profile,
      preferences: users.preferences,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  // Fetch user's company memberships
  const userCompanies = await db
    .select({
      id: companies.id,
      name: companies.name,
      role: companyUsers.companyRole,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(eq(companyUsers.userId, user.id));

  const userRecord = userData[0];

  if (!userRecord) {
    // User exists in auth but not in custom schema - redirect to error
    redirect("/error");
  }

  // Combine user data with company information
  const userDataWithCompanies = {
    ...userRecord,
    companies: userCompanies,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Account Settings
            </h1>
            <AccountForm user={user} userData={userDataWithCompanies} />
          </div>
        </div>
      </div>
    </div>
  );
}

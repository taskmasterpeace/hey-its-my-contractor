import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
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
      role: users.role,
      tenantId: users.tenantId,
      profile: users.profile,
      tenant: {
        id: tenants.id,
        name: tenants.name,
        plan: tenants.plan,
      },
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, user.id))
    .limit(1);

  const userRecord = userData[0];

  if (!userRecord) {
    // User exists in auth but not in custom schema - redirect to error
    redirect("/error");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Account Settings
            </h1>
            <AccountForm user={user} userData={userRecord} />
          </div>
        </div>
      </div>
    </div>
  );
}

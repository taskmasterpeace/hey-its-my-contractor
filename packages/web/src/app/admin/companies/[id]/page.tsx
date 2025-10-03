import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, companies, companySubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CompanyManagement } from "@/components/admin/CompanyManagement";

interface CompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
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
    redirect("/dashboard");
  }

  // Fetch company details with subscription
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
    redirect("/admin");
  }

  const { company, subscription } = companyData[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Manage Company: {company.name}
                </h1>
                <p className="text-gray-600 mt-2">
                  Edit company details, billing information, and subscription
                  settings
                </p>
              </div>
              <a
                href="/admin"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Companies
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompanyManagement company={company} subscription={subscription} />
      </div>
    </div>
  );
}

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code"); // For OAuth flows
  const next = "/account";

  // Create redirect link without the secret tokens
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("code");

  const supabase = await createClient();
  let authData: any = null;
  let authError: any = null;

  // Handle OAuth code exchange (Google, etc.)
  if (code) {
    console.log("Processing OAuth code exchange");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    authData = data;
    authError = error;
  }
  // Handle email OTP verification
  else if (token_hash && type) {
    console.log("Processing email OTP verification");
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    authData = data;
    authError = error;
  }

  if (!authError && authData?.user) {
    console.log("Authentication successful for user:", authData.user.email);

    try {
      // Check if user record exists in custom schema
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, authData.user.id))
        .limit(1);

      if (existingUser.length === 0) {
        console.log("Creating user record for:", authData.user.email);

        // Create or get default tenant
        let defaultTenant = await db
          .select()
          .from(tenants)
          .where(eq(tenants.name, "Default"))
          .limit(1);

        if (defaultTenant.length === 0) {
          console.log("Creating default tenant");
          const [newTenant] = await db
            .insert(tenants)
            .values({
              name: "Default",
              plan: "basic",
              settings: {},
            })
            .returning();
          defaultTenant = [newTenant];
          console.log("Created tenant:", newTenant);
        }

        // Create user record in custom schema
        const [newUser] = await db
          .insert(users)
          .values({
            id: authData.user.id,
            tenantId: defaultTenant[0].id,
            role: "homeowner", // Default role, can be changed later
            email: authData.user.email,
            fullName: authData.user.user_metadata?.full_name || null,
            avatarUrl: authData.user.user_metadata?.avatar_url || null,
            profile: {},
          })
          .returning();

        console.log("Created user record:", newUser);
      } else {
        console.log("User record already exists");
      }
    } catch (dbError) {
      console.error(
        "Error creating user/tenant records during confirmation:",
        dbError
      );
      // Redirect to error page with specific message
      redirectTo.pathname = "/error";
      redirectTo.searchParams.set(
        "message",
        "Account confirmed but failed to set up profile. Please contact support."
      );
      return NextResponse.redirect(redirectTo);
    }

    redirectTo.searchParams.delete("next");
    return NextResponse.redirect(redirectTo);
  } else {
    console.error("Authentication failed:", authError);
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = "/error";
  redirectTo.searchParams.set(
    "message",
    "Authentication failed. Please try again or contact support."
  );
  return NextResponse.redirect(redirectTo);
}

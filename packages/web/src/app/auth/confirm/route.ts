import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, companies, invitations } from "@/db/schema";
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

        // Check if this is an invitation-based signup
        const invitationToken =
          authData.user.user_metadata?.invitation_token ||
          authData.user.user_metadata?.pending_invitation_token;
        let systemRole = "homeowner"; // Default

        if (invitationToken) {
          console.log(
            "🔄 Auth: Found invitation token in user metadata:",
            invitationToken.substring(0, 8) + "..."
          );

          // Get invitation details to determine proper role
          try {
            const invitation = await db
              .select()
              .from(invitations)
              .where(eq(invitations.token, invitationToken))
              .limit(1);

            if (
              invitation.length > 0 &&
              invitation[0].email === authData.user.email
            ) {
              // Set system role based on invitation
              if (
                invitation[0].companyRole === "admin" ||
                invitation[0].companyRole === "project_manager"
              ) {
                systemRole = "project_manager";
              } else if (invitation[0].projectRole === "contractor") {
                systemRole = "contractor";
              } else if (invitation[0].projectRole === "homeowner") {
                systemRole = "homeowner";
              }
              console.log(
                "🎯 Auth: Setting system role from invitation:",
                systemRole
              );
            }
          } catch (inviteError) {
            console.error(
              "Error processing invitation during signup:",
              inviteError
            );
          }
        }

        // Create user record in custom schema
        const [newUser] = await db
          .insert(users)
          .values({
            id: authData.user.id,
            systemRole: systemRole as
              | "super_admin"
              | "project_manager"
              | "contractor"
              | "homeowner",
            email: authData.user.email,
            fullName: authData.user.user_metadata?.full_name || null,
            avatarUrl: authData.user.user_metadata?.avatar_url || null,
            profile: {},
            preferences: {},
            isActive: true,
          })
          .returning();

        console.log("Created user record:", newUser);
      } else {
        console.log("User record already exists");
      }

      // Check for invitation token and process if found
      const invitationToken =
        authData.user.user_metadata?.invitation_token ||
        authData.user.user_metadata?.pending_invitation_token ||
        searchParams.get("invitation_token");

      if (invitationToken) {
        // Clear the pending invitation token from user metadata after processing
        if (authData.user.user_metadata?.pending_invitation_token) {
          try {
            // Create service role client for admin operations
            const { createClient: createServiceClient } = await import(
              "@supabase/supabase-js"
            );
            const serviceSupabase = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            await serviceSupabase.auth.admin.updateUserById(authData.user.id, {
              user_metadata: {
                ...authData.user.user_metadata,
                pending_invitation_token: null,
              },
            });
          } catch (cleanupError) {
            console.error(
              "Error cleaning up pending invitation token:",
              cleanupError
            );
          }
        }

        // Redirect to existing invitation acceptance page
        redirectTo.pathname = "/invitations/accept";
        redirectTo.searchParams.set("token", invitationToken);
        return NextResponse.redirect(redirectTo);
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

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = "/forgot-password";

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Password reset verified, redirect to a password update form
      redirectTo.pathname = "/forgot-password";
      redirectTo.searchParams.set("message", "Please enter your new password");
      redirectTo.searchParams.set("verified", "true");
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with instructions
  redirectTo.pathname = "/error";
  redirectTo.searchParams.set("message", "Invalid or expired reset link");
  return NextResponse.redirect(redirectTo);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

// Validation schema
const signupSchema = z
  .object({
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Get invitation token and redirectTo parameters
  const invitationToken = formData.get("token") as string | null;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  // Validate input
  const validationResult = signupSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errors = validationResult.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat()[0] || "Invalid input";
    const params = new URLSearchParams({ error: errorMessage });
    if (invitationToken) params.set("token", invitationToken);
    if (redirectTo !== "/") params.set("redirectTo", redirectTo);
    redirect(`/signup?${params.toString()}`);
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validationResult.data.email,
    password: validationResult.data.password,
  });

  if (authError) {
    let errorMessage = "Signup failed. Please try again.";

    if (authError.message.includes("User already registered")) {
      errorMessage =
        "An account with this email already exists. Please sign in instead.";
    } else if (authError.message.includes("Password should be")) {
      errorMessage = "Password is too weak. Please choose a stronger password.";
    } else if (authError.message.includes("Invalid email")) {
      errorMessage = "Please enter a valid email address.";
    }

    const params = new URLSearchParams({ error: errorMessage });
    if (invitationToken) params.set("token", invitationToken);
    if (redirectTo !== "/") params.set("redirectTo", redirectTo);
    redirect(`/signup?${params.toString()}`);
  }

  if (!authData.user) {
    const params = new URLSearchParams({
      error: "Signup failed unexpectedly. Please try again.",
    });
    if (invitationToken) params.set("token", invitationToken);
    if (redirectTo !== "/") params.set("redirectTo", redirectTo);
    redirect(`/signup?${params.toString()}`);
  }

  // Store invitation token for processing after email confirmation
  // This follows saas-starter pattern but adapted for Supabase email confirmation
  if (invitationToken && authData.user) {
    try {
      // Create service role client for admin operations
      const { createClient } = await import("@supabase/supabase-js");
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Store the invitation token in user metadata for processing after confirmation
      const { error: updateError } =
        await serviceSupabase.auth.admin.updateUserById(authData.user.id, {
          user_metadata: {
            pending_invitation_token: invitationToken,
          },
        });

      if (updateError) {
        console.error("Error storing pending invitation token:", updateError);
      }
    } catch (error) {
      console.error("Error storing pending invitation token:", error);
      // Continue with normal signup flow
    }
  }

  revalidatePath("/", "layout");

  // Redirect to login with confirmation message (invitation will be processed after confirmation)
  redirect(
    `/login?message=${encodeURIComponent(
      "Please check your email and click the confirmation link to complete your signup."
    )}`
  );
}

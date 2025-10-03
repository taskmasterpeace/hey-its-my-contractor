"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

// Validation schema
const resetPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
});

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
  };

  // Validate input
  const validationResult = resetPasswordSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errors = validationResult.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat()[0] || "Invalid input";
    redirect(`/forgot-password?error=${encodeURIComponent(errorMessage)}`);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    validationResult.data.email,
    {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/reset-password`,
    }
  );

  if (error) {
    console.error("Password reset error:", error);
    let errorMessage = `Failed to send reset email: ${error.message}`;

    if (error.message.includes("Invalid email")) {
      errorMessage = "Please enter a valid email address.";
    } else if (error.message.includes("Too many requests")) {
      errorMessage =
        "Too many requests. Please wait a few minutes before trying again.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage =
        "This email address is not confirmed. Please sign up first.";
    } else if (error.message.includes("User not found")) {
      errorMessage = "No account found with this email address.";
    }

    redirect(`/forgot-password?error=${encodeURIComponent(errorMessage)}`);
  }

  // Success - redirect with success message
  redirect(
    `/forgot-password?message=${encodeURIComponent(
      "Check your email for a password reset link!"
    )}`
  );
}

// Update password action (for when user returns from email link)
export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate passwords match
  if (rawData.password !== rawData.confirmPassword) {
    redirect(
      `/forgot-password?verified=true&error=${encodeURIComponent(
        "Passwords do not match"
      )}`
    );
  }

  if (rawData.password.length < 6) {
    redirect(
      `/forgot-password?verified=true&error=${encodeURIComponent(
        "Password must be at least 6 characters"
      )}`
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: rawData.password,
  });

  if (error) {
    console.error("Password update error:", error);
    redirect(
      `/forgot-password?verified=true&error=${encodeURIComponent(
        "Failed to update password. Please try again."
      )}`
    );
  }

  // Success - redirect to login
  redirect(
    `/login?message=${encodeURIComponent(
      "Password updated successfully! Please sign in with your new password."
    )}`
  );
}

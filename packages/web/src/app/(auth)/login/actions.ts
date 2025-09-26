"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .min(1, "Password is required"),
});

export async function login(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Get redirectTo parameter to redirect after successful login
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  // Validate input
  const validationResult = loginSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errors = validationResult.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat()[0] || "Invalid input";
    const params = new URLSearchParams({ error: errorMessage });
    if (redirectTo !== "/") {
      params.set("redirectTo", redirectTo);
    }
    redirect(`/login?${params.toString()}`);
  }

  const { data, error } = await supabase.auth.signInWithPassword(
    validationResult.data
  );

  if (error) {
    let errorMessage = "Login failed. Please check your credentials.";

    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage =
        "Please check your email and click the confirmation link before signing in.";
    } else if (error.message.includes("Too many requests")) {
      errorMessage =
        "Too many login attempts. Please wait a few minutes before trying again.";
    }

    const params = new URLSearchParams({ error: errorMessage });
    if (redirectTo !== "/") {
      params.set("redirectTo", redirectTo);
    }
    redirect(`/login?${params.toString()}`);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

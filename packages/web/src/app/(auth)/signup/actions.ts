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

  // Validate input
  const validationResult = signupSchema.safeParse(rawData);
  if (!validationResult.success) {
    const errors = validationResult.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat()[0] || "Invalid input";
    redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
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

    redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
  }

  if (!authData.user) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Signup failed unexpectedly. Please try again."
      )}`
    );
  }

  revalidatePath("/", "layout");

  // Always redirect to login with confirmation message since email confirmation is required
  redirect(
    `/login?message=${encodeURIComponent(
      "Please check your email and click the confirmation link to complete your signup."
    )}`
  );
}

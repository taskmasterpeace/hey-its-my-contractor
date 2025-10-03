"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      // Get invitation token and redirectTo from URL
      const token = searchParams.get("token");
      const redirectTo = searchParams.get("redirectTo");

      // Build redirect URL with token preserved in URL (simple & reliable)
      const confirmUrl = new URL("/auth/confirm", window.location.origin);
      if (token) {
        confirmUrl.searchParams.set("invitation_token", token);
      }
      if (redirectTo) {
        confirmUrl.searchParams.set("redirectTo", redirectTo);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: confirmUrl.toString(),
        },
      });

      if (error) {
        console.error("Google sign-in error:", error);
        const params = new URLSearchParams({
          error: "Failed to sign in with Google. Please try again.",
        });
        if (token) params.set("token", token);
        if (redirectTo) params.set("redirectTo", redirectTo);
        router.push(`/login?${params.toString()}`);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      const token = searchParams.get("token");
      const redirectTo = searchParams.get("redirectTo");
      const params = new URLSearchParams({
        error: "Failed to sign in with Google. Please try again.",
      });
      if (token) params.set("token", token);
      if (redirectTo) params.set("redirectTo", redirectTo);
      router.push(`/login?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {isLoading ? "Signing in..." : "Continue with Google"}
    </button>
  );
}

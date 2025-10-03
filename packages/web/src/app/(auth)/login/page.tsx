import { Suspense } from "react";
import { login } from "./actions";
import Link from "next/link";
import GoogleSignInButton from "./google-signin";

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    error?: string;
    redirectTo?: string;
    token?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams.message;
  const error = resolvedSearchParams.error;
  const redirectTo = resolvedSearchParams.redirectTo || "/";
  const token = resolvedSearchParams.token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href={`/signup${token ? `?token=${token}` : ""}${
                redirectTo !== "/"
                  ? `${token ? "&" : "?"}redirectTo=${encodeURIComponent(
                      redirectTo
                    )}`
                  : ""
              }`}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {message && (
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Information
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>{message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-3 flex space-x-3">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Try Again
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Forgot Password
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <GoogleSignInButton />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-6" action={login}>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input type="hidden" name="token" value={token || ""} />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    error?: string;
    redirectTo?: string;
    token?: string;
  }>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

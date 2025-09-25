import { Suspense } from "react";
import { resetPassword, updatePassword } from "./actions";
import Link from "next/link";

async function ForgotPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    verified?: string;
    error?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams.message;
  const verified = resolvedSearchParams.verified === "true";
  const error = resolvedSearchParams.error;

  // If verified, show password update form
  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Set New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your new password below
            </p>
          </div>

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
                      href="/forgot-password"
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Try Again
                    </Link>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" action={updatePassword}>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Enter your new password"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Confirm your new password"
              />
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Default: show email input form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
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
                    href="/forgot-password"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Try Again
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" action={resetPassword}>
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
              placeholder="Enter your email address"
            />
            <p className="mt-1 text-xs text-gray-500">
              We'll send you a link to reset your password
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    verified?: string;
    error?: string;
  }>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

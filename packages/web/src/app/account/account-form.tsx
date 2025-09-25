"use client";

import { useState } from "react";
import { type User } from "@supabase/supabase-js";

interface UserData {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: "contractor" | "staff" | "sub" | "homeowner" | "admin";
  tenantId: string;
  profile: any;
  tenant: {
    id: string;
    name: string;
    plan: "basic" | "pro" | "enterprise" | null;
  } | null;
}

export default function AccountForm({
  user,
  userData,
}: {
  user: User | null;
  userData: UserData;
}) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(userData.fullName || "");

  async function updateProfile(formData: FormData) {
    try {
      setLoading(true);

      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.get("fullName") as string,
          profile: {
            ...userData.profile,
            website: formData.get("website") as string,
            bio: formData.get("bio") as string,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="text"
          value={user?.email || ""}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            Role
          </label>
          <input
            id="role"
            type="text"
            value={userData.role}
            disabled
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 capitalize"
          />
        </div>
        <div>
          <label
            htmlFor="tenant"
            className="block text-sm font-medium text-gray-700"
          >
            Organization
          </label>
          <input
            id="tenant"
            type="text"
            value={userData.tenant?.name || "No Organization"}
            disabled
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
          />
        </div>
      </div>

      <form action={updateProfile} className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700"
          >
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            defaultValue={userData.profile?.website || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={userData.profile?.bio || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>

        <div>
          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Loading ..." : "Update Profile"}
          </button>
        </div>
      </form>

      {/* Sign out form - separate from update form to avoid nesting */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <form action="/auth/signout" method="post">
          <button
            className="flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

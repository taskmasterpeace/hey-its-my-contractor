import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Hey, It's My Contractor",
  description: "Sign in to your contractor management platform",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}

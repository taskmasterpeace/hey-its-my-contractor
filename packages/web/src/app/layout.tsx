import type { Metadata } from "next";
import "./globals.css";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Hey, It's My Contractor",
  description:
    "AI-powered contractor management platform with AAD generation system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

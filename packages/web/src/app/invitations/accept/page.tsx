import { Suspense } from "react";
import { AcceptInvitationPage } from "@/components/invitations/AcceptInvitationPage";

interface AcceptPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptPage({ searchParams }: AcceptPageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid Invitation Link
          </h1>
          <p className="text-gray-600">
            This invitation link is missing required parameters. Please use the
            complete link from your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AcceptInvitationPage token={token} />
    </Suspense>
  );
}

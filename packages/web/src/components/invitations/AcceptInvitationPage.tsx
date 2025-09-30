"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface InvitationDetails {
  email: string;
  companyName: string;
  projectName?: string;
  invitedBy: string;
  companyRole: "admin" | "project_manager" | "member";
  projectRole?: "project_manager" | "contractor" | "homeowner";
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  expiresAt: string;
  customMessage?: string;
}

interface AcceptInvitationPageProps {
  token: string;
}

type FlowState =
  | "loading"
  | "login_required"
  | "signup_required"
  | "ready_to_accept"
  | "email_mismatch"
  | "invalid";

export function AcceptInvitationPage({ token }: AcceptInvitationPageProps) {
  const searchParams = useSearchParams();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
  });

  const supabase = createClient();

  useEffect(() => {
    checkAuthAndLoadInvitation();
  }, [token]);

  // Auto-accept invitation when user is ready
  useEffect(() => {
    if (flowState === "ready_to_accept") {
      acceptInvitation();
    }
  }, [flowState]);

  const checkAuthAndLoadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Load invitation details
      const response = await fetch(`/api/invitations/accept?token=${token}`);
      const result = await response.json();

      if (!result.success) {
        setFlowState("invalid");
        setError(result.error || "Invitation not found");
        return;
      }

      const invitationData = result.data;
      setInvitation(invitationData);

      // Check if invitation is valid
      if (
        invitationData.status !== "pending" ||
        new Date() > new Date(invitationData.expiresAt)
      ) {
        setFlowState("invalid");
        setError(
          invitationData.status === "expired"
            ? "Invitation has expired"
            : "Invitation is no longer valid"
        );
        return;
      }

      // Determine flow state based on authentication
      if (!user) {
        // Simple URL preservation - redirect to login with token in URL
        const currentUrl = window.location.href;
        window.location.href = `/login?redirectTo=${encodeURIComponent(
          currentUrl
        )}`;
        return;
      } else if (user.email !== invitationData.email) {
        // User logged in with wrong email
        setFlowState("email_mismatch");
      } else {
        // User logged in with correct email - ready to accept
        setFlowState("ready_to_accept");
      }
    } catch (err) {
      console.error("Error loading invitation:", err);
      setError("Failed to load invitation details");
      setFlowState("invalid");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError(null);

      if (signupData.password !== signupData.confirmPassword) {
        setError("Passwords don't match");
        return;
      }

      if (signupData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      // Sign up with Supabase
      const { data, error: signupError } = await supabase.auth.signUp({
        email: invitation!.email, // Use invitation email (locked)
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data.user) {
        // Account created, now accept invitation
        await acceptInvitation(data.user);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    // Simple redirect to login with invitation token
    const params = new URLSearchParams({
      token,
      redirectTo: window.location.href,
    });
    window.location.href = `/login?${params.toString()}`;
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.href, // Simple redirect back to current URL
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("Google sign in error:", err);
      setError("Failed to sign in with Google");
      setLoading(false);
    }
  };

  const acceptInvitation = async (user?: any) => {
    try {
      setAccepting(true);
      setError(null);

      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to dashboard after successful acceptance
        window.location.href = "/dashboard";
      } else {
        setError(result.error || "Failed to accept invitation");
      }
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const getRoleDisplayName = (companyRole: string, projectRole?: string) => {
    const roleNames = {
      admin: "Administrator",
      project_manager: "Project Manager",
      member: "Team Member",
      contractor: "Contractor",
      homeowner: "Homeowner",
    };

    if (projectRole) {
      return `${roleNames[companyRole as keyof typeof roleNames]} (${
        roleNames[projectRole as keyof typeof roleNames]
      })`;
    }
    return roleNames[companyRole as keyof typeof roleNames];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (flowState === "invalid" || error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invitation Invalid</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              {error || "This invitation link is invalid or has expired."}
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flowState === "email_mismatch") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-yellow-600">Wrong Account</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              This invitation was sent to <strong>{invitation.email}</strong>,
              but you're logged in as <strong>{currentUser?.email}</strong>.
            </p>
            <p className="text-gray-600">
              Please log in with the correct account to accept this invitation.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  const params = new URLSearchParams({
                    token,
                    redirectTo: window.location.href,
                  });
                  window.location.href = `/login?${params.toString()}`;
                }}
                className="w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Log in with {invitation.email}
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flowState === "signup_required") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to {invitation.companyName}!
            </h1>
            <p className="text-gray-600">
              Create your account to join the team
            </p>
          </div>

          {/* Invitation Summary */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">You've been invited as:</p>
                <Badge variant="secondary" className="text-sm">
                  {getRoleDisplayName(
                    invitation.companyRole,
                    invitation.projectRole
                  )}
                </Badge>
                {invitation.projectName && (
                  <p className="text-sm text-gray-600">
                    Project: <strong>{invitation.projectName}</strong>
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  By: <strong>{invitation.invitedBy}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signup Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Create Your Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              {/* Manual Signup Form */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="inviteEmail">Email (from invitation)</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={invitation.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={signupData.fullName}
                    onChange={(e) =>
                      setSignupData({ ...signupData, fullName: e.target.value })
                    }
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Repeat password"
                  />
                </div>

                <Button
                  onClick={handleSignup}
                  disabled={
                    loading || !signupData.fullName || !signupData.password
                  }
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account & Accept Invitation
                </Button>
              </div>

              {/* Existing User Link */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Already have an account?
                </p>
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  className="text-blue-600"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign in instead
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Message */}
          {invitation.customMessage && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-900 text-sm font-medium">
                    Message from {invitation.invitedBy}:
                  </p>
                  <p className="text-blue-800 text-sm mt-1">
                    {invitation.customMessage}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Ready to accept or accepting state
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to {invitation.companyName}!
          </h1>
          <p className="text-xl text-gray-600">You're ready to join the team</p>
        </div>

        {/* Invitation Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Invitation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Your Role
                </Label>
                <Badge variant="secondary" className="mt-1">
                  {getRoleDisplayName(
                    invitation.companyRole,
                    invitation.projectRole
                  )}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Invited By
                </Label>
                <p className="text-sm text-gray-900">{invitation.invitedBy}</p>
              </div>
              {invitation.projectName && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Project
                  </Label>
                  <p className="text-sm text-gray-900">
                    {invitation.projectName}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Email
                </Label>
                <p className="text-sm text-gray-900">{invitation.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {accepting ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Accepting invitation...</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => acceptInvitation()}
              size="lg"
              className="text-lg px-8 py-3"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              size="lg"
              className="text-lg px-8 py-3"
            >
              Decline
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

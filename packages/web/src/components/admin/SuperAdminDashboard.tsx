"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import {
  Plus,
  Building2,
  Users,
  Crown,
  Settings,
  Mail,
  Upload,
  X,
  Image,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry: string | null;
  logoUrl: string | null;
  subscriptionStatus: "active" | "past_due" | "cancelled" | "trial" | null;
  createdAt: Date;
  createdBy: string | null;
  adminEmail: string | null;
  adminInvitationStatus:
    | "pending"
    | "accepted"
    | "declined"
    | "expired"
    | "cancelled"
    | null;
  adminInvitationId: string | null;
  createdByUser: {
    id: string | null;
    fullName: string | null;
    email: string | null;
  } | null;
}

interface ProjectManager {
  id: string;
  fullName: string | null;
  email: string | null;
  systemRole: string;
}

interface SuperAdminDashboardProps {
  companies: Company[];
  availableProjectManagers: ProjectManager[];
}

interface CreateCompanyFormData {
  name: string;
  industry: string;
  adminEmail: string;
  maxSeats: number;
  subscriptionStatus: "active" | "trial" | "past_due" | "cancelled";
  billingStartDate?: string;
  billingEndDate?: string;
  externalInvoiceId?: string;
  monthlyRate?: number;
  billingCycle?: string;
  notes?: string;
  logoFile?: File | null;
}

export function SuperAdminDashboard({
  companies,
  availableProjectManagers,
}: SuperAdminDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState<CreateCompanyFormData>({
    name: "",
    industry: "",
    adminEmail: "",
    maxSeats: 10,
    subscriptionStatus: "active",
    billingStartDate: new Date().toISOString().split("T")[0], // Today's date
    billingEndDate: "",
    externalInvoiceId: "",
    monthlyRate: 1000,
    billingCycle: "monthly",
    notes: "",
    logoFile: null,
  });

  // Calculate billing end date when billing cycle or start date changes
  useEffect(() => {
    if (
      formData.billingStartDate &&
      formData.billingCycle &&
      formData.billingCycle !== "custom"
    ) {
      const startDate = new Date(formData.billingStartDate);
      const endDate = new Date(startDate);

      switch (formData.billingCycle) {
        case "monthly":
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case "quarterly":
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case "semi-annual":
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case "yearly":
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
      }

      // Format date to YYYY-MM-DD for input
      const formattedEndDate = endDate.toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        billingEndDate: formattedEndDate,
      }));
    }
  }, [formData.billingStartDate, formData.billingCycle]);

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingLogo(true);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `company-logos/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("company-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading logo:", error);
        toast({
          title: "Failed to upload logo",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("company-assets").getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Failed to upload logo",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, logoFile: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoFile: null });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateCompany = async () => {
    try {
      setLoading(true);

      let logoUrl = null;

      // Upload logo if provided
      if (formData.logoFile) {
        logoUrl = await handleLogoUpload(formData.logoFile);
        if (!logoUrl) {
          return; // Logo upload failed, error already shown
        }
      }

      // Prepare form data for submission
      const submissionData = {
        ...formData,
        logoUrl,
        logoFile: undefined, // Remove file from submission
      };

      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Company created successfully!",
          description: `${formData.name} has been created and invitation sent to ${formData.adminEmail}`,
          variant: "default",
        });
        setFormData({
          name: "",
          industry: "",
          adminEmail: "",
          maxSeats: 10,
          subscriptionStatus: "active",
          billingStartDate: new Date().toISOString().split("T")[0],
          billingEndDate: "",
          externalInvoiceId: "",
          monthlyRate: 1000,
          notes: "",
          logoFile: null,
        });
        setLogoPreview(null);
        setShowCreateForm(false);
        window.location.reload(); // Refresh to show new company
      } else {
        toast({
          title: "Failed to create company",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        title: "Failed to create company",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (
    invitationId: string,
    companyName: string
  ) => {
    try {
      setResendingInvitation(invitationId);

      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invitation resent successfully!",
          description: `New invitation sent for ${companyName}`,
          variant: "default",
        });
        window.location.reload(); // Refresh to show updated status
      } else {
        toast({
          title: "Failed to resend invitation",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Failed to resend invitation",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setResendingInvitation(null);
    }
  };

  const getStatusBadge = (
    subscriptionStatus: string | null,
    invitationStatus: string | null
  ) => {
    const variants = {
      // Subscription statuses
      active: "bg-green-100 text-green-800",
      trial: "bg-blue-100 text-blue-800",
      past_due: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      // Invitation statuses
      pending: "bg-orange-100 text-orange-800",
      declined: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };

    // If invitation is not accepted, show invitation status
    if (invitationStatus && invitationStatus !== "accepted") {
      const displayStatus = invitationStatus;
      return (
        <Badge
          className={
            variants[displayStatus as keyof typeof variants] ||
            "bg-gray-100 text-gray-800"
          }
        >
          {displayStatus === "pending"
            ? "Invitation Pending"
            : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
        </Badge>
      );
    }

    // If invitation is accepted or null, show subscription status
    const displayStatus = subscriptionStatus || "trial";
    return (
      <Badge
        className={
          variants[displayStatus as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Company Button */}
      <div className="flex justify-end items-center">
        <Button onClick={() => setShowCreateForm(true)} disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Create Company
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {companies.length}
                </p>
                <p className="text-sm text-gray-600">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {availableProjectManagers.length}
                </p>
                <p className="text-sm text-gray-600">Project Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {
                    companies.filter((c) => c.subscriptionStatus === "active")
                      .length
                  }
                </p>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Company Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="ABC Construction LLC"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="Construction, Electrical, Plumbing, etc."
              />
            </div>

            {/* Logo Upload Section */}
            <div>
              <Label>Company Logo</Label>
              <div className="mt-2">
                {logoPreview ? (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-contain border border-gray-300 rounded-lg bg-white p-2"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {formData.logoFile?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.logoFile?.size
                          ? `${Math.round(formData.logoFile.size / 1024)}KB`
                          : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? "Uploading..." : "Upload Logo"}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="adminEmail">Administrator Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) =>
                  setFormData({ ...formData, adminEmail: e.target.value })
                }
                placeholder="admin@company.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                This person will be invited as the company administrator
              </p>
            </div>

            <div>
              <Label htmlFor="maxSeats">Maximum Seats</Label>
              <Input
                id="maxSeats"
                type="number"
                value={formData.maxSeats}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxSeats: parseInt(e.target.value) || 10,
                  })
                }
                min="1"
                max="1000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of licenses for this company
              </p>
            </div>

            {/* Billing Information Section */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Billing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subscriptionStatus">
                    Subscription Status
                  </Label>
                  <select
                    id="subscriptionStatus"
                    value={formData.subscriptionStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscriptionStatus: e.target.value as any,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active (Paid)</option>
                    <option value="trial">Trial Period</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <select
                    id="billingCycle"
                    value={formData.billingCycle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingCycle: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (3 months)</option>
                    <option value="semi-annual">Semi-Annual (6 months)</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="monthlyRate">
                    {formData.billingCycle === "monthly"
                      ? "Monthly"
                      : formData.billingCycle === "quarterly"
                      ? "Quarterly"
                      : formData.billingCycle === "semi-annual"
                      ? "Semi-Annual"
                      : formData.billingCycle === "yearly"
                      ? "Yearly"
                      : "Custom"}{" "}
                    Rate ($)
                  </Label>
                  <Input
                    id="monthlyRate"
                    type="number"
                    value={formData.monthlyRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyRate: parseInt(e.target.value) || 1000,
                      })
                    }
                    min="0"
                    step="1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.billingCycle === "monthly"
                      ? "Charged every month"
                      : formData.billingCycle === "quarterly"
                      ? "Charged every 3 months"
                      : formData.billingCycle === "semi-annual"
                      ? "Charged every 6 months"
                      : formData.billingCycle === "yearly"
                      ? "Charged annually"
                      : "Custom billing period"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="billingStartDate">Billing Start Date</Label>
                  <Input
                    id="billingStartDate"
                    type="date"
                    value={formData.billingStartDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingStartDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="billingEndDate">
                    Billing End Date (Optional)
                  </Label>
                  <Input
                    id="billingEndDate"
                    type="date"
                    value={formData.billingEndDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingEndDate: e.target.value,
                      })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for ongoing subscription
                  </p>
                </div>

                <div>
                  <Label htmlFor="externalInvoiceId">
                    External Invoice ID (Optional)
                  </Label>
                  <Input
                    id="externalInvoiceId"
                    value={formData.externalInvoiceId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        externalInvoiceId: e.target.value,
                      })
                    }
                    placeholder="INV-001234"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Reference from your billing system
                  </p>
                </div>

                <div>
                  <Label htmlFor="notes">Billing Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Custom billing arrangements, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCompany}
                disabled={loading || !formData.name || !formData.adminEmail}
              >
                Create Company & Send Invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No companies created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={`${company.name} logo`}
                          className="w-12 h-12 object-contain border border-gray-200 rounded-lg bg-white p-1"
                          onError={(e) => {
                            // Fallback to Building2 icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallbackIcon =
                              target.nextElementSibling as HTMLElement;
                            if (fallbackIcon)
                              fallbackIcon.style.display = "block";
                          }}
                        />
                      ) : null}
                      <Building2
                        className={`w-8 h-8 text-blue-600 ${
                          company.logoUrl ? "hidden" : "block"
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {company.industry || "No industry specified"}
                        </p>
                        {company.adminEmail && (
                          <p className="text-xs text-gray-500">
                            Admin: {company.adminEmail}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Created:{" "}
                          {new Date(company.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(
                      company.subscriptionStatus,
                      company.adminInvitationStatus
                    )}
                    {/* Show resend button if invitation is not accepted */}
                    {company.adminInvitationStatus &&
                      company.adminInvitationStatus !== "accepted" &&
                      company.adminInvitationId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResendInvitation(
                              company.adminInvitationId!,
                              company.name
                            )
                          }
                          disabled={
                            resendingInvitation === company.adminInvitationId
                          }
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {resendingInvitation === company.adminInvitationId
                            ? "Sending..."
                            : "Resend"}
                        </Button>
                      )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        (window.location.href = `/admin/companies/${company.id}`)
                      }
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Project Managers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Project Managers</CardTitle>
        </CardHeader>
        <CardContent>
          {availableProjectManagers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No project managers in the system</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableProjectManagers.map((pm) => (
                <div key={pm.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {pm.fullName || "Unnamed"}
                      </p>
                      <p className="text-sm text-gray-600">{pm.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

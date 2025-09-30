"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Building2,
  CreditCard,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: "active" | "past_due" | "cancelled" | "trial" | null;
  settings: any;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface Subscription {
  id: string;
  plan: "starter" | "pro" | "enterprise";
  maxSeats: number;
  usedSeats: number | null;
  price: string | null;
  billingCycle: string | null;
  status: "active" | "past_due" | "cancelled" | "trial" | null;
  startDate: Date | null;
  endDate: Date | null;
  externalInvoiceId: string | null;
}

interface CompanyManagementProps {
  company: Company;
  subscription: Subscription | null;
}

interface FormData {
  // Company fields
  name: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  stripeCustomerId: string;
  subscriptionStatus: "active" | "past_due" | "cancelled" | "trial";

  // Subscription fields
  plan: "starter" | "pro" | "enterprise";
  maxSeats: number;
  price: string;
  billingCycle: string;
  subscriptionStatus2: "active" | "past_due" | "cancelled" | "trial";
  startDate: string;
  endDate: string;
  externalInvoiceId: string;

  // Metadata fields
  notes: string;
}

export function CompanyManagement({
  company,
  subscription,
}: CompanyManagementProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Company fields
    name: company.name || "",
    industry: company.industry || "",
    address: company.address || "",
    phone: company.phone || "",
    email: company.email || "",
    website: company.website || "",
    stripeCustomerId: company.stripeCustomerId || "",
    subscriptionStatus: company.subscriptionStatus || "active",

    // Subscription fields
    plan: subscription?.plan || "starter",
    maxSeats: subscription?.maxSeats || 10,
    price: subscription?.price || "",
    billingCycle: subscription?.billingCycle || "monthly",
    subscriptionStatus2: subscription?.status || "active",
    startDate: subscription?.startDate
      ? new Date(subscription.startDate).toISOString().split("T")[0]
      : "",
    endDate: subscription?.endDate
      ? new Date(subscription.endDate).toISOString().split("T")[0]
      : "",
    externalInvoiceId: subscription?.externalInvoiceId || "",

    // Metadata fields
    notes: company.metadata?.billingNotes || "",
  });

  const handleSave = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert("Company updated successfully!");
        window.location.reload();
      } else {
        alert(result.error || "Failed to update company");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      alert("Failed to update company");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      trial: "bg-blue-100 text-blue-800",
      past_due: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={
          variants[status as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Company Details</h2>
          <p className="text-gray-600">
            Manage all company information and subscription settings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(company.subscriptionStatus || "trial")}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
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

            <div>
              <Label htmlFor="email">Company Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Company Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://company.com"
              />
            </div>

            <div>
              <Label htmlFor="subscriptionStatus">Company Status</Label>
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
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Company Address</Label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="123 Main St, City, State, ZIP Code"
                className="w-full p-2 border rounded-md h-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription & Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan">Subscription Plan</Label>
              <select
                id="plan"
                value={formData.plan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    plan: e.target.value as any,
                  })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <Label htmlFor="subscriptionStatus2">Subscription Status</Label>
              <select
                id="subscriptionStatus2"
                value={formData.subscriptionStatus2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscriptionStatus2: e.target.value as any,
                  })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
            </div>

            <div>
              <Label htmlFor="billingCycle">Billing Cycle</Label>
              <select
                id="billingCycle"
                value={formData.billingCycle}
                onChange={(e) =>
                  setFormData({ ...formData, billingCycle: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (3 months)</option>
                <option value="semi-annual">Semi-Annual (6 months)</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
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
              <Label htmlFor="price">
                {formData.billingCycle === "monthly"
                  ? "Monthly"
                  : formData.billingCycle === "quarterly"
                  ? "Quarterly"
                  : formData.billingCycle === "semi-annual"
                  ? "Semi-Annual"
                  : formData.billingCycle === "yearly"
                  ? "Yearly"
                  : "Custom"}{" "}
                Price ($)
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="99.00"
                step="0.01"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.billingCycle === "monthly"
                  ? "Amount charged monthly"
                  : formData.billingCycle === "quarterly"
                  ? "Amount charged every 3 months"
                  : formData.billingCycle === "semi-annual"
                  ? "Amount charged every 6 months"
                  : formData.billingCycle === "yearly"
                  ? "Amount charged annually"
                  : "Custom billing amount"}
              </p>
            </div>

            <div>
              <Label htmlFor="stripeCustomerId">Stripe Customer ID</Label>
              <Input
                id="stripeCustomerId"
                value={formData.stripeCustomerId}
                onChange={(e) =>
                  setFormData({ ...formData, stripeCustomerId: e.target.value })
                }
                placeholder="cus_..."
              />
            </div>

            <div>
              <Label htmlFor="startDate">Billing Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="endDate">Billing End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="externalInvoiceId">External Invoice ID</Label>
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
            </div>

            <div>
              <Label htmlFor="notes">Billing Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Custom arrangements, etc."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {subscription?.usedSeats || 0}
              </p>
              <p className="text-sm text-gray-600">Used Seats</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formData.maxSeats}
              </p>
              <p className="text-sm text-gray-600">Max Seats</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.max(
                  0,
                  formData.maxSeats - (subscription?.usedSeats || 0)
                )}
              </p>
              <p className="text-sm text-gray-600">Available Seats</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {new Date(company.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">Created Date</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

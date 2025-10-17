import { SelectInvitation } from "@/db/schema";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface InvitationEmailData {
  invitation: SelectInvitation;
  companyName: string;
  projectName?: string;
  inviterName: string;
  acceptUrl: string;
}

export class EmailService {
  private static readonly MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  private static readonly MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
  private static readonly FROM_EMAIL =
    process.env.MAILGUN_FROM_EMAIL || "noreply@heyyourehired.com";
  private static readonly BASE_URL = process.env.BASE_URL;

  /**
   * Send invitation email using Mailgun
   */
  static async sendInvitationEmail(
    emailData: InvitationEmailData
  ): Promise<boolean> {
    console.log("🔍 Email service configuration check:", {
      hasApiKey: !!this.MAILGUN_API_KEY,
      domain: this.MAILGUN_DOMAIN,
      fromEmail: this.FROM_EMAIL,
      apiKeyLength: this.MAILGUN_API_KEY?.length,
    });

    if (!this.MAILGUN_API_KEY || !this.MAILGUN_DOMAIN) {
      console.warn(
        "❌ Mailgun not configured properly. Email would be sent to:",
        emailData.invitation.email
      );
      console.warn("Missing:", {
        apiKey: !this.MAILGUN_API_KEY,
        domain: !this.MAILGUN_DOMAIN,
      });
      return false; // Return false to indicate email wasn't sent
    }

    try {
      const template = this.generateInvitationTemplate(emailData);

      const formData = new FormData();
      formData.append("from", this.FROM_EMAIL);
      formData.append("to", emailData.invitation.email);
      formData.append("subject", template.subject);
      formData.append("html", template.html);
      formData.append("text", template.text);

      const response = await fetch(
        `https://api.mailgun.net/v3/${this.MAILGUN_DOMAIN}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.MAILGUN_API_KEY}`
            ).toString("base64")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Mailgun error:", errorData);
        return false;
      }

      console.log(
        "Invitation email sent successfully to:",
        emailData.invitation.email
      );
      return true;
    } catch (error) {
      console.error("Error sending invitation email:", error);
      return false;
    }
  }

  /**
   * Generate invitation email template
   */
  private static generateInvitationTemplate(
    emailData: InvitationEmailData
  ): EmailTemplate {
    const { invitation, companyName, projectName, inviterName, acceptUrl } =
      emailData;

    const roleDisplay = invitation.projectRole
      ? `${invitation.companyRole} (${invitation.projectRole})`
      : invitation.companyRole;

    const subject = `Invitation to join ${companyName}${
      projectName ? ` - ${projectName}` : ""
    }`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to Join ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">You're Invited!</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Join ${companyName} and start collaborating</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Hi there,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 25px 0;">
                <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${roleDisplay}</strong>.
                ${
                  projectName
                    ? ` You'll be working on the <strong>${projectName}</strong> project.`
                    : ""
                }
            </p>

            ${
              invitation.customMessage
                ? `
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #1e40af; font-style: italic;">"${invitation.customMessage}"</p>
            </div>
            `
                : ""
            }

            <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px;">What you'll have access to:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                    <li style="margin: 8px 0;">Company dashboard and collaboration tools</li>
                    ${
                      projectName
                        ? `<li style="margin: 8px 0;">Project: ${projectName}</li>`
                        : ""
                    }
                    <li style="margin: 8px 0;">Document sharing and communication</li>
                    <li style="margin: 8px 0;">Project progress tracking</li>
                    ${
                      invitation.companyRole === "admin"
                        ? `<li style="margin: 8px 0;">Team management and company settings</li>`
                        : ""
                    }
                </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                    Accept Invitation
                </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 25px 0 0 0;">
                This invitation expires on <strong>${new Date(
                  invitation.expiresAt
                ).toLocaleDateString()}</strong>. 
                If you have any questions, please contact ${inviterName} directly.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This invitation was sent by ${companyName} via Hey You're Hired
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
                If you believe this was sent in error, you can safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
You're invited to join ${companyName}!

${inviterName} has invited you to join ${companyName} as a ${roleDisplay}.
${projectName ? `You'll be working on the ${projectName} project.` : ""}

${
  invitation.customMessage
    ? `Personal message: "${invitation.customMessage}"`
    : ""
}

What you'll have access to:
- Company dashboard and collaboration tools
${projectName ? `- Project: ${projectName}` : ""}
- Document sharing and communication
- Project progress tracking
${
  invitation.companyRole === "admin"
    ? "- Team management and company settings"
    : ""
}

Accept your invitation: ${acceptUrl}

This invitation expires on ${new Date(
      invitation.expiresAt
    ).toLocaleDateString()}.

If you have any questions, please contact ${inviterName} directly.

---
This invitation was sent by ${companyName} via Hey You're Hired
    `;

    return { subject, html, text };
  }

  /**
   * Generate accept invitation URL
   */
  static generateAcceptUrl(token: string): string {
    return `${this.BASE_URL}/invitations/accept?token=${token}`;
  }
}

import { eq, and, desc, count, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  invitations,
  users,
  companyUsers,
  projectUsers,
  companies,
  projects,
  companySubscriptions,
  type InsertInvitation,
  type SelectInvitation,
} from "@/db/schema";
import { randomBytes } from "crypto";
import { EmailService } from "./email-service";

export class InvitationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "InvitationError";
  }
}

export interface CreateInvitationRequest {
  email: string;
  companyId: string;
  invitedBy: string;
  companyRole: "admin" | "project_manager" | "member";
  projectId?: string;
  projectRole?: "project_manager" | "contractor" | "homeowner";
  customMessage?: string;
  expiresInDays?: number;
}

export interface InvitationWithDetails extends SelectInvitation {
  invitedByUser: {
    fullName: string | null;
    email: string | null;
  };
  company: {
    name: string;
  };
  project?: {
    name: string;
    address: string;
  } | null;
}

export class InvitationService {
  private static readonly DEFAULT_EXPIRY_DAYS = 7;
  private static readonly MAX_PENDING_INVITATIONS = 50;

  /**
   * Create a new invitation with comprehensive validation
   */
  static async createInvitation(
    request: CreateInvitationRequest
  ): Promise<SelectInvitation> {
    // Validate email format
    if (!this.isValidEmail(request.email)) {
      throw new InvitationError("Invalid email format", "INVALID_EMAIL", 400);
    }

    // Check if user already exists
    const existingUser = await this.findUserByEmail(request.email);
    if (existingUser) {
      // Check if user is already part of the company
      const existingMembership = await this.findCompanyMembership(
        existingUser.id,
        request.companyId
      );

      if (existingMembership) {
        throw new InvitationError(
          "User is already a member of this company",
          "USER_ALREADY_MEMBER",
          409
        );
      }
    }

    // Check for existing pending invitation
    const pendingInvitation = await this.findPendingInvitation(
      request.email,
      request.companyId
    );

    if (pendingInvitation) {
      throw new InvitationError(
        "Pending invitation already exists for this email",
        "INVITATION_EXISTS",
        409
      );
    }

    // Validate inviter permissions
    await this.validateInviterPermissions(
      request.invitedBy,
      request.companyId,
      request.companyRole
    );

    // Validate project assignment if provided
    if (request.projectId) {
      await this.validateProjectAssignment(
        request.projectId,
        request.companyId,
        request.invitedBy
      );
    }

    // Check invitation limits
    await this.checkInvitationLimits(request.companyId);

    // Generate secure token
    const token = this.generateSecureToken();

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + (request.expiresInDays || this.DEFAULT_EXPIRY_DAYS)
    );

    // Create invitation
    const invitationData: InsertInvitation = {
      companyId: request.companyId,
      projectId: request.projectId || null,
      email: request.email.toLowerCase().trim(),
      invitedBy: request.invitedBy,
      companyRole: request.companyRole,
      projectRole: request.projectRole || null,
      token,
      customMessage: request.customMessage,
      expiresAt,
      metadata: {
        invitedAt: new Date().toISOString(),
        userAgent: "system", // Can be enhanced to capture actual user agent
      },
    };

    const [invitation] = await db
      .insert(invitations)
      .values(invitationData)
      .returning();

    // Send invitation email
    try {
      console.log(
        "🔄 Starting email sending process for invitation:",
        invitation.id
      );

      const companyInfo = await db
        .select({ name: companies.name })
        .from(companies)
        .where(eq(companies.id, request.companyId))
        .limit(1);

      const inviterInfo = await db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, request.invitedBy))
        .limit(1);

      let projectInfo = null;
      if (request.projectId) {
        const projectData = await db
          .select({ name: projects.name })
          .from(projects)
          .where(eq(projects.id, request.projectId))
          .limit(1);
        projectInfo = projectData[0] || null;
      }

      console.log("📧 Email data prepared:", {
        recipient: invitation.email,
        companyName: companyInfo[0]?.name,
        projectName: projectInfo?.name,
        inviterName: inviterInfo[0]?.fullName,
      });

      const emailSent = await EmailService.sendInvitationEmail({
        invitation,
        companyName: companyInfo[0]?.name || "Unknown Company",
        projectName: projectInfo?.name,
        inviterName: inviterInfo[0]?.fullName || "Team Member",
        acceptUrl: EmailService.generateAcceptUrl(invitation.token),
      });

      console.log("📧 Email sending result:", emailSent);

      if (!emailSent) {
        console.warn(
          "❌ Failed to send invitation email, but invitation was created"
        );
      } else {
        console.log(
          "✅ Invitation email sent successfully to:",
          invitation.email
        );
      }
    } catch (emailError) {
      console.error("❌ Error sending invitation email:", emailError);
      // Don't throw error - invitation was created successfully
    }

    return invitation;
  }

  /**
   * Get invitation details with related data
   */
  static async getInvitationWithDetails(
    token: string
  ): Promise<InvitationWithDetails | null> {
    const result = await db
      .select({
        invitation: invitations,
        invitedByUser: {
          fullName: users.fullName,
          email: users.email,
        },
        company: {
          name: companies.name,
        },
        project: {
          name: projects.name,
          address: projects.address,
        },
      })
      .from(invitations)
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .innerJoin(companies, eq(invitations.companyId, companies.id))
      .leftJoin(projects, eq(invitations.projectId, projects.id))
      .where(eq(invitations.token, token))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row.invitation,
      invitedByUser: row.invitedByUser,
      company: row.company,
      project: row.project,
    };
  }

  /**
   * Accept an invitation and create user relationships
   */
  static async acceptInvitation(
    token: string,
    userId: string
  ): Promise<{
    invitation: SelectInvitation;
    companyMembership: any;
    projectMembership?: any;
  }> {
    const invitation = await this.getInvitationWithDetails(token);

    if (!invitation) {
      throw new InvitationError(
        "Invitation not found",
        "INVITATION_NOT_FOUND",
        404
      );
    }

    if (invitation.status !== "pending") {
      throw new InvitationError(
        "Invitation is no longer valid",
        "INVITATION_INVALID",
        400
      );
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await this.expireInvitation(invitation.id);
      throw new InvitationError(
        "Invitation has expired",
        "INVITATION_EXPIRED",
        400
      );
    }

    // Ensure user exists in our custom schema with proper system role
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      // Create user record with appropriate system role based on invitation
      const systemRole =
        invitation.companyRole === "admin" ||
        invitation.companyRole === "project_manager"
          ? "project_manager"
          : invitation.projectRole === "contractor"
          ? "contractor"
          : "homeowner";

      await db.insert(users).values({
        id: userId,
        systemRole,
        email: invitation.email,
        profile: {},
        preferences: {},
        isActive: true,
      });
    } else {
      // User already exists - update their system role based on invitation
      const newSystemRole =
        invitation.companyRole === "admin" ||
        invitation.companyRole === "project_manager"
          ? "project_manager"
          : invitation.projectRole === "contractor"
          ? "contractor"
          : "homeowner";

      console.log(
        "🎯 Invitation: Updating existing user system role to:",
        newSystemRole
      );

      await db
        .update(users)
        .set({
          systemRole: newSystemRole as
            | "super_admin"
            | "project_manager"
            | "contractor"
            | "homeowner",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Create company membership
    const [companyMembership] = await db
      .insert(companyUsers)
      .values({
        companyId: invitation.companyId,
        userId,
        companyRole: invitation.companyRole,
      })
      .returning();

    // Increment used seats in company subscription
    await this.incrementUsedSeats(invitation.companyId);

    // Create project membership if specified
    let projectMembership = null;
    if (invitation.projectId && invitation.projectRole) {
      [projectMembership] = await db
        .insert(projectUsers)
        .values({
          projectId: invitation.projectId,
          userId,
          projectRole: invitation.projectRole,
        })
        .returning();
    }

    // Mark invitation as accepted
    const [updatedInvitation] = await db
      .update(invitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitation.id))
      .returning();

    return {
      invitation: updatedInvitation,
      companyMembership,
      projectMembership,
    };
  }

  /**
   * Get invitations for a company with pagination
   */
  static async getInvitationsForCompany(
    companyId: string,
    options: {
      status?: string;
      projectId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    invitations: InvitationWithDetails[];
    total: number;
  }> {
    const { status, projectId, limit = 20, offset = 0 } = options;

    const whereConditions = [eq(invitations.companyId, companyId)];

    if (status && status !== "all") {
      whereConditions.push(eq(invitations.status, status as any));
    }

    if (projectId) {
      whereConditions.push(eq(invitations.projectId, projectId));
    }

    const result = await db
      .select({
        invitation: invitations,
        invitedByUser: {
          fullName: users.fullName,
          email: users.email,
        },
        company: {
          name: companies.name,
        },
        project: {
          name: projects.name,
          address: projects.address,
        },
      })
      .from(invitations)
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .innerJoin(companies, eq(invitations.companyId, companies.id))
      .leftJoin(projects, eq(invitations.projectId, projects.id))
      .where(and(...whereConditions))
      .orderBy(desc(invitations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(invitations)
      .where(and(...whereConditions));

    return {
      invitations: result.map((row) => ({
        ...row.invitation,
        invitedByUser: row.invitedByUser,
        company: row.company,
        project: row.project,
      })),
      total: Number(countResult.count) || 0,
    };
  }

  /**
   * Cancel a pending invitation
   */
  static async cancelInvitation(
    invitationId: string,
    cancelledBy: string
  ): Promise<SelectInvitation> {
    const [invitation] = await db
      .update(invitations)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
        metadata: {
          cancelledBy,
          cancelledAt: new Date().toISOString(),
        },
      })
      .where(
        and(eq(invitations.id, invitationId), eq(invitations.status, "pending"))
      )
      .returning();

    if (!invitation) {
      throw new InvitationError(
        "Invitation not found or cannot be cancelled",
        "INVITATION_NOT_CANCELLABLE",
        400
      );
    }

    return invitation;
  }

  /**
   * Resend an invitation with new token and expiry
   */
  static async resendInvitation(
    invitationId: string
  ): Promise<SelectInvitation> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_EXPIRY_DAYS);

    const [invitation] = await db
      .update(invitations)
      .set({
        token,
        expiresAt,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId))
      .returning();

    if (!invitation) {
      throw new InvitationError(
        "Invitation not found",
        "INVITATION_NOT_FOUND",
        404
      );
    }

    // Send the invitation email
    try {
      console.log("🔄 Resending invitation email for:", invitation.id);

      // Fetch related data for email
      const companyInfo = await db
        .select({ name: companies.name })
        .from(companies)
        .where(eq(companies.id, invitation.companyId))
        .limit(1);

      const projectInfo = invitation.projectId
        ? await db
            .select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, invitation.projectId))
            .limit(1)
        : null;

      const inviterInfo = await db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, invitation.invitedBy))
        .limit(1);

      const emailSent = await EmailService.sendInvitationEmail({
        invitation,
        companyName: companyInfo[0]?.name || "Unknown Company",
        projectName: projectInfo?.[0]?.name,
        inviterName: inviterInfo[0]?.fullName || "Team Member",
        acceptUrl: EmailService.generateAcceptUrl(invitation.token),
      });

      console.log("📧 Resend email result:", emailSent);

      if (!emailSent) {
        console.warn(
          "❌ Failed to resend invitation email, but invitation was updated"
        );
      } else {
        console.log(
          "✅ Invitation email resent successfully to:",
          invitation.email
        );
      }
    } catch (emailError) {
      console.error("❌ Error resending invitation email:", emailError);
      // Don't throw error - invitation was updated successfully
    }

    return invitation;
  }

  // Private helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static async findUserByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return result[0] || null;
  }

  private static async findCompanyMembership(
    userId: string,
    companyId: string
  ) {
    const result = await db
      .select()
      .from(companyUsers)
      .where(
        and(
          eq(companyUsers.userId, userId),
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  private static async findPendingInvitation(email: string, companyId: string) {
    const result = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email.toLowerCase().trim()),
          eq(invitations.companyId, companyId),
          eq(invitations.status, "pending")
        )
      )
      .limit(1);

    return result[0] || null;
  }

  private static async validateInviterPermissions(
    inviterId: string,
    companyId: string,
    targetRole: string
  ): Promise<void> {
    const membership = await this.findCompanyMembership(inviterId, companyId);

    if (!membership) {
      throw new InvitationError(
        "Inviter is not a member of this company",
        "INVITER_NOT_MEMBER",
        403
      );
    }

    // Business rule: Only admins can invite other admins or project managers
    if (targetRole === "admin" && membership.companyRole !== "admin") {
      throw new InvitationError(
        "Only admins can invite other admins",
        "INSUFFICIENT_PERMISSIONS",
        403
      );
    }

    if (
      targetRole === "project_manager" &&
      membership.companyRole === "member"
    ) {
      throw new InvitationError(
        "Only admins and project managers can invite project managers",
        "INSUFFICIENT_PERMISSIONS",
        403
      );
    }
  }

  private static async validateProjectAssignment(
    projectId: string,
    companyId: string,
    inviterId: string
  ): Promise<void> {
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.companyId, companyId)))
      .limit(1);

    if (!project.length) {
      throw new InvitationError(
        "Project not found or not accessible",
        "PROJECT_NOT_FOUND",
        404
      );
    }

    // Additional validation can be added here for project access permissions
  }

  private static async checkInvitationLimits(companyId: string): Promise<void> {
    // Check seat-based licensing first
    await this.checkSeatLimits(companyId);

    // Check pending invitations limit (secondary limit)
    const [countResult] = await db
      .select({ count: count() })
      .from(invitations)
      .where(
        and(
          eq(invitations.companyId, companyId),
          eq(invitations.status, "pending")
        )
      );

    if (Number(countResult.count) >= this.MAX_PENDING_INVITATIONS) {
      throw new InvitationError(
        "Maximum pending invitations limit reached",
        "INVITATION_LIMIT_EXCEEDED",
        429
      );
    }
  }

  /**
   * Check if company has available seats for new invitation
   */
  private static async checkSeatLimits(companyId: string): Promise<void> {
    // Get company subscription
    const [subscription] = await db
      .select({
        maxSeats: companySubscriptions.maxSeats,
        usedSeats: companySubscriptions.usedSeats,
        status: companySubscriptions.status,
      })
      .from(companySubscriptions)
      .where(eq(companySubscriptions.companyId, companyId))
      .limit(1);

    if (!subscription) {
      throw new InvitationError(
        "No active subscription found for this company",
        "NO_SUBSCRIPTION",
        402
      );
    }

    if (subscription.status !== "active") {
      throw new InvitationError(
        "Company subscription is not active",
        "SUBSCRIPTION_INACTIVE",
        402
      );
    }

    // Count current active members
    const [memberCount] = await db
      .select({ count: count() })
      .from(companyUsers)
      .where(
        and(
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true)
        )
      );

    // Count pending invitations
    const [pendingCount] = await db
      .select({ count: count() })
      .from(invitations)
      .where(
        and(
          eq(invitations.companyId, companyId),
          eq(invitations.status, "pending")
        )
      );

    const currentSeats = Number(memberCount.count);
    const pendingSeats = Number(pendingCount.count);
    const totalSeats = currentSeats + pendingSeats;

    console.log(`🔍 Seat check for company ${companyId}:`, {
      maxSeats: subscription.maxSeats,
      currentMembers: currentSeats,
      pendingInvitations: pendingSeats,
      totalSeats,
      availableSeats: subscription.maxSeats - totalSeats,
    });

    if (totalSeats >= subscription.maxSeats) {
      throw new InvitationError(
        `No available seats. Company has ${subscription.maxSeats} seats, ${currentSeats} active members, and ${pendingSeats} pending invitations.`,
        "SEAT_LIMIT_EXCEEDED",
        402
      );
    }
  }

  private static generateSecureToken(): string {
    return randomBytes(32).toString("hex");
  }

  private static async expireInvitation(invitationId: string): Promise<void> {
    await db
      .update(invitations)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId));
  }

  /**
   * Increment used seats counter when new member joins
   */
  private static async incrementUsedSeats(companyId: string): Promise<void> {
    try {
      await db
        .update(companySubscriptions)
        .set({
          usedSeats: sql`${companySubscriptions.usedSeats} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(companySubscriptions.companyId, companyId));

      console.log(`✅ Incremented used seats for company ${companyId}`);
    } catch (error) {
      console.error(
        `❌ Failed to increment used seats for company ${companyId}:`,
        error
      );
      // Don't throw error as invitation was already accepted successfully
    }
  }

  /**
   * Decrement used seats counter when member leaves
   */
  private static async decrementUsedSeats(companyId: string): Promise<void> {
    try {
      await db
        .update(companySubscriptions)
        .set({
          usedSeats: sql`${companySubscriptions.usedSeats} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(companySubscriptions.companyId, companyId));

      console.log(`✅ Decremented used seats for company ${companyId}`);
    } catch (error) {
      console.error(
        `❌ Failed to decrement used seats for company ${companyId}:`,
        error
      );
    }
  }
}

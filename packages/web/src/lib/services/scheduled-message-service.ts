import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { scheduledMessages } from "@/db/schema/meetings";
import { ScheduledMessage, ScheduledMessageStatus } from "@contractor-platform/types";

export class ScheduledMessageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ScheduledMessageError";
  }
}

export interface GetScheduledMessagesOptions {
  projectId: string;
  userId?: string;
  status?: ScheduledMessageStatus;
}

export class ScheduledMessageService {
  /**
   * Get all scheduled messages for a project with optional filters
   */
  static async getScheduledMessages(
    options: GetScheduledMessagesOptions
  ): Promise<ScheduledMessage[]> {
    const { projectId, userId, status } = options;

    if (!projectId) {
      throw new ScheduledMessageError(
        "Project ID is required",
        "PROJECT_ID_REQUIRED",
        400
      );
    }

    try {
      // Build where conditions
      const conditions = [eq(scheduledMessages.projectId, projectId)];

      if (userId) {
        conditions.push(eq(scheduledMessages.userId, userId));
      }

      if (status) {
        conditions.push(eq(scheduledMessages.status, status));
      }

      // Fetch scheduled messages for the project
      const messages = await db
        .select()
        .from(scheduledMessages)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

      // Transform camelCase DB fields to snake_case for type compatibility
      return messages.map((msg) => ({
        id: msg.id,
        user_id: msg.userId,
        project_id: msg.projectId,
        name: msg.name,
        mobile_no: msg.mobileNo,
        task: msg.task || undefined,
        message: msg.message || undefined,
        date_and_time: msg.dateAndTime,
        metadata: msg.metadata as Record<string, any>,
        status: msg.status,
        created_at: msg.createdAt,
        updated_at: msg.updatedAt,
      })) as ScheduledMessage[];
    } catch (error) {
      console.error("Error fetching scheduled messages:", error);
      throw new ScheduledMessageError(
        "Failed to fetch scheduled messages",
        "FETCH_SCHEDULED_MESSAGES_FAILED",
        500
      );
    }
  }

  /**
   * Get a single scheduled message by ID
   */
  static async getScheduledMessageById(
    messageId: string
  ): Promise<ScheduledMessage | null> {
    if (!messageId) {
      throw new ScheduledMessageError(
        "Message ID is required",
        "MESSAGE_ID_REQUIRED",
        400
      );
    }

    try {
      const [message] = await db
        .select()
        .from(scheduledMessages)
        .where(eq(scheduledMessages.id, messageId))
        .limit(1);

      if (!message) {
        return null;
      }

      // Transform camelCase DB fields to snake_case for type compatibility
      return {
        id: message.id,
        user_id: message.userId,
        project_id: message.projectId,
        name: message.name,
        mobile_no: message.mobileNo,
        task: message.task || undefined,
        message: message.message || undefined,
        date_and_time: message.dateAndTime,
        metadata: message.metadata as Record<string, any>,
        status: message.status,
        created_at: message.createdAt,
        updated_at: message.updatedAt,
      } as ScheduledMessage;
    } catch (error) {
      console.error("Error fetching scheduled message:", error);
      throw new ScheduledMessageError(
        "Failed to fetch scheduled message",
        "FETCH_SCHEDULED_MESSAGE_FAILED",
        500
      );
    }
  }

  /**
   * Get scheduled messages by status
   */
  static async getScheduledMessagesByStatus(
    projectId: string,
    status: ScheduledMessageStatus
  ): Promise<ScheduledMessage[]> {
    return this.getScheduledMessages({ projectId, status });
  }

  /**
   * Get scheduled messages for a user in a project
   */
  static async getScheduledMessagesForUser(
    projectId: string,
    userId: string
  ): Promise<ScheduledMessage[]> {
    return this.getScheduledMessages({ projectId, userId });
  }
}

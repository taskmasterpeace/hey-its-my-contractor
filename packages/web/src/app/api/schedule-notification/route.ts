import { db } from "../../../db";
import { scheduledMessages } from "../../../db/schema";
import { NextRequest, NextResponse } from "next/server";
import { schedulerService } from "@/lib/services/scheduler-service";
import {
    calculateNotificationTime,
    generateScheduleName,
    getNotificationLabel,
    isDateInPast,
} from "@/utils/notification-helpers";
import { generateNotificationMessage } from "@/lib/services/generate-message-service";
import { eq } from "drizzle-orm";

type ScheduledMessageStatus = 'idle' | 'scheduled' | 'sent' | 'failed' | 'cancelled';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            projectId,
            userId,
            name,
            mobileNumber,
            dateAndTime,
            task,
            notificationTimes,
        } = body;

        // Validate that the scheduled time is in the future
        if (isDateInPast(dateAndTime)) {
            return NextResponse.json(
                { error: "Cannot schedule tasks in the past" },
                { status: 400 }
            );
        }

        // Insert into database first
        const result = await db
            .insert(scheduledMessages)
            .values({
                userId,
                projectId,
                name,
                mobileNo: mobileNumber,
                task,
                message: task,
                dateAndTime,
                metadata: {
                    notificationTimes,
                    scheduleArns: [],
                },
            })
            .returning();

        const scheduledMessage = result[0];
        const scheduleArns: string[] = [];

        // Create AWS EventBridge schedules for each notification time
        for (const notificationType of notificationTimes) {
            try {
                const notificationDateTime = calculateNotificationTime(
                    dateAndTime,
                    notificationType
                );

                // Skip if notification time is in the past
                if (isDateInPast(notificationDateTime)) {
                    continue;
                }

                const scheduleName = generateScheduleName(
                    scheduledMessage.id,
                    notificationType
                );

                // Generate AI-powered notification message
                const notificationMessage = await generateNotificationMessage({
                    name,
                    task,
                    dateAndTime,
                    notificationType,
                });

                const scheduleArn = await schedulerService.createScheduleEvent({
                    name: scheduleName,
                    description: `${getNotificationLabel(notificationType)} notification for task: ${task.substring(0, 50)}`,
                    date: notificationDateTime,
                    input: {
                        mobile_no: mobileNumber,
                        message: notificationMessage,
                    },
                });

                scheduleArns.push(scheduleArn);
            } catch (error) {
                console.error(`Failed to create schedule for ${notificationType}:`, error);
                // Continue with other schedules even if one fails
            }
        }

        // Update the database record with schedule ARNs and status
        let updatedMessage = scheduledMessage;
        const status: ScheduledMessageStatus = scheduleArns.length > 0 ? 'scheduled' : 'idle';
        const updateResult = await db
            .update(scheduledMessages)
            .set({
                metadata: {
                    notificationTimes,
                    scheduleArns,
                },
                status: status as typeof scheduledMessages.$inferInsert.status,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(scheduledMessages.id, scheduledMessage.id))
            .returning();
        updatedMessage = updateResult[0];

        return NextResponse.json({
            success: true,
            data: {
                ...updatedMessage,
                schedulesCreated: scheduleArns.length,
            },
        });
    } catch (error) {
        console.error("Error scheduling task:", error);
        return NextResponse.json(
            {
                error: "Failed to schedule task",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// DELETE endpoint to cancel schedules
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get("messageId");

        if (!messageId) {
            return NextResponse.json(
                { error: "Message ID is required" },
                { status: 400 }
            );
        }

        // Get the message from database
        const messages = await db
            .select()
            .from(scheduledMessages)
            .where(eq(scheduledMessages.id, messageId))
            .limit(1);

        if (messages.length === 0) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        const message = messages[0];
        const scheduleArns = (message.metadata as { scheduleArns: string[] })?.scheduleArns || [];

        // Delete all associated AWS schedules
        for (const arn of scheduleArns) {
            try {
                await schedulerService.removeScheduleEvent(arn);
            } catch (error) {
                console.error(`Failed to delete schedule ${arn}:`, error);
            }
        }

        // Delete from database
        await db.delete(scheduledMessages).where(eq(scheduledMessages.id, messageId));

        return NextResponse.json({
            success: true,
            message: "Task and schedules deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting scheduled task:", error);
        return NextResponse.json(
            { error: "Failed to delete scheduled task" },
            { status: 500 }
        );
    }
}

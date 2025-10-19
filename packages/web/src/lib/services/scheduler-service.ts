import {
    SchedulerClient,
    CreateScheduleCommand,
    FlexibleTimeWindowMode,
    ActionAfterCompletion,
    DeleteScheduleCommand,
} from "@aws-sdk/client-scheduler";

interface NotificationInput {
    mobile_no: string;
    message: string;
}

interface ScheduleEventData {
    name: string;
    description: string;
    date: string;
    input: NotificationInput;
}

class SchedulerService {
    private client: SchedulerClient;

    constructor() {
        this.client = new SchedulerClient({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }

    async createScheduleEvent(data: ScheduleEventData): Promise<string> {
    try {
        // Convert to UTC format required by EventBridge: YYYY-MM-DDTHH:mm:ss
        // Using toISOString() and manipulating it ensures we stay in UTC
        const dateObj = new Date(data.date);
        const scheduleDate = dateObj.toISOString().slice(0, 19); // Extract YYYY-MM-DDTHH:mm:ss

        const scheduleParams = {
            Name: data.name,
            Description: data.description,
            ScheduleExpression: `at(${scheduleDate})`,
            ScheduleExpressionTimezone: "UTC",
            Target: {
                Arn: process.env.LAMBDA_FUNCTION_ARN!,
                RoleArn: process.env.EVENTBRIDGE_ROLE_ARN!,
                Input: JSON.stringify(data.input),
                RetryPolicy: {
                    MaximumRetryAttempts: 3,
                },
            },
            FlexibleTimeWindow: {
                Mode: FlexibleTimeWindowMode.OFF,
            },
            ActionAfterCompletion: ActionAfterCompletion.DELETE,
        };

        const scheduleCommand = new CreateScheduleCommand(scheduleParams);
        const schedule = await this.client.send(scheduleCommand);

        return schedule.ScheduleArn!;
    } catch (error) {
        console.error("Error creating EventBridge schedule:", error);
        if (error instanceof Error) {
            console.error("Error details:", {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
        }
        throw error;
    }
    }

    async removeScheduleEvent(scheduleArn: string): Promise<void> {
        try {
            const name = scheduleArn?.split("/")?.pop();

            if (!name) {
                throw new Error("Invalid schedule ARN");
            }

            const scheduleParams = {
                Name: name,
            };

            const scheduleCommand = new DeleteScheduleCommand(scheduleParams);
            await this.client.send(scheduleCommand);
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'name' in error && error.name === "ResourceNotFoundException") {
                // Schedule not found, may have already been deleted
                return;
            }
            throw error;
        }
    }
}

export const schedulerService = new SchedulerService();

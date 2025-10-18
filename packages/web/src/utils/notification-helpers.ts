import { subHours, subDays, subWeeks, format, isBefore } from "date-fns";

export function calculateNotificationTime(
    taskDateTime: string,
    notificationType: string
): string {
    const taskDate = new Date(taskDateTime);

    let notificationDate: Date;

    switch (notificationType) {
        case "1hour":
            notificationDate = subHours(taskDate, 1);
            break;
        case "1day":
            notificationDate = subDays(taskDate, 1);
            break;
        case "1week":
            notificationDate = subWeeks(taskDate, 1);
            break;
        default:
            throw new Error(`Invalid notification type: ${notificationType}`);
    }

    return notificationDate.toISOString();
}

export function generateScheduleName(
    scheduledMessageId: string,
    notificationType: string,
): string {
    return `TASK-AUTO-SCHEDULER-${notificationType}-${scheduledMessageId}`;
}

export function getNotificationLabel(notificationType: string): string {
    const labels: Record<string, string> = {
        "1hour": "1 Hour Before",
        "1day": "1 Day Before",
        "1week": "1 Week Before",
    };
    return labels[notificationType] || notificationType;
}

export function isDateInPast(date: string | Date): boolean {
    return isBefore(new Date(date), new Date());
}

export function formatDateTime(date: string | Date): string {
    return format(new Date(date), "MMMM dd, yyyy 'at' hh:mm a");
}

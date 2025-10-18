import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

interface NotificationParams {
    name: string;
    task: string;
    dateAndTime: string;
    notificationType: string;
}

export async function generateNotificationMessage({
    name,
    task,
    dateAndTime,
    notificationType,
}: NotificationParams): Promise<string> {
    try {
        const notificationLabels: Record<string, string> = {
            "1hour": "1 Hour Before",
            "1day": "1 Day Before",
            "1week": "1 Week Before",
        };

        const notificationLabel = notificationLabels[notificationType] || notificationType;

        const prompt = `Generate a friendly, professional reminder message for a task notification.

Context:
- Recipient's name: ${name}
- Task description: ${task}
- Scheduled date/time: ${dateAndTime}
- Notification timing: ${notificationLabel}

Requirements:
- Keep it concise and clear (under 160 characters if possible for SMS)
- Use a warm, professional tone
- Include all the key information (task, date/time, timing)
- Make it actionable and helpful
- Do not use markdown or special formatting
- Start with a greeting using the recipient's name

Generate only the message text, nothing else.`

        const { text } = await generateText({
            model: openrouter('openai/gpt-4-turbo'),
            prompt,
            maxOutputTokens: 150,
            temperature: 0.7,
        });

        return text.trim();
    } catch (error) {
        console.error('Error generating AI notification message:', error);

        // Fallback to template message if AI fails
        const notificationLabels: Record<string, string> = {
            "1hour": "1 Hour Before",
            "1day": "1 Day Before",
            "1week": "1 Week Before",
        };

        const notificationLabel = notificationLabels[notificationType] || notificationType;
        const formattedDate = new Date(dateAndTime).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `Hi ${name},\n\nReminder: ${task}\n\nScheduled for: ${formattedDate}\n\nNotification: ${notificationLabel}`;
    }
}

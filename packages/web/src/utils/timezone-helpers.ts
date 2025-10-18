import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Get the user's current timezone
 */
export function getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a local date/time to UTC ISO string for storage
 * @param localDate - Date object in user's local timezone
 * @returns ISO string in UTC
 */
export function localToUTC(localDate: Date): string {
    return localDate.toISOString();
}

/**
 * Convert UTC ISO string to local Date object
 * @param utcString - UTC ISO string from database
 * @returns Date object in user's local timezone
 */
export function utcToLocal(utcString: string): Date {
    return new Date(utcString);
}

/**
 * Format a UTC timestamp to display in user's local timezone
 * @param utcString - UTC ISO string from database
 * @param formatString - date-fns format string (default: 'MMM dd, yyyy hh:mm a')
 * @returns Formatted string in user's local timezone
 */
export function formatInUserTimezone(
    utcString: string,
    formatString: string = 'MMM dd, yyyy hh:mm a'
): string {
    const userTimezone = getUserTimezone();
    return formatInTimeZone(parseISO(utcString), userTimezone, formatString);
}

/**
 * Get timezone offset display (e.g., "IST", "PST", "UTC+5:30")
 */
export function getTimezoneDisplay(): string {
    const date = new Date();
    const tzString = date.toLocaleTimeString('en-US', { timeZoneName: 'short' });
    const match = tzString.match(/\b([A-Z]{3,4})\b$/);
    return match ? match[1] : getUserTimezone();
}

/**
 * Combine date and time strings in user's local timezone
 * @param date - Date object (date portion)
 * @param timeString - Time string in HH:mm format
 * @returns Date object with combined date and time
 */
export function combineDateAndTime(date: Date, timeString: string): Date {
    const [hourStr, minuteStr] = timeString.split(':');
    const combinedDate = new Date(date);
    combinedDate.setHours(Number(hourStr), Number(minuteStr), 0, 0);
    return combinedDate;
}

/**
 * Check if a date/time is in the past (with optional buffer)
 * @param date - Date object or ISO string to check
 * @param bufferMinutes - Optional buffer in minutes (default: 1)
 * @returns true if the date is in the past
 */
export function isInPast(date: Date | string, bufferMinutes: number = 1): boolean {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const bufferMs = bufferMinutes * 60 * 1000;
    return checkDate.getTime() < (now.getTime() - bufferMs);
}

/**
 * Get a user-friendly relative time description
 * @param utcString - UTC ISO string
 * @returns Relative time string (e.g., "in 2 hours", "in 3 days")
 */
export function getRelativeTime(utcString: string): string {
    const date = new Date(utcString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
        return 'Past';
    } else if (diffMinutes < 60) {
        return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
        return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
        const diffWeeks = Math.floor(diffDays / 7);
        return `in ${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
    }
}

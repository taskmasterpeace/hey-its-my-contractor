export const formatElapsedTime = (timestamp: string): string => {
    const seconds = parseInt(timestamp, 10);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
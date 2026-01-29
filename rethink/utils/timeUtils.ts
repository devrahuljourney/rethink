export const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) return `${seconds}s`;
    return parts.join(' ');
};

export const getStartOfDay = (date: Date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

export const getPreviousDayStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

export const getPreviousDayEnd = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime() - 1;
};

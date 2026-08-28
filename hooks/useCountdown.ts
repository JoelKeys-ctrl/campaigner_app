import { useState, useEffect } from 'react';

const calculateTimeLeft = (targetDate: Date | null): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
} | null => {
    if (!targetDate || isNaN(targetDate.getTime())) return null;

    const difference = +targetDate - +new Date();
    
    if (difference > 0) {
        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }
    
    return null;
};

const formatTimeLeft = (timeLeft: { days: number, hours: number, minutes: number, seconds: number } | null): string => {
    if (!timeLeft) return '';
    
    const parts: string[] = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
    if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
    
    // Always show seconds if the time is less than a minute
    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
      parts.push(`${timeLeft.seconds}s`);
    }

    if (parts.length === 0 && timeLeft.seconds >= 0) {
        parts.push(`${timeLeft.seconds}s`);
    }

    // Join the first 3 most significant parts for a clean look
    return `in ${parts.slice(0, 3).join(' ')}`;
};


export const useCountdown = (targetDateString: string | undefined): string => {
    const [targetDate, setTargetDate] = useState<Date | null>(null);

    useEffect(() => {
        if (targetDateString) {
            const date = new Date(targetDateString);
            if (!isNaN(date.getTime()) && date > new Date()) {
                setTargetDate(date);
            } else {
                setTargetDate(null);
            }
        } else {
            setTargetDate(null);
        }
    }, [targetDateString]);
    
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft(null);
            return;
        }

        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft(targetDate);
            if (newTimeLeft) {
                setTimeLeft(newTimeLeft);
            } else {
                setTimeLeft(null);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return formatTimeLeft(timeLeft);
};

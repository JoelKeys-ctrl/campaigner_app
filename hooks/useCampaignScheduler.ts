import { useRef, useCallback, useEffect } from 'react';
import { Campaign } from '../types';

// The return type of window.setTimeout is a number.
type TimerId = number;

/**
 * A custom hook to manage client-side scheduling for email campaigns.
 * It sets and clears timeouts to trigger sending campaigns at their scheduled time.
 * @param campaigns - The array of all campaigns. The hook will filter for scheduled ones.
 * @param sendCampaignCallback - A memoized callback function to execute when a campaign is due.
 */
export const useCampaignScheduler = (
    campaigns: Campaign[],
    sendCampaignCallback: (campaign: Campaign) => Promise<void>
) => {
    const timers = useRef<Map<number, TimerId>>(new Map());
    const sendCallbackRef = useRef(sendCampaignCallback);

    // Keep the callback ref updated without re-triggering the main effect.
    useEffect(() => {
        sendCallbackRef.current = sendCampaignCallback;
    }, [sendCampaignCallback]);
    
    const clear = useCallback((campaignId: number) => {
        if (timers.current.has(campaignId)) {
            clearTimeout(timers.current.get(campaignId)!);
            timers.current.delete(campaignId);
            console.log(`[Scheduler] Cleared schedule for campaign ${campaignId}.`);
        }
    }, []);
    
    const schedule = useCallback((campaign: Campaign) => {
        // If campaign is not scheduled, ensure any existing timer is cleared.
        if (campaign.status !== 'scheduled' || !campaign.scheduled_at) {
            clear(campaign.id);
            return;
        }

        const scheduledTime = new Date(campaign.scheduled_at).getTime();
        const now = new Date().getTime();
        const delay = scheduledTime - now;

        // Clear any existing timer before setting a new one. This handles schedule updates.
        clear(campaign.id);

        if (delay <= 0) {
            // This can happen if the app was closed when the campaign was due.
            // We send it immediately.
            console.warn(`[Scheduler] Campaign ${campaign.id} was scheduled for the past. Sending immediately.`);
            sendCallbackRef.current(campaign);
            return;
        }

        const timerId = window.setTimeout(() => {
            console.log(`[Scheduler] Sending scheduled campaign: ${campaign.id}`);
            sendCallbackRef.current(campaign);
            timers.current.delete(campaign.id);
        }, delay);

        timers.current.set(campaign.id, timerId);
        console.log(`[Scheduler] Campaign ${campaign.id} scheduled to be sent in ${Math.round(delay/1000)}s.`);
    }, [clear]);
    
    // Main effect to synchronize timers with the campaign list.
    useEffect(() => {
        console.log('[Scheduler] Synchronizing campaign schedules...');
        const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled');
        const scheduledIds = new Set(scheduledCampaigns.map(c => c.id));

        // 1. Clear timers for campaigns that are no longer scheduled or have been deleted.
        for (const campaignId of timers.current.keys()) {
            if (!scheduledIds.has(campaignId)) {
                clear(campaignId);
            }
        }
        
        // 2. Schedule all campaigns that are marked as 'scheduled'.
        // The `schedule` function handles updates by clearing old timers first.
        for (const campaign of scheduledCampaigns) {
            schedule(campaign);
        }

        // Cleanup on unmount: clear all timers.
        return () => {
            console.log('[Scheduler] Cleaning up all timers.');
            for (const timerId of timers.current.values()) {
                clearTimeout(timerId);
            }
            timers.current.clear();
        };
    }, [campaigns, schedule, clear]);
};

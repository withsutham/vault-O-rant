type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export const trackEvent = (eventName: string, payload?: AnalyticsPayload): void => {
    const timestamp = new Date().toISOString();
    if (payload) {
        console.log(`[Analytics] ${timestamp} ${eventName}`, payload);
        return;
    }
    console.log(`[Analytics] ${timestamp} ${eventName}`);
};

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export const trackEvent = (eventName: string, payload?: AnalyticsPayload): void => {
    void eventName;
    void payload;
};

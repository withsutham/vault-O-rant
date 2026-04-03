export type NormalizedAppError = {
    message: string;
    isAuthError: boolean;
    source: 'auth' | 'data/network';
};

export const normalizeAppError = (err: any, fallbackMessage: string): NormalizedAppError => {
    const isAuthError =
        err?.message === 'AUTH_ERROR' ||
        err?.isAuthError ||
        err?.statusCode === 401 ||
        err?.statusCode === 403 ||
        err?.errorCode === 'AUTH_FAILED';

    if (isAuthError) {
        return {
            message: err?.friendlyMessage || 'Your session has expired. Please sign in again.',
            isAuthError: true,
            source: 'auth',
        };
    }

    return {
        message: err?.friendlyMessage || err?.message || fallbackMessage,
        isAuthError: false,
        source: 'data/network',
    };
};

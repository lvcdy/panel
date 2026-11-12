export declare const DEFAULT_RATE_LIMIT_MAX: number;
export declare const DEFAULT_RATE_LIMIT_WINDOW_MS: number;

export declare const resetRateLimitState: () => void;

export declare const checkRateLimit: (
    request: Request,
    options?: {
        route?: string;
        env?: Record<string, string | undefined>;
        now?: number;
    },
) => {
    allowed: boolean;
    remaining: number;
    retryAfter: number;
};

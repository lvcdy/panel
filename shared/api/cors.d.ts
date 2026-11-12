export declare const parseAllowedOrigins: (
    value: unknown,
) => Set<string>;

export declare const isCrossOriginDenied: (
    request: Request,
    env?: Record<string, string | undefined>,
) => boolean;

export declare const corsHeaders: (
    request: Request,
    env?: Record<string, string | undefined>,
) => Record<string, string>;

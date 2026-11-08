export interface SiteStatusPayload {
    status: string;
    http_code?: number;
    response_time_ms?: number;
}

export declare const sanitizeSiteStatusPayload: (
    payload: unknown,
) => SiteStatusPayload;

export declare const handleSiteStatus: (
    request: Request,
    fetchImpl?: typeof fetch,
) => Promise<Response>;

export declare const fetchWithTimeout: (
    fetchImpl: typeof fetch,
    url: string,
    init?: RequestInit,
    timeoutMs?: number,
) => Promise<Response>;

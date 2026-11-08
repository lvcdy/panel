export type NetworkPlatform = "cloudflare" | "edgeone" | "unknown";

export interface NetworkInfoPayload {
    platform: NetworkPlatform;
    clientIp: string | null;
    asn: number | null;
    organization: string | null;
    edgeLocation: string | null;
    location: string | null;
    availableFields: string[];
    updatedAt: string;
}

export declare const handleNetworkInfo: (
    request: Request,
    fetchImpl?: typeof fetch,
) => Promise<Response>;

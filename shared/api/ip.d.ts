export declare const sanitizeText: (
    value: unknown,
    maxLength?: number,
) => string | null;

export declare const isIpLiteral: (value: string) => boolean;

export declare const normalizePublicIp: (value: unknown) => string | null;

export declare const isValidStatusDomain: (value: unknown) => boolean;

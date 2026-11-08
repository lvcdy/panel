const PATH_SEGMENT = /^[A-Za-z0-9._~-]+$/;

const normalizePathStrict = (value) => {
    const raw = value.trim();
    if (!raw) return "/";
    if (/[?#\\]/.test(raw)) return null;

    const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
    const segments = withLeadingSlash
        .replace(/\/+/g, "/")
        .split("/")
        .filter(Boolean);

    if (
        segments.some(
            (segment) =>
                segment === "." ||
                segment === ".." ||
                !PATH_SEGMENT.test(segment),
        )
    ) {
        return null;
    }

    return segments.length === 0 ? "/" : `/${segments.join("/")}/`;
};

export const normalizeBasePath = (value, fallback = "/") => {
    const normalized = normalizePathStrict(value ?? "");
    return normalized ?? fallback;
};

export const normalizeApiBase = (value, fallback = "/api/") => {
    const raw = (value ?? "").trim();
    if (!raw) return fallback;

    if (/^https?:\/\//i.test(raw)) {
        if (/[?#\\]/.test(raw)) return fallback;

        try {
            const url = new URL(raw);
            if (url.username || url.password) return fallback;

            const path = normalizePathStrict(url.pathname);
            if (!path) return fallback;

            return `${url.origin}${path}`;
        } catch {
            return fallback;
        }
    }

    if (raw.includes("://")) return fallback;

    return normalizePathStrict(raw) ?? fallback;
};

export const joinApiEndpoint = (base, endpoint) => {
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    return `${normalizedBase}${endpoint.replace(/^\/+/, "")}`;
};

import type { APIRoute } from "astro";

export const prerender = false;

const IP9_API_URL = "https://ip9.com.cn/get";

export const GET: APIRoute = async ({ request }) => {
    try {
        const res = await fetch(IP9_API_URL, {
            headers: {
                accept: "application/json",
                "user-agent": request.headers.get("user-agent") ?? "",
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            return new Response(
                JSON.stringify({ error: `upstream ${res.status}` }),
                { status: 502, headers: { "content-type": "application/json" } }
            );
        }

        const data = await res.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "content-type": "application/json",
                "cache-control": "public, max-age=600",
            },
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { "content-type": "application/json" } }
        );
    }
};

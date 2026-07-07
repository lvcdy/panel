import type { APIRoute } from 'astro';

export const prerender = false;

const IP9_API_URL = "https://ip9.com.cn/get";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(IP9_API_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return jsonResponse({
        ret: 200,
        data: { ip: "unknown", country: "未知", prov: "", city: "", area: "", isp: "" },
        error: `upstream ${res.status}`,
      });
    }

    const data = await res.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Edge IP fetch error:", error);
    return jsonResponse({
      ret: 200,
      data: { ip: "unknown", country: "未知", prov: "", city: "", area: "", isp: "" },
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

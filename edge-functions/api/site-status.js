// EdgeOne Edge Function: proxy site status API
const STATUS_API_URL = "https://isyourwebsitedownrightnow.com/api/status";

const isValidDomain = (value) =>
  /^[a-z0-9.-]+$/i.test(value) &&
  value.includes(".") &&
  !value.startsWith(".") &&
  !value.endsWith(".");

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const domain = url.searchParams.get("domain")?.trim() || "";

  if (!isValidDomain(domain)) {
    return new Response(JSON.stringify({ error: "Invalid domain" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const response = await fetch(
      `${STATUS_API_URL}?domain=${encodeURIComponent(domain)}`,
      { headers: { accept: "application/json" } }
    );
    return new Response(response.body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 502,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
      }
    );
  }
}

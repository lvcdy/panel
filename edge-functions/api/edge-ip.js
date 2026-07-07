// EdgeOne Edge Function: proxy ip9.com.cn API (server-side, no CORS)
export async function onRequestGet(context) {
  try {
    // Extract ALL request headers for debugging
    const headers = {};
    context.request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const res = await fetch("https://ip9.com.cn/get", {
      headers: { accept: "application/json" },
    });
    const body = await res.json();

    return new Response(
      JSON.stringify({ ...body, _headers: headers }),
      {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ret: 502,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      }
    );
  }
}

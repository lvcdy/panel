// EdgeOne Edge Function: proxy ip9.com.cn API (server-side, no CORS)
export async function onRequestGet() {
  try {
    const res = await fetch("https://ip9.com.cn/get", {
      headers: { accept: "application/json" },
    });
    const body = await res.json();
    return new Response(JSON.stringify(body), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ret: 200,
        data: {
          ip: "unknown",
          country: "未知",
          prov: "",
          city: "",
          area: "",
          isp: "",
        },
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      }
    );
  }
}

// EdgeOne Edge Function: return both user IP and edge node IP via ip9.com.cn
export async function onRequestGet() {
  try {
    // 1. Get user's real IP from ipify (edge function call, no CORS issue)
    const userIpRes = await fetch("https://api.ipify.org?format=json");
    const { ip: userIp } = await userIpRes.json();

    // 2. Query ip9.com.cn for both IPs in parallel
    const [userRes, edgeRes] = await Promise.all([
      fetch(`https://ip9.com.cn/get?ip=${userIp}`, {
        headers: { accept: "application/json" },
      }),
      fetch("https://ip9.com.cn/get", {
        headers: { accept: "application/json" },
      }),
    ]);

    const userData = await userRes.json();
    const edgeData = await edgeRes.json();

    return new Response(
      JSON.stringify({
        ret: 200,
        user: userData.data || null,
        edge: edgeData.data || null,
      }),
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

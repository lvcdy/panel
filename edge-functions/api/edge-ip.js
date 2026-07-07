// EdgeOne Edge Function: return user IP and/or edge node IP via ip9.com.cn
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userIp = url.searchParams.get("ip")?.trim();

    if (userIp) {
      // Both user and edge node info requested
      const [userRes, edgeRes] = await Promise.all([
        fetch(`https://ip9.com.cn/get?ip=${encodeURIComponent(userIp)}`, {
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
    }

    // Only edge node info requested (no ?ip=)
    const edgeRes = await fetch("https://ip9.com.cn/get", {
      headers: { accept: "application/json" },
    });
    const edgeData = await edgeRes.json();
    return new Response(
      JSON.stringify({
        ret: 200,
        user: null,
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

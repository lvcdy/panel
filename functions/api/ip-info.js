// 从请求头获取真实客户端IP
const getClientIp = (request) => {
  // 按优先级检查各种可能包含真实IP的头
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return forwardedFor.split(",")[0].trim();
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  const xClientIp = request.headers.get("x-client-ip");
  if (xClientIp && xClientIp !== "127.0.0.1") {
    return xClientIp;
  }

  // 如果是本地开发环境
  return "127.0.0.1";
};

export const onRequestGet = async (context) => {
  try {
    const clientIp = getClientIp(context.request);
    
    // 如果是本地IP，直接返回
    if (clientIp === "127.0.0.1" || clientIp === "localhost") {
      return new Response(JSON.stringify({
        ret: 200,
        data: {
          ip: clientIp,
          country: "本地",
          prov: "",
          city: "",
          area: "",
          isp: "本地网络",
        },
      }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      });
    }
    
    // 使用 ip.sb 的 GeoIP 端点查询地址信息
    const response = await fetch(`https://api.ip.sb/geoip/${clientIp}`, {
      headers: {
        accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`);
    }

    const data = await response.json();

    // 检查返回数据的有效性
    if (!data || typeof data !== "object") {
      throw new Error("Invalid IP API response format");
    }

    // 将响应转换为与前端期望的格式兼容
    const formattedData = {
      ret: 200,
      data: {
        ip: data.ip || clientIp,
        country: data.country || "",
        prov: data.region || "",
        city: data.city || "",
        area: data.organization || "",
        isp: data.organization || "",
      },
    };

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("IP info fetch error:", error);
    
    return new Response(JSON.stringify({
      ret: 200,
      data: {
        ip: "unknown",
        country: "未知",
        prov: "",
        city: "",
        area: "",
        isp: "",
      },
      error: error.message,
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  }
};

const json = (body) => new Response(JSON.stringify(body), {
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
});

const getUnknownResponse = (error) => json({
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
});

const getIp9Response = async (clientIp) => {
  const response = await fetch(
    `https://ip9.com.cn/get?ip=${encodeURIComponent(clientIp)}`,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`IP9 API returned ${response.status}`);
  }

  const data = await response.json();
  if (data?.ret !== 200 || !data.data) {
    throw new Error("Invalid IP9 API response");
  }

  return json(data);
};

export const getIpInfoResponse = async (clientIp) => {
  try {
    if (!clientIp) {
      throw new Error("Missing client IP");
    }

    return await getIp9Response(clientIp);
  } catch (error) {
    console.error("IP info fetch error:", error);
    return getUnknownResponse(error);
  }
};

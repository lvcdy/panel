const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

const getUnknownResponse = (error: Error) =>
  jsonResponse({
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

const getIp9Response = async (clientIp?: string) => {
  const query = clientIp ? `?ip=${encodeURIComponent(clientIp)}` : "";
  const response = await fetch(`https://ip9.com.cn/get${query}`, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`IP9 API returned ${response.status}`);
  }

  const data = await response.json();
  if (data?.ret !== 200 || !data.data) {
    throw new Error("Invalid IP9 API response");
  }

  return jsonResponse(data);
};

export const getEdgeIpResponse = async () => {
  try {
    return await getIp9Response();
  } catch (error) {
    console.error("Edge IP fetch error:", error);
    return getUnknownResponse(error as Error);
  }
};

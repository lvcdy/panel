import { fetchIp9, type Ip9Response } from "./ip-utils";

const IP9_API_URL = "https://ip9.com.cn/get";

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

const getIp9Response = async (clientIp?: string): Promise<Response> => {
  const url = clientIp
    ? `${IP9_API_URL}?ip=${encodeURIComponent(clientIp)}`
    : IP9_API_URL;
  const data = await fetchIp9(url, 8000);
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

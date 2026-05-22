const IP9_URL = "https://ip9.com.cn/get";

export const onRequestGet = async () => {
  const response = await fetch(IP9_URL, {
    headers: {
      accept: "application/json",
    },
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
};

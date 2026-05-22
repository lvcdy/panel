const STATUS_API_URL = "https://isyourwebsitedownrightnow.com/api/status";

const isValidDomain = (value) =>
  /^[a-z0-9.-]+$/i.test(value) &&
  value.includes(".") &&
  !value.startsWith(".") &&
  !value.endsWith(".");

export const onRequestGet = async ({ request }) => {
  const domain = new URL(request.url).searchParams.get("domain")?.trim() || "";

  if (!isValidDomain(domain)) {
    return Response.json({ error: "Invalid domain" }, { status: 400 });
  }

  const response = await fetch(`${STATUS_API_URL}?domain=${encodeURIComponent(domain)}`, {
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

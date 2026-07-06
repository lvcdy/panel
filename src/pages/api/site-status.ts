import type { APIRoute } from 'astro';

const STATUS_API_URL = "https://isyourwebsitedownrightnow.com/api/status";

export const prerender = true;

const isValidDomain = (value: string): boolean =>
  /^[a-z0-9.-]+$/i.test(value) &&
  value.includes(".") &&
  !value.startsWith(".") &&
  !value.endsWith(".");

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain')?.trim() || '';

  if (!isValidDomain(domain)) {
    return new Response(JSON.stringify({ error: "Invalid domain" }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const response = await fetch(`${STATUS_API_URL}?domain=${encodeURIComponent(domain)}`, {
    headers: { accept: "application/json" },
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
};

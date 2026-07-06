import type { APIRoute } from 'astro';
import { getIpInfoResponse } from '../../lib/api-edge';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const getClientIp = (req: Request) =>
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim();

  return getIpInfoResponse(getClientIp(request));
};

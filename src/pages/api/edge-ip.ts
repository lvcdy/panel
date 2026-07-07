import type { APIRoute } from 'astro';
import { getEdgeIpResponse } from '../../lib/api-edge';

export const prerender = false;

export const GET: APIRoute = async () => {
  return getEdgeIpResponse();
};

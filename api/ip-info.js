import { getIpInfoResponse } from "../edge/ip-info.js";

const getClientIp = (request) =>
  request.headers.get("x-vercel-forwarded-for")?.trim();

export async function GET(request) {
  return getIpInfoResponse(getClientIp(request));
}

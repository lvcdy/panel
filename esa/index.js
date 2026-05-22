import { getEdgeIpResponse, getIpInfoResponse } from "../edge/ip-info.js";

const getClientIp = (request) =>
  request.headers.get("ali-real-client-ip")?.trim();

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/ip-info" || pathname === "/api/ip-info/") {
      return getIpInfoResponse(getClientIp(request));
    }

    if (pathname === "/api/edge-ip" || pathname === "/api/edge-ip/") {
      return getEdgeIpResponse();
    }

    return new Response("Not Found", {
      status: 404,
    });
  },
};

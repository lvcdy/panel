import { getIpInfoResponse } from "../../edge/ip-info.js";

const getClientIp = (request) =>
  request.eo?.clientIp || request.headers.get("cf-connecting-ip")?.trim();

export const onRequestGet = ({ request }) => getIpInfoResponse(
  getClientIp(request),
);

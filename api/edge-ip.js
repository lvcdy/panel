import { getEdgeIpResponse } from "../edge/ip-info.js";

export async function GET() {
  return getEdgeIpResponse();
}

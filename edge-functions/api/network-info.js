// EdgeOne Pages Function adapter for the shared network-info handler.
import { handleNetworkInfo } from "../../shared/api/network-info.js";

export async function onRequestGet(context) {
  return handleNetworkInfo(context.request, fetch, context.env);
}

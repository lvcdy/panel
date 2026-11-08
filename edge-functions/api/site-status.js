// EdgeOne Pages Function adapter for the shared site-status handler.
import { handleSiteStatus } from "../../shared/api/site-status.js";

export async function onRequestGet(context) {
  return handleSiteStatus(context.request);
}

import { handleSiteStatus } from "../../shared/api/site-status.js";

interface PagesFunctionContext {
    request: Request;
}

export const onRequestGet = ({
    request,
}: PagesFunctionContext): Promise<Response> => handleSiteStatus(request);

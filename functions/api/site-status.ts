import { handleSiteStatus } from "../../shared/api/site-status.js";

interface PagesFunctionContext {
    request: Request;
    env: Record<string, string | undefined>;
}

export const onRequestGet = ({
    request,
    env,
}: PagesFunctionContext): Promise<Response> =>
    handleSiteStatus(request, fetch, env);

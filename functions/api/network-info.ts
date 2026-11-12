import { handleNetworkInfo } from "../../shared/api/network-info.js";

interface PagesFunctionContext {
    request: Request;
    env: Record<string, string | undefined>;
}

export const onRequestGet = ({
    request,
    env,
}: PagesFunctionContext): Promise<Response> =>
    handleNetworkInfo(request, fetch, env);

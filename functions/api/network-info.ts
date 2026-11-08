import { handleNetworkInfo } from "../../shared/api/network-info.js";

interface PagesFunctionContext {
    request: Request;
}

export const onRequestGet = ({
    request,
}: PagesFunctionContext): Promise<Response> => handleNetworkInfo(request);

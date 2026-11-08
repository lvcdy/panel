import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import type { Connect, Plugin } from 'vite';
import { handleNetworkInfo } from './shared/api/network-info.js';
import { handleSiteStatus } from './shared/api/site-status.js';
import {
  joinApiEndpoint,
  normalizeApiBase,
  normalizeBasePath,
} from './shared/paths.js';

// Astro config runs in Node, but @types/node is intentionally not added to the
// project. Only this tiny property is needed by the config.
declare const process: { env: Record<string, string | undefined> };

const siteBase = normalizeBasePath(process.env.PANEL_BASE);
const apiBase = normalizeApiBase(
  process.env.PANEL_API_BASE ??
    process.env.PUBLIC_PANEL_API_BASE ??
    '/api/',
);
const apiIsAbsolute = /^https?:\/\//i.test(apiBase);

interface DevRequest {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface DevResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string | Uint8Array): void;
}

type WebHandler = (
  request: Request,
  fetchImpl?: typeof fetch,
) => Promise<Response>;

const toWebRequest = (req: DevRequest): Request => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(', '));
  }

  return new Request(new URL(req.url ?? '/', 'http://localhost'), {
    method: req.method ?? 'GET',
    headers,
  });
};

const sendWebResponse = async (
  response: Response,
  res: DevResponse,
): Promise<void> => {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(new Uint8Array(await response.arrayBuffer()));
};

const createDevMiddleware = (
  handler: WebHandler,
): Connect.NextHandleFunction => {
  return (req, res) => {
    void (async () => {
      const devRes = res as unknown as DevResponse;
      try {
        const request = toWebRequest(req as unknown as DevRequest);
        await sendWebResponse(await handler(request), devRes);
      } catch {
        devRes.statusCode = 500;
        devRes.setHeader('content-type', 'application/json; charset=utf-8');
        devRes.end(JSON.stringify({ error: 'Internal error' }));
      }
    })();
  };
};

// Dev-only: run the same shared edge handlers locally.
const devApiProxy = (): Plugin | null => {
  if (apiIsAbsolute) return null;

  return {
    name: 'panel-dev-api-proxy',
    configureServer(server) {
      server.middlewares.use(
        joinApiEndpoint(apiBase, 'site-status'),
        createDevMiddleware(handleSiteStatus),
      );
      server.middlewares.use(
        joinApiEndpoint(apiBase, 'network-info'),
        createDevMiddleware(handleNetworkInfo),
      );
    },
  };
};

const proxyPlugin = devApiProxy();

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base: siteBase,
  vite: {
    define: {
      __PANEL_API_BASE__: JSON.stringify(apiBase),
    },
    plugins: [tailwindcss(), ...(proxyPlugin ? [proxyPlugin] : [])],
  },
});

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MiddlewareHandler = (req: any, res: any, next: () => void) => void;

// Dev-only proxy: forwards /api/* to external APIs (replaces EdgeOne edge functions locally)
function devApiProxy() {
  return {
    name: "dev-api-proxy",
    configureServer(server: { middlewares: { use: (path: string, handler: MiddlewareHandler) => void } }) {
      server.middlewares.use("/api/site-status", async (req, res) => {
        const reqUrl = new URL(req.url ?? "", "http://localhost");
        const domain = reqUrl.searchParams.get("domain")?.trim() ?? "";

        if (!/^[a-z0-9.-]+$/i.test(domain) || !domain.includes(".")) {
          res.setHeader("content-type", "application/json");
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid domain" }));
          return;
        }

        try {
          const upstream = await fetch(
            `https://isyourwebsitedownrightnow.com/api/status?domain=${encodeURIComponent(domain)}`,
            {
              headers: { accept: "application/json" },
              signal: AbortSignal.timeout(10_000),
            },
          );
          const body = await upstream.text();
          res.setHeader("content-type", "application/json");
          res.setHeader("cache-control", "no-store");
          res.end(body);
        } catch (error) {
          res.setHeader("content-type", "application/json");
          res.statusCode = 502;
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
    },
  };
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  vite: {
    plugins: [tailwindcss(), devApiProxy()],
  },
});

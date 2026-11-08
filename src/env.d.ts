/// <reference types="astro/client" />

/** 由 astro.config.ts 的 Vite define 注入 */
declare const __PANEL_API_BASE__: string | undefined;

interface ImportMetaEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

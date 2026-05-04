/// <reference types="vite/client" />

interface ImportMetaEnv { }

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";

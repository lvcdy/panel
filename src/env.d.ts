/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // 在此处定义环境变量类型 (例如：readonly PUBLIC_API_KEY: string;)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 如果你希望在全局范围内更方便地使用 SDK 类型，可以在此扩展
declare namespace App {
  interface Locals {
    // 针对中间件的类型定义
  }
}
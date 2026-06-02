/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCRAPPER_API_BASE_URL?: string;
  readonly VITE_SCRAPPER_ADMIN_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

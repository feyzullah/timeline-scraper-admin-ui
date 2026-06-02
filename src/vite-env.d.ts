/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_PATH?: string;
  readonly VITE_SCRAPPER_API_BASE_URL?: string;
  readonly VITE_ADMIN_UI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

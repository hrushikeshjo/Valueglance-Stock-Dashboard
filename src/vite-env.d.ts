/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STOCK_API_PROVIDER?: 'mock' | 'alpha-vantage' | 'finnhub';
  readonly VITE_ALPHA_VANTAGE_API_KEY?: string;
  readonly VITE_FINNHUB_API_KEY?: string;
  readonly VITE_STOCK_SYMBOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export const APP_CONFIG = {
  SEARCH_DEBOUNCE_MS: 300,
  MAX_TRANSACTION_LIMIT: 10000000,
  DEFAULT_CURRENCY: "USD",
  DECIMAL_PLACES: 2,
  TOAST_DURATION_MS: 3000,
  VAULT_CONNECTION_TIMEOUT_MS: 2000,
  API_BASE_URL: import.meta.env.VITE_API_URL,
  FALLBACK_EXCHANGE_RATES: {
    "usd-eur": 1.0869,
    "usd-gbp": 1.3157,
  },
};

export const STORAGE_KEYS = {
  HISTORY: "history",
  BALANCE: "totalBalance",
  THEME: "theme",
};

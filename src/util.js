import { APP_CONFIG } from "./config.js";

export function formatNumber(number) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: APP_CONFIG.DEFAULT_CURRENCY,
  });
  return formatter.format(number);
}

export function debounce(func, delay = APP_CONFIG.SEARCH_DEBOUNCE_MS) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

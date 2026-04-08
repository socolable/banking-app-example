import { APP_CONFIG } from "./config.js";
import { showToast } from "./ui.js";

const baseURL = APP_CONFIG.API_BASE_URL;

export async function getExchangeRate(fromCurr, toCurr) {
  const fromCurrency = fromCurr.toLowerCase();
  const toCurrency = toCurr.toLowerCase();

  const url = `${baseURL}/${fromCurrency}.json`;

  const FALLBACK_RATES = APP_CONFIG.FALLBACK_EXCHANGE_RATES;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data[fromCurrency][toCurrency];
  } catch (e) {
    console.error("Error: ", e);

    showToast("Problem fetching rates. Using fallback rates.");

    const pairKey = `${fromCurrency}-${toCurrency}`;
    return FALLBACK_RATES[pairKey] || 1;
  }
}

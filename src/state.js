export const state = {
  history: [],
  usdToEurRate: 1,
  usdToGBPRate: 1,
  isLoading: true,
  vaultError: false,
  theme: localStorage.getItem("theme") || "light",
};

let onStateChange = null;

export function subscribe(callback) {
  onStateChange = callback;
}

export function updateState(action, payload) {
  console.log(`Action: ${action}`, payload);

  switch (action) {
    case "ADD_TRANSACTION":
      state.history = [...state.history, payload];
      break;
    case "DELETE_TRANSACTION":
      state.history = state.history.filter((t) => t.id !== payload);
      break;
    case "SET_HISTORY":
      state.history = [...payload];
      break;
    case "SET_RATES":
      state.usdToEurRate = payload.eur;
      state.usdToGBPRate = payload.gbp;
      break;
    case "SET_LOADING":
      state.isLoading = payload;
      break;
    case "SET_THEME":
      state.theme = payload;
      localStorage.setItem("theme", payload);
      break;
    case "SET_ERROR":
      state.vaultError = payload;
      break;
  }

  if (onStateChange) {
    onStateChange();
  }
}

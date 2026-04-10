import "./style.css";
import { isValid } from "./validators.js";
import {
  renderUI,
  showLoading,
  showError,
  setLoading,
  showToast,
  applyTheme,
} from "./ui.js";
import { loadFromVault, saveToVault } from "./storage.js";
import { getExchangeRate } from "./api.js";
import { getBalance, filterTransactions } from "./finance.js";
import { debounce } from "./util.js";
import { APP_CONFIG, STORAGE_KEYS } from "./config.js";
import { state, updateState, subscribe } from "./state.js";

// --- 1. SELECTORS ---
const balanceDisplay = document.querySelector("#balance-display");
const amountInput = document.querySelector("#amount-input");
const depositBtn = document.querySelector("#deposit-btn");
const withdrawBtn = document.querySelector("#withdraw-btn");
const clearAllBtn = document.querySelector("#clear-all-btn");
const transactionList = document.querySelector("#transaction-list");
const searchInput = document.querySelector("#search-input");
const totalDepositDisplay = document.querySelector("#total-deposit");
const totalWithdrawDisplay = document.querySelector("#total-withdraw");

const selectors = {
  balanceDisplay,
  amountInput,
  depositBtn,
  withdrawBtn,
  clearAllBtn,
  transactionList,
  searchInput,
  totalDepositDisplay,
  totalWithdrawDisplay,
};

const themeBtn = document.querySelector("#theme-toggle");

// --- 2. DATA STATE (The "Source of Truth") ---

showLoading(selectors);

subscribe(() => {
  updateApp();
});

async function initApp() {
  updateState("SET_LOADING", true);
  updateState("SET_ERROR", false);
  try {
    console.log("1. Starting Promise.all...");
    const [savedData, eurRate, gbpRate] = await Promise.all([
      loadFromVault().catch((err) => {
        console.warn("Vault timed out, but we are keeping the app alive.");
        return { history: [], error: true }; // Flag that the load failed
      }),
      getExchangeRate("USD", "EUR").catch(() => 1), // Default to 1, not 0
      getExchangeRate("USD", "GBP").catch(() => 1),
    ]);

    console.log("2. Data Received:", savedData);

    updateState("SET_HISTORY", savedData.history || []);
    updateState("SET_ERROR", savedData.error || false);
    updateState("SET_RATES", { eur: eurRate || 0, gbp: gbpRate || 0 });
    console.log("3. Data Actions Dispatched");
  } catch (e) {
    console.error("CRITICAL INIT ERROR:", e);
    //showError(selectors, e);
    updateState("SET_ERROR", true);
  } finally {
    console.log("4. Turning off loader...");
    updateState("SET_LOADING", false);
  }
}
initApp();

export function updateApp(dataToShow = state.history) {
  if (state.isLoading) return;

  applyTheme(state.theme);

  const currentBalance = getBalance(state.history);
  renderUI(
    currentBalance,
    dataToShow,
    selectors,
    state.usdToEurRate,
    state.usdToGBPRate,
    state.vaultError,
  );

  if (themeBtn) {
    themeBtn.textContent =
      state.theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
}

const handleSearch = debounce(() => {
  const searchTerm = searchInput.value;
  const filteredTransactions = filterTransactions(searchTerm, state.history);
  updateApp(filteredTransactions);
}, APP_CONFIG.SEARCH_DEBOUNCE_MS);

function handleDataChange() {
  const currentBalance = getBalance(state.history);
  try {
    saveToVault(currentBalance, state.history);
  } catch (e) {
    if (e.message.includes("QUOTA_FULL")) {
      openModal("Vault is full! Please clear some history.", () => {});
    }
  }
}
// --- 3. EVENT LISTENERS ---

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const nextTheme = state.theme === "light" ? "dark" : "light";
    updateState("SET_THEME", nextTheme);
  });
}

depositBtn.addEventListener("click", (e) => {
  const rawValue = amountInput.value;
  const button = e.currentTarget;
  const originalText = button.textContent;

  if (!isValid(rawValue)) return;

  // disable Deposit button after clicking to avoid double-click
  button.disabled = true;
  button.textContent = "processing...";

  const amount = Number(rawValue);

  const newTransaction = { id: Date.now(), amount, type: "deposit" };
  updateState("ADD_TRANSACTION", newTransaction);

  showToast();
  handleDataChange();

  // enable Deposit button 1 second after clicking
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 600);
});

withdrawBtn.addEventListener("click", (e) => {
  const rawValue = amountInput.value;

  if (!isValid(rawValue)) return;

  const button = e.currentTarget;
  const originalText = button.textContent;

  // disable Withdraw button after clicking to avoid double click
  button.disabled = true;
  button.textContent = "processing...";

  const amount = Number(rawValue);

  if (amount > getBalance(state.history)) {
    alert("Insufficient funds!");
  } else {
    const newTransaction = { id: Date.now(), amount, type: "withdraw" };
    updateState("ADD_TRANSACTION", newTransaction);
    handleDataChange();
  }

  // enable Withdraw button 1s after clicking
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 600);
});

export function openModal(message, onConfirm) {
  const dialog = document.querySelector("#confirmation-modal");
  const modalMessage = document.querySelector("#modal-text");
  const confirmBtn = document.querySelector("#modal-confirm");
  const cancelBtn = document.querySelector("#modal-cancel");

  dialog.close();
  modalMessage.textContent = message;

  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  dialog.showModal();

  const handleConfirm = () => {
    onConfirm();
    dialog.close();
    amountInput.focus();
  };

  newConfirmBtn.addEventListener("click", handleConfirm, { once: true });

  dialog.addEventListener(
    "close",
    () => {
      newConfirmBtn.removeEventListener("click", handleConfirm);
    },
    { once: true },
  );

  newCancelBtn.addEventListener(
    "click",
    () => {
      dialog.close();
    },
    { once: true },
  );
}

clearAllBtn.addEventListener("click", () => {
  openModal("Clear all now?", () => {
    updateState("SET_HISTORY", []);
    handleDataChange();
  });
});

searchInput.addEventListener("input", handleSearch);

transactionList.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (btn) {
    const idToDelete = Number(btn.getAttribute("data-id"));

    const itemToDelete = state.history.find(
      (transaction) => transaction.id === idToDelete,
    );

    // If cannot find the itemToDelete for some reason, stop
    if (!itemToDelete) return;

    updateState("DELETE_TRANSACTION", idToDelete);
    handleDataChange();
  }
});

// --- GLOBAL ERROR BOUNDARY ---

// Catches any "Rejected" promises that weren't handled locally.
// Catches unexpected API failures or network drops.
window.addEventListener("unhandledrejection", (event) => {
  console.error("Vault Error (Unhandled):", event.reason);

  showToast("Vault connection interrupted. Please check your network.");

  // If the error happened during the initial load, hide the loader
  updateState("SET_LOADING", false);
});

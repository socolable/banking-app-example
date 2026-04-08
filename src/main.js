import "./style.css";
import { isValid } from "./validators.js";
import {
  renderUI,
  showLoading,
  showError,
  setLoading,
  showToast,
} from "./ui.js";
import { loadFromVault, saveToVault } from "./storage.js";
import { getExchangeRate } from "./api.js";
import { getBalance, filterTransactions } from "./finance.js";
import { debounce } from "./util.js";
import { APP_CONFIG, STORAGE_KEYS } from "./config.js";

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

// --- 2. DATA STATE (The "Source of Truth") ---

const state = {
  history: [],
  usdToEurRate: 1,
  usdToGBPRate: 1,
  isLoading: true,
};

// THEME CHECK
const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
}

const themeBtn = document.querySelector("#theme-toggle");

showLoading(selectors);

async function initApp() {
  setLoading(state.isLoading, selectors);
  try {
    const savedData = await loadFromVault();
    state.history = savedData.history;

    updateApp();

    [state.usdToEurRate, state.usdToGBPRate] = await Promise.all([
      getExchangeRate("USD", "EUR"),
      getExchangeRate("USD", "GBP"),
    ]);

    updateApp();
  } catch (e) {
    showError(selectors, e);
  } finally {
    state.isLoading = false;
    setLoading(state.isLoading, selectors);
  }
}
initApp();

function updateApp(dataToShow = state.history) {
  const currentBalance = getBalance(state.history);
  renderUI(
    currentBalance,
    dataToShow,
    selectors,
    state.usdToEurRate,
    state.usdToGBPRate,
  );
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
  updateApp();
}
// --- 3. EVENT LISTENERS ---

themeBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
});

depositBtn.addEventListener("click", (e) => {
  const rawValue = amountInput.value;
  const button = e.currentTarget;
  const originalText = button.textContent;

  if (!isValid(rawValue)) return;

  // disable Deposit button after clicking to avoid double-click
  button.disabled = true;
  button.textContent = "processing...";

  const amount = Number(rawValue);

  state.history.push({ id: Date.now(), amount, type: "deposit" });

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
    state.history.push({ id: Date.now(), amount, type: "withdraw" });
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
    state.history.splice(0, state.history.length);
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

    state.history = state.history.filter(
      (transaction) => transaction.id !== idToDelete,
    );
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
  state.isLoading = false;
  setLoading(state.isLoading, selectors);
});

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
const savedTheme = localStorage.getItem("theme");
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

function getBalance() {
  return state.history.reduce((accum, transaction) => {
    return transaction.type === "deposit"
      ? accum + transaction.amount
      : accum - transaction.amount;
  }, 0);
}

function updateApp(dataToShow = state.history) {
  const currentBalance = getBalance();
  try {
    saveToVault(currentBalance, state.history);
  } catch (e) {
    console.log("4. Catch block reached in main.js. Error message:", e.message);

    // We check if the message contains our keyword
    if (e.message.includes("QUOTA_FULL")) {
      openModal("Vault is full! Please clear some history.", () => {
        console.log("User closed modal");
      });
    }
  }

  renderUI(
    currentBalance,
    dataToShow,
    selectors,
    state.usdToEurRate,
    state.usdToGBPRate,
  );
}

function debounce(func, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// --- 5. EVENT LISTENERS ---

themeBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
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
  updateApp();

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

  if (amount > getBalance()) {
    alert("Insufficient funds!");
  } else {
    state.history.push({ id: Date.now(), amount, type: "withdraw" });
    updateApp();
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
    updateApp();
  });
});

const handleSearch = debounce(() => {
  const searchTerm = searchInput.value;
  if (searchTerm.length === 0) {
    updateApp();
    return;
  }
  const filteredTransactions = state.history.filter((transaction) =>
    String(transaction.amount).includes(searchInput.value),
  );
  updateApp(filteredTransactions);
}, 300);

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
    updateApp();
  }
});

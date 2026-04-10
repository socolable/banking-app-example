import { APP_CONFIG } from "./config.js";
import { calculateTotals } from "./finance.js";
import { formatNumber } from "./util.js";

const toastContainer = document.querySelector("#toast-container");

const toast = document.createElement("div");
toast.classList.add("toast");
toast.textContent = "Successfully deposit! Hoora!";

toastContainer.appendChild(toast);

export function showLoading(selectors) {
  selectors.transactionList.textContent = "";

  const loadingContainer = document.createElement("div");
  loadingContainer.style.display = "flex";
  loadingContainer.style.flexDirection = "column";
  loadingContainer.style.alignItems = "center";
  loadingContainer.style.padding = "20px";

  const loader = document.createElement("div");
  loader.classList.add("loader");

  const loadingTextMessage = document.createElement("p");
  loadingTextMessage.textContent = "Accessing vault...";
  loadingTextMessage.style.marginTop = "8px";

  loadingContainer.appendChild(loader);
  loadingContainer.appendChild(loadingTextMessage);

  selectors.transactionList.appendChild(loadingContainer);
}

export function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

export function showToast(message = "Success!") {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, APP_CONFIG.TOAST_DURATION_MS);
}

export function setLoading(isLoading, selectors) {
  isLoading === true ? showSpinner(selectors) : hideSpinner(selectors);
}

function showSpinner(selectors) {
  selectors.depositBtn.disabled = true;
  selectors.withdrawBtn.disabled = true;

  const spinner1 = document.createElement("span");
  const spinner2 = document.createElement("span");
  spinner1.classList.add("spinner");
  spinner2.classList.add("spinner");

  selectors.depositBtn.textContent = "Wait...";
  selectors.withdrawBtn.textContent = "Wait...";

  selectors.depositBtn.prepend(spinner1);
  selectors.withdrawBtn.prepend(spinner2);
}

function hideSpinner(selectors) {
  selectors.depositBtn.disabled = false;
  selectors.withdrawBtn.disabled = false;

  selectors.depositBtn.textContent = `Deposit`;
  selectors.withdrawBtn.textContent = `Withdraw`;
}

export function displayTotals(totals, selectors) {
  selectors.totalDepositDisplay.textContent = formatNumber(
    totals.totalDeposits,
  );
  selectors.totalWithdrawDisplay.textContent = formatNumber(
    totals.totalWithdraws,
  );
}

export function renderUI(
  currentBalance,
  transactionArr,
  selectors,
  usdToEurRate,
  usdToGBPRate,
  vaultError,
) {
  if (vaultError) {
    console.log("Vault error reaches");
    selectors.transactionList.innerHTML = `
      <div class="error-state">
        <span class="material-symbols-outlined">cloud_off</span>
        <p>Vault connection is weak. Your history couldn't be loaded.</p>
        <button onclick="window.location.reload()" id="retry-btn">Retry Connection</button>
      </div>
    `;
    selectors.totalDepositDisplay.textContent = "---";
    selectors.totalWithdrawDisplay.textContent = "---";
    return;
  }

  const formattedUSDBalance = formatNumber(currentBalance);
  const euroBalance = usdToEurRate * currentBalance;
  const gbpBalance = usdToGBPRate * currentBalance;

  const formattedEuro = usdToEurRate
    ? `${euroBalance.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`
    : "€ rate not available";
  const formattedGBP = usdToGBPRate
    ? `${gbpBalance.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}`
    : "GBP rate not available";

  selectors.balanceDisplay.textContent = `${formattedUSDBalance} | ${formattedEuro} | ${formattedGBP}`;

  const totals = calculateTotals(transactionArr);
  console.log("DEBUG: Calculated Totals:", totals);
  displayTotals(totals, selectors);

  selectors.transactionList.textContent = "";
  if (transactionArr.length === 0) {
    const emptyStateDisplay = createEmptyState();
    selectors.transactionList.appendChild(emptyStateDisplay);
  } else {
    transactionArr.forEach((transaction) => {
      const row = createTransactionRow(transaction);
      selectors.transactionList.appendChild(row);
    });

    // Clear the input box
    selectors.amountInput.value = "";
  }
}

export function showError(selectors, error) {
  selectors.transactionList.textContent = `Error: ${error}. Please try again.`;
  const retryBtn = document.createElement("button");
  retryBtn.textContent = "Retry";
  retryBtn.id = "retry-btn";
  selectors.transactionList.appendChild(retryBtn);

  retryBtn.addEventListener("click", () => {
    window.location.reload();
  });
}

function createTransactionRow(transaction) {
  const newItem = document.createElement("li");
  newItem.className = "transaction-row";
  const newTransactionText = document.createElement("span");

  newTransactionText.textContent = `${transaction.type === "deposit" ? "+" : "-"}${formatNumber(transaction.amount)} `;
  newTransactionText.classList.add(
    transaction.type === "deposit" ? "deposit-item" : "withdraw-item",
  );

  //create delete button with X text and add to li element
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "X";
  deleteBtn.classList.add("delete-btn");
  deleteBtn.setAttribute("data-id", transaction.id);

  newItem.appendChild(newTransactionText);
  newItem.appendChild(deleteBtn);

  return newItem;
}

function createEmptyState() {
  const emptyStateDiv = document.createElement("div");
  emptyStateDiv.classList.add("empty-state");

  const symbol = document.createElement("span");
  symbol.classList.add("material-symbols-outlined");
  Object.assign(symbol.style, { fontSize: "48px", color: "#ccc" });
  symbol.textContent = "account_balance_wallet";

  const headline = document.createElement("h2");
  headline.textContent = "Your vault is empty.";

  const textMessage = document.createElement("p");
  textMessage.textContent =
    "Ready to save? Make your first deposit above to start tracking your wealth.";

  emptyStateDiv.append(symbol, headline, textMessage);

  return emptyStateDiv;
}

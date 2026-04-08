import { APP_CONFIG } from "./config.js";
import { displayTotals } from "./finance.js";
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

export function renderUI(
  currentBalance,
  transactionArr,
  selectors,
  usdToEurRate,
  usdToGBPRate,
) {
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

  if (transactionArr.length === 0) {
    selectors.transactionList.textContent = "";
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
    selectors.transactionList.appendChild(emptyStateDiv);

    displayTotals([], selectors);
  } else {
    // Wipe the list and rebuild it from the Array
    selectors.transactionList.textContent = "";

    transactionArr.forEach((transaction) => {
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
      selectors.transactionList.appendChild(newItem);
    });

    // Clear the input box
    selectors.amountInput.value = "";
  }
  displayTotals(transactionArr, selectors);
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

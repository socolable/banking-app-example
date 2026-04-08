import { formatNumber } from "./util.js";

export function getBalance(history) {
  return history.reduce((accum, transaction) => {
    return transaction.type === "deposit"
      ? accum + transaction.amount
      : accum - transaction.amount;
  }, 0);
}

export function filterTransactions(searchTerm, history) {
  if (!searchTerm) return history;
  const filteredTransactions = history.filter((transaction) =>
    String(transaction.amount).includes(searchTerm),
  );
  return filteredTransactions;
}

export function displayTotals(transactionArr, selectors) {
  const data = transactionArr || [];

  const totalDeposits = data
    .filter((transaction) => transaction.type === "deposit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalWithdraws = data
    .filter((transaction) => transaction.type === "withdraw")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  selectors.totalDepositDisplay.textContent = `Total Deposit: ${formatNumber(totalDeposits)}`;
  selectors.totalWithdrawDisplay.textContent = `Total Withdraw: ${formatNumber(totalWithdraws)}`;
}

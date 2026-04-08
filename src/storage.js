import { APP_CONFIG } from "./config";

export function saveToVault(currentBalance, transactionHistory) {
  try {
    localStorage.setItem("totalBalance", currentBalance);
    localStorage.setItem("history", JSON.stringify(transactionHistory));
  } catch (error) {
    throw new Error("QUOTA_FULL");
  }
}

export function loadFromVault() {
  console.log("Attemp to connect to vault...");
  const failureChance = Math.random();

  let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failureChance >= 0.2) {
        try {
          const data = {
            balance: Number(localStorage.getItem("totalBalance")) || 0,
            history: JSON.parse(localStorage.getItem("history")) || [],
          };
          console.log("Vault connection established");
          resolve(data);
        } catch {
          console.log("Data array is messed up so resolving an emtpy array");
          resolve([]);
        }
      } else {
        reject("Vault connection timeout!");
      }
    }, APP_CONFIG.VAULT_CONNECTION_TIMEOUT_MS);
  });

  return promise;
}

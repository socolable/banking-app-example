export function saveToVault(currentBalance, transactionHistory) {
  console.log("1. Entering saveToVault...");
  try {
    localStorage.setItem("totalBalance", currentBalance);
    localStorage.setItem("history", JSON.stringify(transactionHistory));
    console.log("2. Save successful (no error thrown by browser)");
  } catch (error) {
    // This MUST run if localStorage is full
    console.log("3. BROWSER ERROR DETECTED:", error.name);

    // We throw a brand new error to simplify things for main.js
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
    }, 2000);
  });

  return promise;
}

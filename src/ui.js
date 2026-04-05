const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const toastContainer = document.querySelector('#toast-container');

const toast = document.createElement('div');
toast.classList.add('toast');
toast.textContent = 'Successfully deposit! Hoora!';

toastContainer.appendChild(toast);


export function showLoading(selectors){
    selectors.transactionList.innerHTML = "";
    selectors.transactionList.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; padding: 20px;">
            <div class="loader"></div>
            <p style="margin-top: 10px;">Securely accessing vault...</p>
        </div>`;
}

export function showToast(message = "Success!"){
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {toast.classList.remove('show')}, 3000);
}

export function setLoading(isLoading, selectors){
    (isLoading === true) ? showSpinner(selectors) : hideSpinner(selectors);
}

function showSpinner(selectors){
    selectors.depositBtn.disabled = true;
    selectors.withdrawBtn.disabled = true;

    selectors.depositBtn.innerHTML = `<span class="spinner"></span> Wait...`;
    selectors.withdrawBtn.innerHTML = `<span class="spinner"></span> Wait...`;
}

function hideSpinner(selectors){
    selectors.depositBtn.disabled = false;
    selectors.withdrawBtn.disabled = false;

    selectors.depositBtn.innerHTML = `Deposit`;
    selectors.withdrawBtn.innerHTML = `Withdraw`;
}

export function renderUI(currentBalance, transactionArr, selectors, usdToEurRate, usdToGBPRate) {
    const formattedUSDBalance = formatter.format(currentBalance);
    const euroBalance = usdToEurRate*currentBalance;    
    const gbpBalance = usdToGBPRate*currentBalance;

    const formattedEuro = usdToEurRate ? `${euroBalance.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})}` : "€ rate not available";
    const formattedGBP = usdToGBPRate ? `${gbpBalance.toLocaleString('en-GB', {style: 'currency', currency: 'GBP'})}` : "GBP rate not available";
    
    selectors.balanceDisplay.innerText = `${formattedUSDBalance} | ${formattedEuro} | ${formattedGBP}`;
        

    if(transactionArr.length === 0){
        selectors.transactionList.innerHTML = `
        <div class="empty-state">
            <span class="material-symbols-outlined" style="font-size: 48px; color: #ccc;">
                account_balance_wallet
            </span>
            <h3>Your Vault is Empty</h3>
            <p>Ready to save? Make your first deposit above to start tracking your wealth.</p>
        </div>
    `;
    }
    else{
        // Wipe the list and rebuild it from the Array
        selectors.transactionList.innerHTML = "";
        
        transactionArr.forEach((transaction) => {
            const newItem = document.createElement('li');
            newItem.className = "transaction-row";
            const newTransactionText = document.createElement('span');

            newTransactionText.innerText = `${transaction.type === 'deposit' ? '+' : '-'}${formatter.format(transaction.amount)} `;
            newTransactionText.classList.add(transaction.type === 'deposit' ? 'deposit-item' : 'withdraw-item');
            
            //create delete button with X text and add to li element
            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = "X";
            deleteBtn.classList.add('delete-btn');

            deleteBtn.setAttribute('data-id', transaction.id);
            newItem.appendChild(newTransactionText)
            newItem.appendChild(deleteBtn);
            selectors.transactionList.appendChild(newItem);
        }); 
        
        displayTotals(transactionArr, selectors); 

        // Clear the input box
        selectors.amountInput.value = '';
    }
    
}

export function displayTotals(transactionArr, selectors){
    const totalDeposits = transactionArr
    .filter(transaction => transaction.type ==='deposit')
    .reduce((sum, transaction) => sum+transaction.amount,0);
    
    const totalWithdraws = transactionArr
    .filter(transaction => transaction.type ==='withdraw')
    .reduce((sum, transaction) => sum+transaction.amount,0);

    selectors.totalDepositDisplay.innerText = `Total Deposit: ${formatter.format(totalDeposits)}`;
    selectors.totalWithdrawDisplay.innerText = `Total Withdraw: ${formatter.format(totalWithdraws)}`;
}


export function showError(selectors, error){
    selectors.transactionList.innerHTML = `Error: ${error}. Please try again.`;
    const retryBtn = document.createElement('button');
    retryBtn.innerText = "Retry";
    retryBtn.id = "retry-btn";
    selectors.transactionList.appendChild(retryBtn);

    retryBtn.addEventListener('click', () => {window.location.reload()});
}
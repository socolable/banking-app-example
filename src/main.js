import './style.css';
import {isValid} from './validators.js';
import {renderUI, showLoading, showError, setLoading, showToast} from './ui.js';
import {loadFromVault, saveToVault} from './storage.js';
import { getExchangeRate } from './api.js';

// --- 1. SELECTORS ---
const balanceDisplay = document.querySelector('#balance-display');
const amountInput = document.querySelector('#amount-input');
const depositBtn = document.querySelector('#deposit-btn');
const withdrawBtn = document.querySelector('#withdraw-btn');
const clearAllBtn = document.querySelector('#clear-all-btn');
const transactionList = document.querySelector('#transaction-list');
const searchInput = document.querySelector('#search-input');
const totalDepositDisplay = document.querySelector('#total-deposit');
const totalWithdrawDisplay = document.querySelector('#total-withdraw');

const selectors = {balanceDisplay, amountInput, depositBtn, withdrawBtn, clearAllBtn, transactionList, searchInput, totalDepositDisplay, totalWithdrawDisplay};

// --- 2. DATA STATE (The "Source of Truth") ---
let currentBalance;
let transactionHistory;
let usdToEurRate;
let usdToGBPRate;
let isLoading = true;

showLoading(selectors);

async function initApp(){
      setLoading(isLoading, selectors);
    try{
        const savedData = await loadFromVault();
        currentBalance = savedData.balance;
        transactionHistory = savedData.history;
        
        updateApp();
        
        [usdToEurRate, usdToGBPRate] = await Promise.all([
            getExchangeRate("USD", "EUR"),
            getExchangeRate("USD", "GBP")
        ]);
        
        updateApp();

    }
    catch(e){
        showError(selectors, e);
    }
    finally{
      isLoading = false;
      setLoading(isLoading, selectors);
    }
}
initApp();

function updateApp(dataToShow = transactionHistory){
    saveToVault(currentBalance, transactionHistory);
    renderUI(currentBalance, dataToShow, selectors, usdToEurRate, usdToGBPRate);
}


// --- 5. EVENT LISTENERS ---

depositBtn.addEventListener('click', (e) => {
    const rawValue = amountInput.value;
    const button = e.currentTarget;
    const originalText = button.textContent;
    
    if (!isValid(rawValue)) return;

    // disable Deposit button after clicking to avoid double-click
    button.disabled = true;
    button.textContent = "processing...";
    
    const amount = Number(rawValue);
    
    currentBalance += amount;
    transactionHistory.push({id: Date.now(), amount, type: 'deposit'});
    showToast();
    updateApp();

    // enable Deposit button 1 second after clicking
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;  
    }, 600);
});

withdrawBtn.addEventListener('click', (e) => {
    const rawValue = amountInput.value;

    if (!isValid(rawValue)) return;
    
    const button = e.currentTarget;
    const originalText = button.textContent;

    // disable Withdraw button after clicking to avoid double click
    button.disabled = true;
    button.textContent = "processing...";

    const amount = Number(rawValue);
    
    if (amount > currentBalance) {
        alert("Insufficient funds!");
        return;
    }

    currentBalance -= amount;
    transactionHistory.push({id: Date.now(), amount, type: 'withdraw'});
    updateApp();

    // enable Withdraw button 1s after clicking
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 600);
});

clearAllBtn.addEventListener('click', () => {
    if(window.confirm("Clear all?")){
        transactionHistory.splice(0, transactionHistory.length);
        currentBalance = 0;
        
        updateApp();
    }

});

searchInput.addEventListener('input', () => {
    if(searchInput.value.length === 0){
       updateApp();
       return
    }
    
    const filteredTransactions = transactionHistory.filter(transaction => String(transaction.amount).includes(searchInput.value));
    updateApp(filteredTransactions);
});

transactionList.addEventListener('click', (e) => {
    if(e.target.classList.contains('delete-btn')){
        const idToDelete = Number(e.target.getAttribute('data-id'));
        
        
        const itemToDelete = transactionHistory.find(transaction => transaction.id === idToDelete);
        
        // If cannot find the itemToDelete for some reason, stop
        if (!itemToDelete) return;
        
        if (itemToDelete.type === 'deposit'){
            currentBalance -= itemToDelete.amount;
        }
        else {
            currentBalance += itemToDelete.amount;
        }
        
        transactionHistory = transactionHistory.filter(transaction => transaction.id !== idToDelete);
        
        updateApp();
    }
    
});

import { showToast } from "./ui";

const baseURL = import.meta.env.VITE_API_URL;

export async function getExchangeRate(fromCurr, toCurr){
    
    const fromCurrency = fromCurr.toLowerCase();
    const toCurrency = toCurr.toLowerCase();

    const url = `${baseURL}/${fromCurrency}.json`;

    const FALLBACK_RATES = {
        "usd-eur": 1.0869,
        "usd-gbp": 1.3157
    };
   
    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();        
        return data[fromCurrency][toCurrency];
    }
     catch(e){
        console.error("Error: ", e);
        
        showToast("Problem fetching rates. Using fallback rates.");
        
        const pairKey = `${fromCurrency}-${toCurrency}`;
        console.log("What is this:");
        console.log(FALLBACK_RATES[pairKey]);
        return FALLBACK_RATES[pairKey] || 1;
     }   
}
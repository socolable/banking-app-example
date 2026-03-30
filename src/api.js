const baseURL = import.meta.env.VITE_API_URL;

export async function getExchangeRate(fromCurr, toCurr){
    
    const fromCurrency = fromCurr.toLowerCase();
    const toCurrency = toCurr.toLowerCase();

    const url = `${baseURL}/${fromCurrency}.json`;
   
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
        return null;
     }   
}
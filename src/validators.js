export function isValid(rawValue) {
    const trimmedValue = rawValue.trim();
    const num = Number(rawValue);

    // Check if empty or not a number
    if (trimmedValue === "" || isNaN(num)) {
        alert("Please enter a numeric value.");
        return false;
    }

    // Check that value is positve greater than 0
    if (num <= 0) {
        alert("Please enter a number greater than 0.");
        return false;
    }

    // Check that input should have max 2 decimal points
    if (trimmedValue.includes('.') && trimmedValue.split('.')[1].length >2){
        alert("Please enter maximum 2 decimal digits.");
        return false;
    }

    // Check that input does not include scientific notion
    if (trimmedValue.toLowerCase().includes('e')){
        alert("Please enter only numeral digits.");
        return false;
    }

    // Check if input is unreasonably large (sanity check) - input should not be greater than 10 mil
    if (num >= 10000000){
        alert("Transaction exceeds limit. Please enter an amount below 10 million.");
        return false;
    }


    return true;
}
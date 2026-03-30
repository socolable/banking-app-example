export function isValid(rawValue) {
    if (rawValue.trim() === "" || isNaN(Number(rawValue))) {
        alert("Please enter a numeric value.");
        return false;
    }
    if (Number(rawValue) <= 0) {
        alert("Please enter a number greater than 0.");
        return false;
    }
    return true;
}
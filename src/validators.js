import { APP_CONFIG } from "./config.js";

export function isValid(rawValue) {
  const trimmedValue = rawValue.trim();
  const num = Number(rawValue);

  // Check if empty or not a number
  if (trimmedValue === "" || isNaN(num) || !Number.isFinite(num)) {
    alert("Please enter a numeric value.");
    return false;
  }

  // Check that value is positve greater than 0
  if (num <= 0) {
    alert("Please enter a number greater than 0.");
    return false;
  }

  // Check that input should have max 2 decimal points
  if (
    trimmedValue.includes(".") &&
    trimmedValue.split(".")[1].length > APP_CONFIG.DECIMAL_PLACES
  ) {
    alert(`Please enter maximum ${APP_CONFIG.DECIMAL_PLACES} decimal digits.`);
    return false;
  }

  // Check that input does not include scientific notion or symbols
  const cleanNumericRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  if (!cleanNumericRegex.test(trimmedValue)) {
    alert("Please enter only numeral digits.");
    return false;
  }

  // Check if input is unreasonably large (sanity check) - input should not be greater than 10 mil
  if (num >= APP_CONFIG.MAX_TRANSACTION_LIMIT) {
    alert(
      `Transaction exceeds limit. Please enter an amount below ${APP_CONFIG.MAX_TRANSACTION_LIMIT}.`,
    );
    return false;
  }

  return true;
}

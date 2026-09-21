export const CURRENCY = "USD";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});
const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
const MAX_MINOR_UNITS = 2_147_483_647;

// Prices are stored as integers in the currency's smallest unit (cents for USD).
export function formatPrice(minorUnits: number) {
  return formatter.format(minorUnits / 10 ** fractionDigits);
}

export function priceInputValue(minorUnits: number) {
  return (minorUnits / 10 ** fractionDigits).toFixed(fractionDigits);
}

export function parsePrice(input: string) {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const minorUnits = Math.round(value * 10 ** fractionDigits);
  return minorUnits <= MAX_MINOR_UNITS ? minorUnits : null;
}

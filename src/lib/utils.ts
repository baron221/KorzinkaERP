/**
 * Formats a number as a currency string with thousands separators.
 * Example: 1000000 -> "1 000 000 so'm"
 */
export const fmtAmount = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return "0 so'm";
  const val = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(val)) return "0 so'm";
  
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(val)) + " so'm";
};

/**
 * Formats weights. If >= 1000kg, converts to tons.
 * Example: 500 -> "500 kg", 1500 -> "1.5 t"
 */
export const fmtWeight = (kg: number | string | null | undefined): string => {
  if (kg === null || kg === undefined) return "0 kg";
  const val = typeof kg === "string" ? parseFloat(kg) : kg;
  if (isNaN(val)) return "0 kg";

  if (val >= 1000) {
    const tons = val / 1000;
    return (Number.isInteger(tons) ? tons.toString() : tons.toFixed(2)) + " t";
  }
  return val + " kg";
};

/**
 * Helper for input preview (live formatting as user types)
 */
export const parseNumber = (s: string): number => {
  const n = parseFloat(s.replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
};

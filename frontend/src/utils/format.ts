/**
 * Format a long UUID or ID into a clean, readable short ID.
 * Examples:
 * - formatShortId("82fe4ff6-164d-4c6e-a3f3-830ea202c26e", "CUST") => "CUST-82FE4FF6"
 * - formatShortId("ord_id-127f2288-b642-430b-80cd-f92455b886b6", "ORD") => "ORD-127F2288"
 * - formatShortId("2cf30358-fd08-41a7-8d9c-f41588eb8dc9", "INV") => "INV-2CF30358"
 * - formatShortId("42929872-1bf6-49f4-b1a6-3361e7832e80", "PRD") => "PRD-42929872"
 * - formatShortId("APP001", "APP") => "APP001"
 */
export function formatShortId(id: string | null | undefined, prefix = ''): string {
  if (!id) return '';
  const str = String(id).trim();

  // If already cleanly formatted like CUST-001, INV-123456, ORD-123456, APP001, V001
  if (/^[A-Z]{2,6}-\d{1,8}$/i.test(str) || /^[A-Z]{1,6}\d{3,6}$/i.test(str)) {
    return str.toUpperCase();
  }

  // Remove prefixes like ord_id-, cust_id-, etc.
  const cleaned = str
    .replace(/^(ord_id-|order_id-|bill_id-|cust_id-|prod_id-|emp_id-)/i, '')
    .replace(/-/g, '');

  const shortPart = cleaned.slice(0, 8).toUpperCase();
  return prefix ? `${prefix}-${shortPart}` : `#${shortPart}`;
}

/**
 * Format a number/currency strictly to 2 decimal places with Indian locale grouping.
 * Examples:
 * - formatCurrency(20730.239999999998) => "20,730.24"
 * - formatCurrency(241.5) => "241.50"
 * - formatCurrency(0) => "0.00"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Convert a number into Indian currency words matching Surat invoice standard:
 * Examples:
 * - numberToWords(233267) => "Two Lakh Thirty Three Thousand Two Hundred Sixty Seven Only"
 * - numberToWords(11107.98) => "Eleven Thousand One Hundred Seven And Ninety Eight Paise Only"
 */
export function numberToWords(amount: number | string | null | undefined, includeRupees = false): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0));
  if (isNaN(num) || num === 0) return "Zero Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  function convertChunk(n: number): string {
    let str = "";
    if (n >= 10000000) {
      str += convertChunk(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convertChunk(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += convertChunk(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n >= 100) {
      str += convertChunk(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) str += a[n] + " ";
      else str += b[Math.floor(n / 10)] + " " + a[n % 10] + " ";
    }
    return str.trim();
  }

  let words = convertChunk(integerPart);
  if (includeRupees) words += " Rupees";
  if (decimalPart > 0) {
    words += " And " + convertChunk(decimalPart) + " Paise";
  }
  return (words + " Only").replace(/\s+/g, " ");
}

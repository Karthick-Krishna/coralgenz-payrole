import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees or specified currency
 * Example: 75000 -> ₹75,000.00
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: string = "INR",
  symbol: string = "₹"
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol}0.00`;
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formatted}`;
}

export function formatINR(amount: number | undefined | null): string {
  return formatCurrency(amount, "INR", "₹");
}

/**
 * Format standard readable dates
 */
export function formatDate(
  dateInput: string | Date | undefined | null,
  dateFormat: string = "dd MMM yyyy"
): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return typeof dateInput === "string" ? dateInput : "—";
    return format(d, dateFormat);
  } catch {
    return typeof dateInput === "string" ? dateInput : "—";
  }
}

export function formatTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return typeof dateInput === "string" ? dateInput : "—";
    return format(d, "hh:mm a");
  } catch {
    return "—";
  }
}

export function formatMonthYear(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return "—";
    return format(d, "MMMM yyyy");
  } catch {
    return "—";
  }
}

/**
 * Mask Bank Account Number for sensitive display
 * e.g., "123456789012" -> "•••• •••• 9012"
 */
export function maskAccountNumber(accNum: string | undefined | null): string {
  if (!accNum) return "•••• •••• ••••";
  const clean = accNum.replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

/**
 * Convert numeric amount to words in Indian numbering system
 * Example: 75000 -> "Rupees Seventy-Five Thousand Only"
 */
export function numberToWordsIndian(num: number): string {
  if (num === 0) return "Rupees Zero Only";
  if (isNaN(num)) return "";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    let str = "";
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : " ");
    } else {
      str += a[n];
    }
    return str;
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let output = "";

  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const hundred = Math.floor((integerPart % 1000) / 100);
  const rest = integerPart % 100;

  if (crore > 0) output += inWords(crore) + "Crore ";
  if (lakh > 0) output += inWords(lakh) + "Lakh ";
  if (thousand > 0) output += inWords(thousand) + "Thousand ";
  if (hundred > 0) output += inWords(hundred) + "Hundred ";
  if (rest > 0) {
    if (output !== "") output += "and ";
    output += inWords(rest);
  }

  let finalWords = `Rupees ${output.trim()}`;
  if (decimalPart > 0) {
    finalWords += ` and ${inWords(decimalPart).trim()} Paise`;
  }
  return `${finalWords} Only`;
}

/**
 * Generate Avatar Fallback Initials
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return "CG";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

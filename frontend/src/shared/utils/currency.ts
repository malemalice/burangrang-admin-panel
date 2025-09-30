/**
 * Currency formatting utilities
 * Centralized currency handling for the application
 */

export const DEFAULT_CURRENCY = 'IDR';
export const CURRENCY_SYMBOL = 'Rp';
export const CURRENCY_LOCALE = 'id-ID';

/**
 * Format a number as currency with Indonesian Rupiah formatting
 * @param amount - The amount to format
 * @param currency - The currency code (defaults to IDR)
 * @param showSymbol - Whether to show the currency symbol (defaults to true)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  showSymbol: boolean = true
): string => {
  if (amount === null || amount === undefined) {
    return showSymbol ? `${CURRENCY_SYMBOL} 0` : '0';
  }

  const numAmount = typeof amount === 'number' ? amount : Number(amount);
  
  if (isNaN(numAmount)) {
    return showSymbol ? `${CURRENCY_SYMBOL} 0` : '0';
  }

  // Format with Indonesian locale for proper number formatting
  const formatted = numAmount.toLocaleString(CURRENCY_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return showSymbol ? `${CURRENCY_SYMBOL} ${formatted}` : formatted;
};

/**
 * Format currency for display in tables and cards
 * @param amount - The amount to format
 * @param currency - The currency code (defaults to IDR)
 * @returns Formatted currency string for display
 */
export const formatCurrencyDisplay = (
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string => {
  return formatCurrency(amount, currency, true);
};

/**
 * Format currency for input fields (without symbol)
 * @param amount - The amount to format
 * @returns Formatted currency string for input
 */
export const formatCurrencyInput = (
  amount: number | string | null | undefined
): string => {
  return formatCurrency(amount, DEFAULT_CURRENCY, false);
};

/**
 * Parse currency string to number
 * @param currencyString - The currency string to parse
 * @returns Parsed number or 0 if invalid
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove currency symbol and spaces
  const cleaned = currencyString.replace(/[^\d.,-]/g, '');
  
  // Handle Indonesian number format (comma as thousand separator, dot as decimal)
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get currency symbol for a given currency code
 * @param currency - The currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: string = DEFAULT_CURRENCY): string => {
  const symbols: Record<string, string> = {
    'IDR': 'Rp',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
  };
  
  return symbols[currency.toUpperCase()] || CURRENCY_SYMBOL;
};

/**
 * Validate currency amount
 * @param amount - The amount to validate
 * @returns True if valid, false otherwise
 */
export const isValidCurrencyAmount = (amount: number | string | null | undefined): boolean => {
  if (amount === null || amount === undefined) return false;
  
  const numAmount = typeof amount === 'number' ? amount : Number(amount);
  return !isNaN(numAmount) && numAmount >= 0;
};

/**
 * Currency constants for use throughout the application
 */
export const CURRENCY_CONSTANTS = {
  DEFAULT_CURRENCY,
  CURRENCY_SYMBOL,
  CURRENCY_LOCALE,
  SUPPORTED_CURRENCIES: ['IDR', 'USD', 'EUR', 'GBP', 'JPY'],
} as const;

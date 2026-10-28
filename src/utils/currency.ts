/**
 * Currency formatting utility using Intl.NumberFormat with 'en-IN' Indian locale grouping
 * e.g. ₹1,13,490.00
 */
export function formatCurrencyINR(amount: number, currencyCode: string = 'INR', currencySymbol?: string): string {
  const numericAmount = isNaN(amount) ? 0 : amount;

  // If INR or ₹, use standard en-IN currency formatter
  if (currencyCode === 'INR' || currencySymbol === '₹') {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      return `₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  // If another currency is selected in settings (preserving multi-currency support), format with appropriate code/symbol
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    const sym = currencySymbol || '₹';
    return `${sym}${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Pure money/rounding rules for sales and returns. Kept free of DB or express
 * dependencies so it can be unit tested in isolation (see tests/saleTotals.test.js).
 */

/**
 * Normalize a client-supplied money field (tax, discount, balances...)
 * Defaults undefined/null/"" to 0 and validates it as a non-negative finite number.
 *
 * @param {unknown} raw
 * @param {string} label - used in the error message, e.g. "Tax"
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
const normalizeNonNegativeMoney = (raw, label = "Value") => {
  let value = raw;
  if (value === undefined || value === null || value === "") value = 0;
  value = Number(value);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: `${label} must be a non-negative number` };
  }
  return { ok: true, value };
};

/**
 * Compute/validate a sale total given an already-validated subtotal.
 *  total = subtotal + tax - discount   (never negative)
 *
 * @param {number} subtotal - validated non-negative subtotal
 * @param {number} tax      - validated non-negative tax amount
 * @param {number} discount - validated non-negative discount amount
 * @returns {{ ok: true, total: number } | { ok: false, error: string }}
 */
const computeSaleTotal = (subtotal, tax, discount) => {
  const sub = Number(subtotal);
  const taxAmount = Number(tax);
  const discountAmount = Number(discount);

  if (![sub, taxAmount, discountAmount].every(Number.isFinite)) {
    return { ok: false, error: "Sale totals must be finite numbers" };
  }
  if (sub < 0 || taxAmount < 0 || discountAmount < 0) {
    return { ok: false, error: "Sale totals must be non-negative" };
  }
  if (discountAmount > sub) {
    return { ok: false, error: "Discount cannot exceed subtotal" };
  }

  const total = sub + taxAmount - discountAmount;
  // guard against float drift producing a tiny negative total
  if (total < 0) {
    return { ok: false, error: "Sale total cannot be negative" };
  }
  return { ok: true, total };
};

module.exports = {
  normalizeNonNegativeMoney,
  computeSaleTotal,
};

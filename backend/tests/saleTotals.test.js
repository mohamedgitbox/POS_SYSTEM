/* Regression tests for the pure sale money rules (Priority: sale totals). */
const { test } = require("node:test");
const assert = require("node:assert");
const {
  normalizeNonNegativeMoney,
  computeSaleTotal,
} = require("../utils/saleTotals");

test("normalizeNonNegativeMoney defaults missing values to 0", () => {
  for (const raw of [undefined, null, ""]) {
    const result = normalizeNonNegativeMoney(raw, "Tax");
    assert.equal(result.ok, true);
    assert.equal(result.value, 0);
  }
});

test("normalizeNonNegativeMoney accepts valid numbers (number or string)", () => {
  assert.deepEqual(normalizeNonNegativeMoney(12.5, "Tax"), { ok: true, value: 12.5 });
  assert.deepEqual(normalizeNonNegativeMoney("0", "Discount"), { ok: true, value: 0 });
});

test("normalizeNonNegativeMoney rejects negatives, NaN and garbage", () => {
  assert.equal(normalizeNonNegativeMoney(-1, "Tax").ok, false);
  assert.equal(normalizeNonNegativeMoney("abc", "Tax").ok, false);
  assert.equal(normalizeNonNegativeMoney(Number.POSITIVE_INFINITY, "Tax").ok, false);
  assert.equal(normalizeNonNegativeMoney(Number.NaN, "Tax").ok, false);
});

test("computeSaleTotal: total = subtotal + tax - discount", () => {
  const result = computeSaleTotal(100, 14, 0);
  assert.equal(result.ok, true);
  assert.equal(result.total, 114);
});

test("computeSaleTotal rejects discount larger than subtotal", () => {
  const result = computeSaleTotal(100, 10, 200);
  assert.equal(result.ok, false);
  assert.equal(result.error, "Discount cannot exceed subtotal");
});

test("computeSaleTotal rejects a negative grand total", () => {
  // discount applied is bounded by subtotal, so this guards float drift/garbage
  const result = computeSaleTotal(50, 0, 100);
  assert.equal(result.ok, false);
});

test("computeSaleTotal rejects invalid inputs", () => {
  assert.equal(computeSaleTotal("abc", 0, 0).ok, false);
  assert.equal(computeSaleTotal(100, -5, 0).ok, false);
  assert.equal(computeSaleTotal(100, 0, Number.NaN).ok, false);
});

test("computeSaleTotal allows discount equal to subtotal (total = tax part)", () => {
  const result = computeSaleTotal(100, 14, 100);
  assert.equal(result.ok, true);
  assert.equal(result.total, 14);
});

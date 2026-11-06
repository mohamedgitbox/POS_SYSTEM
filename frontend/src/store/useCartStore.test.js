import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, computeCartTotals } from "./useCartStore";
import { useSettingsStore } from "./useSettingsStore";

const resetStores = () => {
  useCartStore.getState().clearCart();
  useSettingsStore.getState().resetSettings();
};

const sampleProduct = (id, price) => ({
  _id: id,
  name: `Product ${id}`,
  price,
  sku: `SKU-${id}`,
  barcode: `BC-${id}`,
});

describe("useCartStore", () => {
  beforeEach(resetStores);

  it("should start with empty cart and zero numeric totals", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.subtotal).toBe(0);
    expect(state.tax).toBe(0);
    expect(state.total).toBe(0);
    expect(state.itemCount).toBe(0);
  });

  it("exposes derived totals as NUMBERS, not functions (POS regression)", () => {
    useCartStore.getState().addItem(sampleProduct("p1", 100), 2);
    const state = useCartStore.getState();
    expect(typeof state.subtotal).toBe("number");
    expect(typeof state.tax).toBe("number");
    expect(typeof state.total).toBe("number");
    expect(typeof state.itemCount).toBe("number");
    // default settings tax rate = 14%
    expect(state.subtotal).toBe(200);
    expect(state.tax).toBe(28);
    expect(state.total).toBe(228);
    expect(state.itemCount).toBe(2);
  });

  it("adds the same product twice by merging quantities", () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct("p1", 10));
    store.addItem(sampleProduct("p1", 10));
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.subtotal).toBe(20);
  });

  it("removeItem and updateQuantity keep totals consistent", () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct("p1", 10));
    store.addItem(sampleProduct("p2", 5), 3);
    expect(useCartStore.getState().itemCount).toBe(4);

    useCartStore.getState().updateQuantity("p1", 5);
    expect(useCartStore.getState().subtotal).toBe(65);
    expect(useCartStore.getState().itemCount).toBe(8);

    useCartStore.getState().removeItem("p2");
    expect(useCartStore.getState().subtotal).toBe(50);
    expect(useCartStore.getState().itemCount).toBe(5);

    // removing the last item zeroes everything
    useCartStore.getState().removeItem("p1");
    expect(useCartStore.getState().total).toBe(0);
  });

  it("uses the configured tax rate from the settings store (tax consistency)", () => {
    useSettingsStore.getState().setSettings({ taxRate: 5 });
    useCartStore.getState().addItem(sampleProduct("p1", 200));
    // 5% of 200 = 10
    expect(useCartStore.getState().tax).toBe(10);
    expect(useCartStore.getState().total).toBe(210);

    useSettingsStore.getState().setSettings({ taxRate: 14 });
    useCartStore.getState().recomputeTotals();
    // 14% of 200 = 28
    expect(useCartStore.getState().tax).toBe(28);
  });

  it("ignores and sanitizes invalid tax rates", () => {
    useSettingsStore.getState().setSettings({ taxRate: "not-a-number" });
    expect(useSettingsStore.getState().taxRate).toBe(14);
    useSettingsStore.getState().setSettings({ taxRate: -3 });
    useSettingsStore.getState().setSettings({ taxRate: 150 });
    expect(useSettingsStore.getState().taxRate).toBe(14);
  });

  it("computeCartTotals round-trips on an arbitrary list", () => {
    const totals = computeCartTotals([
      { ...sampleProduct("a", 10.333), price: 10.333, quantity: 3 },
      { ...sampleProduct("b", 0.99), price: 0.99, quantity: 1 },
    ]);
    // subtotal = 30.999 + 0.99 = 31.989 -> 31.99
    expect(totals.subtotal).toBe(31.99);
    // tax 14% of 31.99 = 4.4786 -> 4.48
    expect(totals.tax).toBeCloseTo(4.48, 2);
    expect(totals.total).toBe(totals.subtotal + totals.tax);
    expect(totals.itemCount).toBe(4);
  });
});

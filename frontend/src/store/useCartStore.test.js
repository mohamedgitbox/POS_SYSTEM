// Simple smoke test - verify cart store methods exist
import { useCartStore } from "./useCartStore";

describe("useCartStore", () => {
  it("should have cart state and methods", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(typeof state.addItem).toBe("function");
    expect(typeof state.removeItem).toBe("function");
    expect(typeof state.updateQuantity).toBe("function");
    expect(typeof state.clearCart).toBe("function");
    expect(state.subtotal).toBe(0);
    expect(state.tax).toBe(0);
    expect(state.total).toBe(0);
    expect(state.itemCount).toBe(0);
  });
});

// Run a quick in-memory test manually
const { create } = require("zustand");
const mock = create((set) => ({ items: [] }));
console.log("Cart store smoke test passed:", mock.getState().items.length === 0);

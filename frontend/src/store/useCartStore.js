import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getTaxRateFraction } from "./useSettingsStore";

const findItemIndex = (items, productId) =>
  items.findIndex((item) => item.productId === productId);

const computeSubtotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// round money to 2 decimals to avoid float drift
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Derive the numeric totals for a list of cart items.
 * Tax rate comes from the general settings store (percentage) so the POS
 * always matches the rate configured in Settings, on screen and in the sale
 * payload sent to the backend.
 */
export const computeCartTotals = (items) => {
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = round2(computeSubtotal(safeItems));
  const tax = round2(subtotal * getTaxRateFraction());
  const total = round2(subtotal + tax);
  const itemCount = safeItems.reduce((sum, item) => sum + item.quantity, 0);
  return { items: safeItems, subtotal, tax, total, itemCount };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      // derived numbers, recomputed on every mutation (`subtotal`, `tax`,
      // `total`, `itemCount` were previously functions, which broke the POS UI)
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = findItemIndex(state.items, product._id);
          let newItems;
          if (existingIndex >= 0) {
            newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
          } else {
            newItems = [
              ...state.items,
              {
                productId: product._id,
                productName: product.name,
                price: product.price,
                sku: product.sku,
                barcode: product.barcode,
                quantity: quantity,
              },
            ];
          }
          return computeCartTotals(newItems);
        });
      },

      removeItem: (productId) => {
        set((state) =>
          computeCartTotals(
            state.items.filter((item) => item.productId !== productId)
          )
        );
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) =>
          computeCartTotals(
            state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            )
          )
        );
      },

      clearCart: () => {
        set(computeCartTotals([]));
      },

      /**
       * Recompute totals from the current tax rate (called after the settings
       * store changes, see Settings.jsx sync effect).
       */
      recomputeTotals: () => {
        set((state) => computeCartTotals(state.items));
      },
    }),
    {
      name: "pos-cart",
      // only persist the items; totals are derived and must be recomputed
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        ...computeCartTotals(persisted?.items ?? current.items),
      }),
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

const TAX_RATE = 0.05;

const findItemIndex = (items, productId) =>
  items.findIndex((item) => item.productId === productId);

const computeSubtotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = findItemIndex(state.items, product._id);
          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product._id,
                productName: product.name,
                price: product.price,
                sku: product.sku,
                barcode: product.barcode,
                quantity: quantity,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => {
          const newItems = state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          );
          return { items: newItems };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      subtotal: () => computeSubtotal(get().items),
      tax: () => computeSubtotal(get().items) * TAX_RATE,
      discount: () => 0,
      total: () => {
        const sub = computeSubtotal(get().items);
        return sub + sub * TAX_RATE;
      },
      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "pos-cart",
    }
  )
);

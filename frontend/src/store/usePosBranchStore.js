import { create } from "zustand";

/**
 * POS working branch.
 * - cashier / branch_manager: fixed to their own branch, resolved server-side;
 *   this store stays null for them.
 * - super_admin: must pick which branch they are selling from; the selected
 *   branch id is sent with the sale and used to scope product stock.
 */
export const usePosBranchStore = create((set) => ({
  branchId: null,
  setBranchId: (branchId) => set({ branchId }),
  clear: () => set({ branchId: null }),
}));

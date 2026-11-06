import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Application-wide general settings.
 *
 * Source of truth is the backend (GET/PUT /api/settings/general); this store
 * holds a persisted local copy so the POS keeps working offline and so the
 * cart tax calculation stays consistent with whatever tax rate the admin set.
 * The Settings page hydrates this store from the backend and falls back to
 * local persistence when the backend is unreachable or unauthorized.
 */

export const DEFAULT_SETTINGS = {
  taxRate: 14, // percentage, e.g. 14 => 14%
  currency: "EGP",
  currencySymbol: "ج.م",
  lowStockAlertThreshold: 10,
  allowNegativeStock: false,
};

const clampNumber = (value, fallback, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) return fallback;
  if (max !== undefined && n > max) return fallback;
  return n;
};

// keep invalid values out of the store (mirrors backend validation)
export const sanitizeSettings = (values = {}) => {
  const next = { ...DEFAULT_SETTINGS };

  if (values.taxRate !== undefined) {
    next.taxRate = clampNumber(values.taxRate, DEFAULT_SETTINGS.taxRate, 0, 100);
  }
  if (values.currency !== undefined && String(values.currency).trim() !== "") {
    next.currency = String(values.currency).trim();
  }
  if (values.currencySymbol !== undefined && String(values.currencySymbol).trim() !== "") {
    next.currencySymbol = String(values.currencySymbol).trim();
  }
  if (values.lowStockAlertThreshold !== undefined) {
    next.lowStockAlertThreshold = clampNumber(
      values.lowStockAlertThreshold,
      DEFAULT_SETTINGS.lowStockAlertThreshold,
      0,
    );
  }
  if (values.allowNegativeStock !== undefined) {
    next.allowNegativeStock = Boolean(values.allowNegativeStock);
  }

  return next;
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      /** Merge (sanitized) settings into the store. */
      setSettings: (values) => set((prev) => ({ ...prev, ...sanitizeSettings(values) })),

      /** Restore factory defaults. */
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "pos-settings",
    }
  )
);

/** Tax rate as a fraction (0.14 for 14%), ready for money math. */
export const getTaxRateFraction = () => {
  const rate = Number(useSettingsStore.getState().taxRate);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return rate / 100;
};

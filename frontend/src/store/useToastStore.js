import { create } from "zustand";

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: crypto.randomUUID(),
          type: "info",
          ...toast,
          duration: toast.duration ?? 4000,
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  success: (message, title) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: crypto.randomUUID(),
          type: "success",
          message,
          title,
          duration: 4000,
        },
      ],
    })),
  error: (message, title) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: crypto.randomUUID(),
          type: "error",
          message,
          title,
          duration: 6000,
        },
      ],
    })),
  warning: (message, title) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: crypto.randomUUID(),
          type: "warning",
          message,
          title,
          duration: 4000,
        },
      ],
    })),
  info: (message, title) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: crypto.randomUUID(),
          type: "info",
          message,
          title,
          duration: 4000,
        },
      ],
    })),
}));

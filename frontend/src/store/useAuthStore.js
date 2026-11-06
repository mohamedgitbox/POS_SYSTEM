import { create } from "zustand";

const USER_KEY = "pos_user";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  initAuth: () => {
    const storedUser = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        set({
          user: JSON.parse(storedUser),
          token,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("token");
      }
    }
  },

  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({
      user,
      token,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem(USER_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  getBranchId: () => {
    return get().user?.branchId || get().user?.branch || null;
  },

  hasRole: (role) => {
    return Boolean(get().user?.role === role);
  },
}));

import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, "")}/api`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
      }
      if (status === 403) {
        const message = error.response.data?.msg || error.response.data?.message || "لديك صلاحية محدودة لهذا الإجراء";
        throw new Error(message);
      }
      if (status >= 400 && status < 500) {
        const message = error.response.data?.msg || error.response.data?.message || `خطأ في الخادم: ${status}`;
        throw new Error(message);
      }
      if (status >= 500) {
        throw new Error("تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة");
      }
    }
    if (!error.response) {
      throw new Error("تعذر الاتصال بالخادم. يرجى التحقق من أن الخادم يعمل وأن VITE_API_BASE_URL مضبوط بشكل صحيح");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

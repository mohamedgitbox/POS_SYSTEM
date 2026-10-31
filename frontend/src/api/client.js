import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach auth token
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

// Response interceptor: handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      // Token expired or invalid - clear auth and redirect to login
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      // Forbidden - inform user
      if (status === 403) {
        const message = error.response.data?.msg || error.response.data?.message || "لديك صلاحية محدودة لهذا الإجراء";
        throw new Error(message);
      }
      // General API errors
      if (status >= 400 && status < 500) {
        const message = error.response.data?.msg || error.response.data?.message || `خطأ في الخادم: ${status}`;
        throw new Error(message);
      }
      // Server errors
      if (status >= 500) {
        throw new Error("تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة");
      }
    }
    // Network errors / no response from server
    if (!error.response) {
      throw new Error("تعذر الاتصال بالخادم. يرجى التحقق من أن الخادم يعمل وأن VITE_API_BASE_URL مضبوط بشكل صحيح");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

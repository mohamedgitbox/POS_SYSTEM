import apiClient from "../api/client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// Create axios instance for direct API calls (with auth interceptor from client.js)
export const api = apiClient;

export { API_BASE_URL };

export default api;

import { loginRequest as _login } from "./apiService";

export async function loginRequest(email, password) {
  try {
    const response = await _login(email, password);
    if (!response || !response.token) {
      throw new Error(response?.msg || "فش
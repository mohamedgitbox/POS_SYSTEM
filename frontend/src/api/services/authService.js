import { loginRequest as _login } from "./apiService";

export async function loginRequest(email, password) {
  try {
    const response = await _login(email, password);
    if (!response || !response.token) {
      throw new Error(response?.msg || "فشلت عملية تسجيل الدخول");
    }
    return response;
  } catch (error) {
    throw new Error(error.message || "حدث خطأ أثناء تسجيل الدخول", { cause: error });
  }
}

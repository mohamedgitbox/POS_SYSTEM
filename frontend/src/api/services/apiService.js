import apiClient from "./client";

export async function loginRequest(email, password) {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
}

export async function dashboardRequest(params) {
  const response = await apiClient.get("/reports/dashboard", { params });
  return response.data;
}

export async function productsListRequest(params) {
  const response = await apiClient.get("/products", { params });
  return response.data;
}

export async function productLookupRequest(barcode, sku, branchId) {
  const params = {};
  if (barcode) params.barcode = barcode;
  if (sku) params.sku = sku;
  if (branchId) params.branchId = branchId;
  const response = await apiClient.get("/products/lookup", { params });
  return response.data;
}

export async function createSaleRequest(data) {
  const response = await apiClient.post("/sales", data);
  return response.data;
}

export async function salesListRequest(params) {
  const response = await apiClient.get("/sales", { params });
  return response.data;
}

export async function inventoryByBranchRequest(branchId) {
  const response = await apiClient.get(`/inventory/${branchId}`);
  return response.data;
}

export async function inventoryHistoryRequest(productId, params) {
  const response = await apiClient.get(`/inventory/${productId}/history`, { params });
  return response.data;
}

export async function lowStockRequest(params) {
  const response = await apiClient.get("/inventory/low-stock", { params });
  return response.data;
}

export async function branchesListRequest() {
  const response = await apiClient.get("/branches");
  return response.data;
}

export async function usersListRequest(params) {
  const response = await apiClient.get("/users", { params });
  return response.data;
}

export async function customersListRequest(params) {
  const response = await apiClient.get("/customers", { params });
  return response.data;
}

export async function purchaseOrdersListRequest(params) {
  const response = await apiClient.get("/purchase-orders", { params });
  return response.data;
}

export async function transfersListRequest(params) {
  const response = await apiClient.get("/transfers", { params });
  return response.data;
}

export async function shiftsActiveRequest(params) {
  const response = await apiClient.get("/shifts/active", { params });
  return response.data;
}

export async function openShiftRequest(data) {
  const response = await apiClient.post("/shifts/open", data);
  return response.data;
}

export async function closeShiftRequest(id, data) {
  const response = await apiClient.post(`/shifts/${id}/close`, data);
  return response.data;
}

export async function shiftSummaryRequest(id) {
  const response = await apiClient.get(`/shifts/${id}/summary`);
  return response.data;
}

export async function returnSaleRequest(id, data) {
  const response = await apiClient.post(`/sales/${id}/return`, data);
  return response.data;
}

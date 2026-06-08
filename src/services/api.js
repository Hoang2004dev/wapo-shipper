// const API_BASE =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:5196";

const API_BASE =
import.meta.env.VITE_API_BASE_URL || "https://fashionwebbe.onrender.com";

async function buildHeaders(options = {}) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    "";

  const headers = { ...(options.headers || {}) };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  headers["ngrok-skip-browser-warning"] = "true";

  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function parseErrorMessage(response) {
  let message = "Network error";
  try {
    const data = await response.json();
    message = data.message || data.error || data.title || data.detail || message;
    if (data.errors) {
      const v = Object.values(data.errors).flat().filter(Boolean).join(" ");
      if (v) message = v;
    }
  } catch (_) {
    try {
      const text = await response.text();
      if (text) message = text;
    } catch (_) {}
  }
  return message;
}

async function apiFetch(url, options = {}) {
  const headers = await buildHeaders(options);
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

export function normalizeStatus(status) {
  return (status || "")
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("_", "")
    .replaceAll("-", "")
    .replaceAll(" ", "");
}

export function formatStatus(status) {
  switch (normalizeStatus(status)) {
    case "pendingpayment":    return "Pending Payment";
    case "processing":        return "Processing"; 
    case "shipping":          return "In Transit"; 
    case "delivered":         return "Delivered";
    case "completed":         return "Completed";
    case "cancelled":         return "Cancelled";
    case "refunding":         return "Refund Requested";
    case "refunded":          return "Refunded";
    case "refundapproved":    return "Refund Approved";
    case "returnapproved":    return "Awaiting Return Pickup";
    case "returnpickedup":    return "Return Item Picked Up";
    case "returnshipping":    return "Return In Transit";
    case "returndelivered":   return "Returned to Seller";
    case "returncompleted":   return "Return Completed";
    default:                  return status || "Unknown";
  }
}

export function statusColor(status) {
  switch (normalizeStatus(status)) {
    case "pendingpayment":  return { bg: "#e8e8e8", text: "#555" };
    case "processing":      return { bg: "#dbeafe", text: "#1d4ed8" };
    case "shipping":        return { bg: "#fff3cd", text: "#92400e" };
    case "delivered":       return { bg: "#ede9fe", text: "#6d28d9" };
    case "completed":       return { bg: "#d1fae5", text: "#065f46" };
    case "cancelled":       return { bg: "#fee2e2", text: "#991b1b" };
    case "refunding":       return { bg: "#fef3c7", text: "#92400e" };
    case "refunded":        return { bg: "#fee2e2", text: "#991b1b" };
    case "returnapproved":    return { bg: "#fce7f3", text: "#9d174d" };
    case "returnpickedup":    return { bg: "#fdf4ff", text: "#7e22ce" };
    case "returnshipping":    return { bg: "#f0abfc", text: "#581c87" };
    case "returndelivered":   return { bg: "#ecfdf5", text: "#064e3b" };
    case "returncompleted":   return { bg: "#d1fae5", text: "#065f46" };
    default:                  return { bg: "#f3f4f6", text: "#6b7280" };
  }
}

export async function getOrder(orderId) {
  return apiFetch(`${API_BASE}/api/orders/${orderId}`);
}

export async function fetchProcessingOrders() {
  return apiFetch(`${API_BASE}/api/orders/paid`);
}

export async function fetchShippingOrders() {
  return apiFetch(`${API_BASE}/api/orders/shipping`);
}

export async function fetchDeliveredOrders() {
  return apiFetch(`${API_BASE}/api/orders/delivered`);
}

export async function fetchCompletedOrders() {
  return apiFetch(`${API_BASE}/api/orders/completed`);
}

export async function fetchCancelledOrders() {
  return apiFetch(`${API_BASE}/api/orders/cancelled`);
}

export async function fetchReturnApprovedOrders() {
  return apiFetch(`${API_BASE}/api/admin/orders/all?status=RETURN_APPROVED&pageSize=50`)
    .then((r) => r?.items || r?.orders || []);
}

export async function fetchReturnPickedUpOrders() {
  return apiFetch(`${API_BASE}/api/admin/orders/all?status=RETURN_PICKED_UP&pageSize=50`)
    .then((r) => r?.items || r?.orders || []);
}

export async function fetchReturnShippingOrders() {
  return apiFetch(`${API_BASE}/api/admin/orders/all?status=RETURN_SHIPPING&pageSize=50`)
    .then((r) => r?.items || r?.orders || []);
}

export async function updateOrderStatus(orderId, status) {
  return apiFetch(
    `${API_BASE}/api/orders/${orderId}/status?status=${encodeURIComponent(status)}`,
    { method: "PUT" }
  );
}

export async function shipperUpdateOrderStatus(orderId, status) {
  return apiFetch(
    `${API_BASE}/api/orders/${orderId}/shipper?status=${encodeURIComponent(status)}`,
    { method: "PUT" }
  );
}

export default {
  getOrder,
  updateOrderStatus,
  shipperUpdateOrderStatus,
  fetchProcessingOrders,
  fetchShippingOrders,
  fetchDeliveredOrders,
  fetchCompletedOrders,
  fetchCancelledOrders,
  fetchReturnApprovedOrders,
  fetchReturnPickedUpOrders,
  fetchReturnShippingOrders,
  normalizeStatus,
  formatStatus,
  statusColor,
};
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
    case "pendingpayment":    return "Chờ thanh toán";
    case "processing":        return "Chờ lấy hàng";
    case "shipping":          return "Đang giao";
    case "delivered":         return "Đã giao";
    case "completed":         return "Hoàn thành";
    case "cancelled":         return "Đã hủy";
    case "refunding":         return "Yêu cầu hoàn";
    case "refunded":          return "Đã hoàn tiền";
    case "refundapproved":    return "Duyệt hoàn";
    case "returnapproved":    return "Chờ lấy hàng hoàn";
    case "returnpickedup":    return "Đã lấy hàng hoàn";
    case "returnshipping":    return "Đang vận chuyển hoàn";
    case "returndelivered":   return "Đã giao lại seller";
    case "returncompleted":   return "Hoàn tất trả hàng";
    default:                  return status || "Không rõ";
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
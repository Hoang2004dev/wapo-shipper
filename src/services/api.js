import { autoLoginAdmin, clearAdminToken, getToken } from "./auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://fashionwebbe.onrender.com";

async function buildHeaders(options = {}) {
  let token = getToken();

  if (!token) {
    token = await autoLoginAdmin();
  }

  const headers = {
    ...(options.headers || {}),
  };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  headers["ngrok-skip-browser-warning"] = "true";

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseErrorMessage(response) {
  let message = "Network error";

  try {
    const data = await response.json();

    message =
      data.message ||
      data.error ||
      data.title ||
      data.detail ||
      message;

    if (data.errors) {
      const validationMessages = Object.values(data.errors)
        .flat()
        .filter(Boolean)
        .join(" ");

      if (validationMessages) {
        message = validationMessages;
      }
    }
  } catch (_) {
    try {
      const text = await response.text();

      if (text) {
        message = text;
      }
    } catch (_) {
      message = "Network error";
    }
  }

  return message;
}

async function apiFetch(url, options = {}, retry = true) {
  const headers = await buildHeaders(options);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry) {
    clearAdminToken();
    await autoLoginAdmin();

    return apiFetch(url, options, false);
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

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
    case "pendingpayment":
      return "Pending Payment";
    case "processing":
      return "Processing";
    case "shipping":
      return "Shipping";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refunding":
      return "Refunding";
    case "refunded":
      return "Refunded";
    default:
      return status || "Unknown";
  }
}

export async function getOrder(orderId) {
  return apiFetch(`${API_BASE}/api/orders/${orderId}`);
}

export async function updateOrderStatus(orderId, status) {
  return apiFetch(
    `${API_BASE}/api/orders/${orderId}/status?status=${encodeURIComponent(
      status,
    )}`,
    {
      method: "PUT",
    },
  );
}

export async function shipperUpdateOrderStatus(orderId, status) {
  return apiFetch(
    `${API_BASE}/api/orders/${orderId}/shipper?status=${encodeURIComponent(
      status,
    )}`,
    {
      method: "PUT",
    },
  );
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

export default {
  getOrder,
  updateOrderStatus,
  shipperUpdateOrderStatus,
  fetchProcessingOrders,
  fetchShippingOrders,
  fetchDeliveredOrders,
  fetchCompletedOrders,
  fetchCancelledOrders,
  normalizeStatus,
  formatStatus,
};
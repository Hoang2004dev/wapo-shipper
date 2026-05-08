const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://fashionwebbe.onrender.com";

const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "admin@fashion.com";

const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "Aa@123";

function saveToken(token) {
  if (!token) return;

  localStorage.setItem("token", token);
  localStorage.setItem("accessToken", token);
}

function getSavedToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  );
}

function extractToken(result) {
  if (!result) return null;

  const data = result.data || result.result || result;

  return (
    data.token ||
    data.accessToken ||
    data.access_token ||
    data.jwtToken ||
    result.token ||
    result.accessToken ||
    result.access_token ||
    result.jwtToken ||
    null
  );
}

async function parseErrorMessage(response) {
  let message = "Auto login admin failed.";

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
      message = "Auto login admin failed.";
    }
  }

  return message;
}

export function getToken() {
  return getSavedToken();
}

export function clearAdminToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("accessToken");
}

export function getAuthHeader() {
  const token = getSavedToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function loginAdmin(email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const result = await response.json();
  const token = extractToken(result);

  if (!token) {
    throw new Error("Admin login succeeded but access token was not found.");
  }

  saveToken(token);

  return token;
}

export async function autoLoginAdmin() {
  const existingToken = getSavedToken();

  if (existingToken) {
    return existingToken;
  }

  return loginAdmin();
}

export default {
  getToken,
  getAuthHeader,
  loginAdmin,
  autoLoginAdmin,
  clearAdminToken,
};
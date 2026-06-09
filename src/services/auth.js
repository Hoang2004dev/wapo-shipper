const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://fashionwebbe.onrender.com";

const ADMIN_EMAIL = "admin@fashion.com";

const ADMIN_PASSWORD = "Aa@123";

function saveToken(token) {
  if (!token) {
    console.error("[AUTH] saveToken failed: Token provided is empty or undefined!");
    return;
  }

  console.log(`[AUTH] Saving token to Storage (Length: ${token.length} characters)`);
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
  console.log("[AUTH] Raw data received from Login API:", result);
  if (!result) return null;

  const data = result.data || result.result || result;

  const token = (
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

  console.log(`[AUTH] Extracted Token result:`, token);
  return token;
}

async function parseErrorMessage(response) {
  let message = "Auto login admin failed.";

  try {
    const data = await response.json();
    console.error("[AUTH] API returned error (JSON):", data);

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
      console.error("[AUTH] API returned error (Text):", text);

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
  console.log("[AUTH] Clearing all tokens from Storage...");
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("accessToken");
}

export function getAuthHeader() {
  const token = getSavedToken();

  if (!token) {
    console.warn("[AUTH] getAuthHeader called but no token found in Storage!");
    return {};
  }

  if (token === "undefined" || token === "null") {
    console.error(`[AUTH] Critical Error: Token in Storage is saved as a literal string "${token}"!`);
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function loginAdmin(email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  console.log(`[AUTH] Initiating Admin login request to: ${API_BASE}/api/auth/login`);
  console.log(`[AUTH] Email used: ${email}`);

  try {
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

    console.log(`[AUTH] Response Status from API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      console.error(`[AUTH] Login failed (HTTP ${response.status}): ${message}`);
      throw new Error(message);
    }

    const result = await response.json();
    const token = extractToken(result);

    if (!token) {
      console.error("[AUTH] Login succeeded but the response payload structure does not contain a valid token!");
      throw new Error("Admin login succeeded but access token was not found.");
    }

    saveToken(token);
    console.log("[AUTH] ADMIN LOGIN SUCCESSFUL AND TOKEN STORED!");

    return token;
  } catch (error) {
    console.error("[AUTH] Error occurred during loginAdmin execution:", error.message);
    throw error;
  }
}

export async function autoLoginAdmin() {
  console.log("[AUTH] Checking Auto Login status...");
  const existingToken = getSavedToken();

  if (existingToken) {
    if (existingToken === "undefined" || existingToken === "null") {
      console.warn(`[AUTH] Detected corrupted token "${existingToken}" in Storage. Clearing and re-authenticating.`);
      clearAdminToken();
    } else {
      console.log("[AUTH] Valid existing token found. Skipping Login API call.");
      return existingToken;
    }
  }

  console.log("[AUTH] No existing token or corrupted token found. Proceeding to invoke loginAdmin().");
  return loginAdmin();
}

export default {
  getToken,
  getAuthHeader,
  loginAdmin,
  autoLoginAdmin,
  clearAdminToken,
};
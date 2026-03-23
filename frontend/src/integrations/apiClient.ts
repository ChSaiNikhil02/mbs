// C:\Users\SOWMYA\OneDrive\Desktop\modern_digital_banking\frontend\src\integrations\apiClient.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const DEFAULT_TIMEOUT = 10000; // 10 seconds

interface RequestOptions extends RequestInit {
  token?: string;
  data?: any;
  timeout?: number;
}

export class ApiError extends Error {
  status: number;
  detail: any;
  type: "validation" | "server" | "auth" | "network" | "timeout";

  constructor(message: string, status: number, detail: any, type: ApiError["type"]) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.type = type;
  }
}

async function apiClient<T>(
  endpoint: string,
  { data, token, timeout = DEFAULT_TIMEOUT, headers: customHeaders, ...customConfig }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const config: RequestInit = {
    method: data ? (customConfig.method || "POST") : (customConfig.method || "GET"),
    body: data ? JSON.stringify(data) : undefined,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    },
    ...customConfig,
  };

  try {
    const response = await window.fetch(`${API_BASE_URL}/${endpoint}`, config);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("bank:unauthorized"));
      throw new ApiError("Session expired. Please log in again.", 401, null, "auth");
    }

    const responseData = await response.json().catch(() => ({}));

    if (response.ok) {
      return responseData;
    }

    // Classify errors
    if (response.status >= 400 && response.status < 500) {
      throw new ApiError(
        responseData.detail || "Invalid request parameters.",
        response.status,
        responseData,
        "validation"
      );
    } else {
      throw new ApiError(
        "A server error occurred. Please try again later.",
        response.status,
        responseData,
        "server"
      );
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new ApiError("Request timed out. Please check your connection.", 0, null, "timeout");
    }
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      "Network error. Please check your internet connection.",
      0,
      null,
      "network"
    );
  }
}

export { apiClient };

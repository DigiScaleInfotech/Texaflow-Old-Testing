const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api";

interface RequestOptions extends RequestInit {
  data?: any;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add token from localStorage if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let body: BodyInit | undefined = undefined;

  if (options.data !== undefined) {
    if (options.data instanceof FormData) {
      body = options.data;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.data);
    }
  } else if (options.body) {
    body = options.body;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
    credentials: "include", // Ensures cookies like access_token/refresh_token are sent
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === "object" && (data.message || data.error)) ||
      `HTTP Error ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

// In-memory cache for instant client-side data delivery
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CLIENT_CACHE_TTL = 30 * 1000; // 30 seconds

export const api = {
  get: async <T = any>(
    endpoint: string,
    options?: RequestOptions & { skipCache?: boolean }
  ): Promise<T> => {
    const cacheKey = endpoint;
    const now = Date.now();
    if (!options?.skipCache && clientCache.has(cacheKey)) {
      const entry = clientCache.get(cacheKey)!;
      if (now - entry.timestamp < CLIENT_CACHE_TTL) {
        return entry.data as T;
      }
    }
    const res = await request<T>(endpoint, { ...options, method: "GET" });
    clientCache.set(cacheKey, { data: res, timestamp: now });
    return res;
  },

  post: async <T = any>(endpoint: string, data?: any, options?: RequestOptions) => {
    clientCache.clear();
    return request<T>(endpoint, { ...options, method: "POST", data });
  },

  put: async <T = any>(endpoint: string, data?: any, options?: RequestOptions) => {
    clientCache.clear();
    return request<T>(endpoint, { ...options, method: "PUT", data });
  },

  patch: async <T = any>(endpoint: string, data?: any, options?: RequestOptions) => {
    clientCache.clear();
    return request<T>(endpoint, { ...options, method: "PATCH", data });
  },

  delete: async <T = any>(endpoint: string, options?: RequestOptions) => {
    clientCache.clear();
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },

  clearCache: () => clientCache.clear(),
};

export { ApiError, API_BASE_URL };

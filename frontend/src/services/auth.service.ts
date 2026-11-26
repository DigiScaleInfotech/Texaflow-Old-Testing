import { api } from "./api";

export interface LoginParams {
  emailOrUsername: string;
  password: string;
  userType?: "admin" | "vendor";
  rememberMe?: boolean;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    username: string;
    role: string;
    organizationRole?: string;
    organization?: {
      id: string;
      name: string;
      status: string;
    };
  };
  accessToken?: string;
  refreshToken?: string;
  organizationStatus?: string;
  subscription?: any;
}

export const authService = {
  login: async (params: LoginParams): Promise<LoginResponse> => {
    const data = await api.post<LoginResponse>("/auth/login", params);
    
    // Store in localStorage for frontend state management
    if (typeof window !== "undefined") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userType", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
      }
    }
    
    return data;
  },

  getCurrentUser: async () => {
    return api.get("/auth/me");
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Logout API error:", e);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userType");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  },

  refreshToken: async () => {
    return api.post("/auth/refresh-token");
  },

  registerVendor: async (data: any) => {
    return api.post("/auth/register/vendor", data);
  },
};

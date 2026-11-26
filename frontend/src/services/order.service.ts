import { api } from "./api";

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const orderService = {
  getOrders: async (params?: OrderQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/orders${queryString ? `?${queryString}` : ""}`);
  },

  getOrderById: async (id: string) => {
    return api.get(`/orders/${id}`);
  },

  createOrder: async (orderData: any) => {
    return api.post("/orders", orderData);
  },

  updateOrder: async (id: string, orderData: any) => {
    return api.put(`/orders/${id}`, orderData);
  },

  deleteOrder: async (id: string) => {
    return api.delete(`/orders/${id}`);
  },

  updateStatus: async (id: string, status: string) => {
    return api.patch(`/orders/${id}/status`, { status });
  },

  getOrderAnalytics: async () => {
    return api.get("/orders/analytics/dashboard");
  },
};

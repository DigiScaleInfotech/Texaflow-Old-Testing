import { api } from "./api";

export const dashboardService = {
  getOverview: async () => {
    return api.get("/dashboard/overview");
  },

  getSummary: async () => {
    return api.get("/dashboard/summary");
  },

  getSalesData: async (period?: string) => {
    return api.get(`/dashboard/sales${period ? `?period=${period}` : ""}`);
  },

  getOrdersData: async () => {
    return api.get("/dashboard/orders");
  },

  getInventoryData: async () => {
    return api.get("/dashboard/inventory");
  },

  getTopCustomers: async (limit?: number) => {
    return api.get(`/dashboard/top-customers${limit ? `?limit=${limit}` : ""}`);
  },

  getProductPerformance: async () => {
    return api.get("/dashboard/product-performance");
  },

  getYearlyRevenue: async () => {
    return api.get("/dashboard/yearly-revenue");
  },
};

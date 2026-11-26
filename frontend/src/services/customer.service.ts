import { api } from "./api";

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const customerService = {
  getCustomers: async (params?: CustomerQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/customers${queryString ? `?${queryString}` : ""}`);
  },

  getCustomerById: async (id: string) => {
    return api.get(`/customers/${id}`);
  },

  createCustomer: async (customerData: any) => {
    return api.post("/customers", customerData);
  },

  updateCustomer: async (id: string, customerData: any) => {
    return api.put(`/customers/${id}`, customerData);
  },

  deleteCustomer: async (id: string) => {
    return api.delete(`/customers/${id}`);
  },

  getCustomerStats: async () => {
    return api.get("/customers/stats/overview");
  },
};

import { api } from "./api";

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
  sortBy?: string;
  order?: "ASC" | "DESC";
}

export const inventoryService = {
  getInventory: async (params?: InventoryQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/inventory${queryString ? `?${queryString}` : ""}`);
  },

  getProducts: async (params?: InventoryQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/inventory${queryString ? `?${queryString}` : ""}`);
  },

  getStats: async () => {
    return api.get("/inventory/stats");
  },

  getProductById: async (id: string) => {
    return api.get(`/inventory/${id}`);
  },

  createProduct: async (productData: any) => {
    return api.post("/inventory", productData);
  },

  updateProduct: async (id: string, productData: any) => {
    return api.put(`/inventory/${id}`, productData);
  },

  deleteProduct: async (id: string) => {
    return api.delete(`/inventory/${id}`);
  },

  updateStock: async (id: string, quantity: number, notes?: string) => {
    return api.patch(`/inventory/${id}/stock`, { quantity, notes });
  },

  getProductTransactions: async (id: string) => {
    return api.get(`/inventory/${id}/transactions`);
  },
};

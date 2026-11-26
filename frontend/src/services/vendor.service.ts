import { api } from "./api";

export interface VendorQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const vendorService = {
  getVendors: async (params?: VendorQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/vendors${queryString ? `?${queryString}` : ""}`);
  },

  getVendorById: async (id: string) => {
    return api.get(`/vendors/${id}`);
  },

  updateVendor: async (id: string, data: any) => {
    return api.put(`/vendors/${id}`, data);
  },

  deleteVendor: async (id: string) => {
    return api.delete(`/vendors/${id}`);
  },

  approveVendor: async (id: string, notes?: string) => {
    return api.post(`/vendors/${id}/approve`, { status: "approved", adminNotes: notes });
  },

  rejectVendor: async (id: string, notes?: string) => {
    return api.post(`/vendors/${id}/reject`, { status: "rejected", adminNotes: notes });
  },

  // Applications
  getApplications: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/vendor-applications${queryString ? `?${queryString}` : ""}`);
  },

  getApplicationById: async (id: string) => {
    return api.get(`/vendor-applications/${id}`);
  },

  updateApplicationStatus: async (id: string, status: string, adminNotes?: string) => {
    return api.put(`/vendor-applications/${id}/status`, { status, notes: adminNotes, adminNotes });
  },
};

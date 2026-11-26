import { api } from "./api";

export interface BillQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: "sales" | "purchase";
  documentType?: "invoice" | "challan";
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}

export const billingService = {
  getBills: async (params?: BillQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/bills${queryString ? `?${queryString}` : ""}`);
  },

  getSummary: async () => {
    return api.get("/bills/summary");
  },

  getBillById: async (id: string) => {
    return api.get(`/bills/${id}`);
  },

  createBill: async (billData: any) => {
    return api.post("/bills", billData);
  },

  updateBill: async (id: string, billData: any) => {
    return api.put(`/bills/${id}`, billData);
  },

  deleteBill: async (id: string) => {
    return api.delete(`/bills/${id}`);
  },

  recordPayment: async (id: string, paymentData: any) => {
    return api.post(`/bills/${id}/payment`, paymentData);
  },

  recordCustomerPayment: async (paymentData: any) => {
    return api.post("/bills/customer-payment", paymentData);
  },

  updateStatus: async (id: string, status: string) => {
    return api.patch(`/bills/${id}/status`, { status });
  },

  getReceivables: async () => {
    return api.get("/bills/receivables");
  },

  getPayables: async () => {
    return api.get("/bills/payables");
  },

  convertChallanToInvoice: async (id: string, taxRate?: number) => {
    return api.post(`/bills/${id}/convert-to-invoice`, { taxRate });
  },

  bulkConvertChallansToInvoice: async (challanIds: string[], taxRate?: number) => {
    return api.post("/bills/bulk-convert-to-invoice", { challanIds, taxRate });
  },
};

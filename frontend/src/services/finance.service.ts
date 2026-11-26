import { api } from "./api";

export interface PaymentItem {
  id: string;
  paymentNumber: string;
  type: "in" | "out";
  partyType: "customer" | "vendor";
  partyId?: string;
  partyName: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  referenceNumber?: string;
  billId?: string;
  billNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  expenseNumber: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  paymentMode: string;
  paymentStatus?: "Paid" | "Pending";
  paidTo?: string;
  referenceNumber?: string;
  notes?: string;
  receiptUrl?: string;
  employeeId?: string;
  createdAt: string;
}

export interface LedgerEntry {
  date: string;
  type: "invoice" | "payment" | "opening";
  voucherNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerResponse {
  party: {
    id: string;
    name: string;
    type: string;
    phone?: string;
    email?: string;
  };
  summary: {
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
  };
  statement: LedgerEntry[];
}

export interface OutstandingParty {
  partyId: string;
  partyName: string;
  partyType: "customer" | "vendor";
  phone?: string;
  email?: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  billCount: number;
  oldestDueDate?: string;
  dueDate?: string;
  dueDays?: number;
  dueStatus?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalPayouts: number;
  totalExpenses: number;
  netCashFlow: number;
  totalReceivables: number;
  totalPayables: number;
}

export const financeService = {
  getSummary: async (startDate?: string, endDate?: string): Promise<FinanceSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const qs = params.toString();
    const res: any = await api.get(`/finance/summary${qs ? `?${qs}` : ""}`);
    return res?.data ?? res;
  },

  getPayments: async (params?: {
    type?: string;
    partyId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ payments: PaymentItem[]; summary: { totalIn: number; totalOut: number; netFlow: number } }> => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.append(k, String(v));
      });
    }
    const qs = q.toString();
    const res: any = await api.get(`/finance/payments${qs ? `?${qs}` : ""}`);
    return res?.data ?? res;
  },

  createPayment: async (data: {
    type: "in" | "out";
    partyType: "customer" | "vendor";
    partyId?: string;
    partyName: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    referenceNumber?: string;
    billId?: string;
    billNumber?: string;
    notes?: string;
  }): Promise<PaymentItem> => {
    const res: any = await api.post("/finance/payments", data);
    return res?.data ?? res;
  },

  deletePayment: async (id: string): Promise<void> => {
    await api.delete(`/finance/payments/${id}`);
  },

  getExpenses: async (params?: {
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ expenses: ExpenseItem[]; summary: { totalExpenses: number; categoryBreakdown: Record<string, number> } }> => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.append(k, String(v));
      });
    }
    const qs = q.toString();
    const res: any = await api.get(`/finance/expenses${qs ? `?${qs}` : ""}`);
    return res?.data ?? res;
  },

  createExpense: async (data: {
    title?: string;
    category: string;
    amount: number;
    expenseDate: string;
    paymentMode: string;
    paymentStatus?: "Paid" | "Pending";
    paidTo?: string;
    referenceNumber?: string;
    notes?: string;
    receiptUrl?: string;
    employeeId?: string;
  }): Promise<ExpenseItem> => {
    const res: any = await api.post("/finance/expenses", data);
    return res?.data ?? res;
  },

  getExpenseById: async (id: string): Promise<ExpenseItem> => {
    const res: any = await api.get(`/finance/expenses/${id}`);
    return res?.expense ?? res?.data ?? res;
  },

  updateExpense: async (
    id: string,
    data: {
      title?: string;
      category?: string;
      amount?: number;
      expenseDate?: string;
      paymentMode?: string;
      paymentStatus?: "Paid" | "Pending";
      paidTo?: string;
      referenceNumber?: string;
      notes?: string;
      receiptUrl?: string;
      employeeId?: string;
    }
  ): Promise<ExpenseItem> => {
    const res: any = await api.put(`/finance/expenses/${id}`, data);
    return res?.expense ?? res?.data ?? res;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/finance/expenses/${id}`);
  },

  getPartyLedger: async (params: {
    partyType: "customer" | "vendor";
    partyId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LedgerResponse> => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.append(k, String(v));
    });
    const res: any = await api.get(`/finance/ledger?${q.toString()}`);
    return res?.data ?? res;
  },

  getOutstandingReport: async (): Promise<{
    receivables: OutstandingParty[];
    payables: OutstandingParty[];
    summary: { totalReceivables: number; totalPayables: number };
  }> => {
    const res: any = await api.get("/finance/outstanding");
    return res?.data ?? res;
  },
};

import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Payment, PaymentType } from "../entities/payment.entity";
import { Expense } from "../entities/expense.entity";
import { Bill, BillType } from "../entities/bill.entity";
import { Customer } from "../entities/customer.entity";
import { Employee } from "../entities/employee.entity";
import { SalaryPayment } from "../entities/salary-payment.entity";
import { PaymentStatus } from "../interface/bill";

interface CustomRequest extends Request {
  user?: any;
}

export class FinanceController {
  /**
   * Helper to generate sequential Payment ID e.g. PAY-001
   */
  static async generateNextPaymentNumber(organizationId: string): Promise<string> {
    const paymentRepo = getRepository(Payment);
    const existing = await paymentRepo
      .createQueryBuilder("p")
      .select(["p.paymentNumber"])
      .where("p.organizationId = :organizationId", { organizationId })
      .getMany();

    let maxNum = 0;
    for (const item of existing) {
      if (item.paymentNumber) {
        const match = item.paymentNumber.match(/PAY-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    }
    return `PAY-${String(maxNum + 1).padStart(3, "0")}`;
  }

  /**
   * Helper to generate sequential Expense ID e.g. EXP-001
   */
  static async generateNextExpenseNumber(organizationId: string): Promise<string> {
    const expenseRepo = getRepository(Expense);
    const existing = await expenseRepo
      .createQueryBuilder("e")
      .select(["e.expenseNumber"])
      .where("e.organizationId = :organizationId", { organizationId })
      .getMany();

    let maxNum = 0;
    for (const item of existing) {
      if (item.expenseNumber) {
        const match = item.expenseNumber.match(/EXP-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    }
    return `EXP-${String(maxNum + 1).padStart(3, "0")}`;
  }

  // ==================== PAYMENTS ====================

  static async getPayments(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }

      const { type, partyId, startDate, endDate, search } = req.query;
      const paymentRepo = getRepository(Payment);

      let qb = paymentRepo
        .createQueryBuilder("payment")
        .where("payment.organizationId = :organizationId", { organizationId });

      if (type) {
        qb = qb.andWhere("payment.type = :type", { type });
      }
      if (partyId) {
        qb = qb.andWhere("payment.partyId = :partyId", { partyId });
      }
      if (startDate) {
        qb = qb.andWhere("payment.paymentDate >= :startDate", {
          startDate: new Date(String(startDate)),
        });
      }
      if (endDate) {
        const end = new Date(String(endDate));
        end.setDate(end.getDate() + 1);
        qb = qb.andWhere("payment.paymentDate < :endDate", { endDate: end });
      }
      if (search) {
        qb = qb.andWhere(
          "(payment.partyName ILIKE :search OR payment.paymentNumber ILIKE :search OR payment.referenceNumber ILIKE :search OR payment.notes ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      const payments = await qb.orderBy("payment.paymentDate", "DESC").getMany();
      res.json({ payments });
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Error fetching payments" });
    }
  }

  static async createPayment(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const userId = req.user?.id;
      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }

      const {
        type,
        partyType,
        partyId,
        partyName,
        amount,
        paymentDate,
        paymentMode,
        referenceNumber,
        billId,
        billNumber,
        notes,
      } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        res.status(400).json({ message: "Valid payment amount is required" });
        return;
      }
      if (!partyName) {
        res.status(400).json({ message: "Party name is required" });
        return;
      }

      const paymentRepo = getRepository(Payment);
      const paymentNumber = await FinanceController.generateNextPaymentNumber(organizationId);

      const payment = paymentRepo.create({
        paymentNumber,
        type: type || PaymentType.PAYMENT_IN,
        partyType: partyType || "Customer",
        partyId: partyId || null,
        partyName: partyName.trim(),
        amount: parseFloat(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMode: paymentMode || "Cash",
        referenceNumber: referenceNumber ? referenceNumber.trim() : null,
        billId: billId || null,
        billNumber: billNumber ? billNumber.trim() : null,
        notes: notes ? notes.trim() : null,
        organizationId,
        createdById: userId,
      });

      await paymentRepo.save(payment);

      // If linked to a specific bill, update the bill's amountPaid and paymentStatus
      if (billId) {
        try {
          const billRepo = getRepository(Bill);
          const bill = await billRepo.findOne({
            where: { id: billId, organizationId },
          });

          if (bill) {
            const currentPaid = parseFloat(String(bill.amountPaid || 0));
            const newPaid = currentPaid + parseFloat(amount);
            const total = parseFloat(String(bill.total || 0));
            const remaining = Math.max(0, total - newPaid);

            bill.amountPaid = newPaid;
            bill.amountRemaining = remaining;
            if (remaining <= 0) {
              bill.paymentStatus = PaymentStatus.PAID;
            } else if (newPaid > 0) {
              bill.paymentStatus = PaymentStatus.PARTIALLY_PAID;
            }
            await billRepo.save(bill);
          }
        } catch (billUpdateErr) {
          console.warn("Could not auto-update linked bill:", billUpdateErr);
        }
      }

      res.status(201).json({ message: "Payment recorded successfully", payment });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: error?.message || "Error creating payment" });
    }
  }

  static async deletePayment(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      const paymentRepo = getRepository(Payment);
      const payment = await paymentRepo.findOne({
        where: { id, organizationId },
      });

      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      // Revert bill payment if linked
      if (payment.billId) {
        try {
          const billRepo = getRepository(Bill);
          const bill = await billRepo.findOne({
            where: { id: payment.billId, organizationId },
          });
          if (bill) {
            const currentPaid = parseFloat(String(bill.amountPaid || 0));
            const newPaid = Math.max(0, currentPaid - parseFloat(String(payment.amount)));
            const total = parseFloat(String(bill.total || 0));
            const remaining = Math.max(0, total - newPaid);

            bill.amountPaid = newPaid;
            bill.amountRemaining = remaining;
            if (remaining <= 0) {
              bill.paymentStatus = PaymentStatus.PAID;
            } else if (newPaid > 0) {
              bill.paymentStatus = PaymentStatus.PARTIALLY_PAID;
            } else {
              bill.paymentStatus = PaymentStatus.UNPAID;
            }
            await billRepo.save(bill);
          }
        } catch (e) {
          console.warn("Could not revert bill payment:", e);
        }
      }

      await paymentRepo.remove(payment);
      res.json({ message: "Payment deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Error deleting payment" });
    }
  }

  // ==================== EXPENSES ====================

  static async getExpenses(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }

      const { category, startDate, endDate, search } = req.query;
      const expenseRepo = getRepository(Expense);

      let qb = expenseRepo
        .createQueryBuilder("expense")
        .where("expense.organizationId = :organizationId", { organizationId });

      if (category && category !== "All") {
        qb = qb.andWhere("expense.category = :category", { category });
      }
      if (startDate) {
        qb = qb.andWhere("expense.expenseDate >= :startDate", {
          startDate: new Date(String(startDate)),
        });
      }
      if (endDate) {
        const end = new Date(String(endDate));
        end.setDate(end.getDate() + 1);
        qb = qb.andWhere("expense.expenseDate < :endDate", { endDate: end });
      }
      if (search) {
        qb = qb.andWhere(
          "(expense.title ILIKE :search OR expense.paidTo ILIKE :search OR expense.expenseNumber ILIKE :search OR expense.notes ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      const expenses = await qb.orderBy("expense.expenseDate", "DESC").getMany();
      res.json({ expenses });
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Error fetching expenses" });
    }
  }

  static async createExpense(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const userId = req.user?.id;
      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }

      const {
        title,
        category,
        amount,
        expenseDate,
        paymentMode,
        paidTo,
        referenceNumber,
        notes,
        paymentStatus,
        receiptUrl,
        employeeId,
      } = req.body;

      const finalTitle = (title && title.trim()) || (category && category.trim()) || "Expense";

      if (!amount || parseFloat(amount) <= 0) {
        res.status(400).json({ message: "Valid expense amount is required" });
        return;
      }

      const expenseRepo = getRepository(Expense);
      const expenseNumber = await FinanceController.generateNextExpenseNumber(organizationId);

      const expense = expenseRepo.create({
        expenseNumber,
        title: finalTitle,
        category: category || "Misc",
        amount: parseFloat(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        paymentMode: paymentMode || "Cash",
        paymentStatus: paymentStatus || "Paid",
        paidTo: paidTo ? paidTo.trim() : null,
        referenceNumber: referenceNumber ? referenceNumber.trim() : null,
        notes: notes ? notes.trim() : null,
        receiptUrl: receiptUrl ? receiptUrl.trim() : null,
        organizationId,
        createdById: userId,
        employeeId: employeeId || null,
      });

      await expenseRepo.save(expense);

      // AUTOMATION: Link with Karigar / Employee Salary & Upad
      if (employeeId) {
        const parsedAmt = parseFloat(amount);
        const employeeRepo = getRepository(Employee);
        const employee = await employeeRepo.findOne({
          where: { id: employeeId, organizationId },
        });

        if (employee) {
          if (category === "Worker Advance / Upad") {
            employee.advanceBalance = Number(employee.advanceBalance || 0) + parsedAmt;
            await employeeRepo.save(employee);
          } else if (category === "Karigar Salary") {
            try {
              const salaryRepo = getRepository(SalaryPayment);
              const payment = salaryRepo.create({
                employeeId,
                date: expenseDate ? new Date(expenseDate) : new Date(),
                amount: parsedAmt,
                bonus: 0,
                deduction: 0,
                message: `Salary paid via Expense ${expenseNumber}${notes ? `: ${notes}` : ""}`,
                organizationId,
                createdById: userId,
              });
              await salaryRepo.save(payment);

              employee.paidSalary = parsedAmt;
              employee.lastPaymentDate = expenseDate ? new Date(expenseDate) : new Date();
              await employeeRepo.save(employee);
            } catch (salErr) {
              console.warn("Salary payment record warning:", salErr);
            }
          }
        }
      }

      res.status(201).json({ message: "Expense recorded successfully", expense });
    } catch (error: any) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: error?.message || "Error creating expense" });
    }
  }

  static async getExpenseById(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      const expenseRepo = getRepository(Expense);
      const expense = await expenseRepo.findOne({
        where: { id, organizationId },
      });

      if (!expense) {
        res.status(404).json({ message: "Expense not found" });
        return;
      }

      res.json({ expense });
    } catch (error: any) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Error fetching expense" });
    }
  }

  static async updateExpense(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      const expenseRepo = getRepository(Expense);
      const expense = await expenseRepo.findOne({
        where: { id, organizationId },
      });

      if (!expense) {
        res.status(404).json({ message: "Expense not found" });
        return;
      }

      const {
        title,
        category,
        amount,
        expenseDate,
        paymentMode,
        paidTo,
        referenceNumber,
        notes,
        paymentStatus,
        receiptUrl,
        employeeId,
      } = req.body;

      const oldCategory = expense.category;
      const oldAmount = Number(expense.amount);
      const oldEmployeeId = expense.employeeId;

      if (category !== undefined) expense.category = category;
      if (title !== undefined) {
        expense.title = title || expense.category;
      } else if (category !== undefined) {
        expense.title = category;
      }
      if (amount !== undefined) expense.amount = parseFloat(amount);
      if (expenseDate !== undefined) expense.expenseDate = new Date(expenseDate);
      if (paymentMode !== undefined) expense.paymentMode = paymentMode;
      if (paidTo !== undefined) expense.paidTo = paidTo ? paidTo.trim() : null;
      if (referenceNumber !== undefined) expense.referenceNumber = referenceNumber ? referenceNumber.trim() : null;
      if (notes !== undefined) expense.notes = notes ? notes.trim() : null;
      if (paymentStatus !== undefined) expense.paymentStatus = paymentStatus;
      if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl ? receiptUrl.trim() : null;
      if (employeeId !== undefined) expense.employeeId = employeeId || null;

      await expenseRepo.save(expense);

      // Re-adjust advance balance if Upad or employee changed
      const employeeRepo = getRepository(Employee);
      if (oldCategory === "Worker Advance / Upad" && oldEmployeeId) {
        const oldEmp = await employeeRepo.findOne({ where: { id: oldEmployeeId, organizationId } });
        if (oldEmp) {
          oldEmp.advanceBalance = Math.max(0, Number(oldEmp.advanceBalance || 0) - oldAmount);
          await employeeRepo.save(oldEmp);
        }
      }
      if (expense.category === "Worker Advance / Upad" && expense.employeeId) {
        const newEmp = await employeeRepo.findOne({ where: { id: expense.employeeId, organizationId } });
        if (newEmp) {
          newEmp.advanceBalance = Number(newEmp.advanceBalance || 0) + Number(expense.amount);
          await employeeRepo.save(newEmp);
        }
      }

      res.json({ message: "Expense updated successfully", expense });
    } catch (error: any) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: error?.message || "Error updating expense" });
    }
  }

  static async deleteExpense(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const { id } = req.params;

      const expenseRepo = getRepository(Expense);
      const expense = await expenseRepo.findOne({
        where: { id, organizationId },
      });

      if (!expense) {
        res.status(404).json({ message: "Expense not found" });
        return;
      }

      if (expense.category === "Worker Advance / Upad" && expense.employeeId) {
        const employeeRepo = getRepository(Employee);
        const emp = await employeeRepo.findOne({ where: { id: expense.employeeId, organizationId } });
        if (emp) {
          emp.advanceBalance = Math.max(0, Number(emp.advanceBalance || 0) - Number(expense.amount));
          await employeeRepo.save(emp);
        }
      }

      await expenseRepo.remove(expense);
      res.json({ message: "Expense deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Error deleting expense" });
    }
  }

  // ==================== PARTY LEDGER (STATEMENT) ====================

  static async getPartyLedger(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const { partyId, partyType, startDate, endDate } = req.query;

      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }
      if (!partyId) {
        res.status(400).json({ message: "partyId is required" });
        return;
      }

      const isCustomer = partyType !== "Vendor";

      // 1. Fetch Party Profile
      let partyProfile: any = null;
      let openingBalance = 0;

      const customerRepo = getRepository(Customer);
      partyProfile = await customerRepo.findOne({
        where: { id: String(partyId), organizationId },
      });
      if (partyProfile) {
        openingBalance = parseFloat(String(partyProfile?.openingBalance || 0));
      }

      // 2. Fetch Bills (Debits for customers, Credits for vendors)
      const billRepo = getRepository(Bill);
      const bills = await billRepo
        .createQueryBuilder("b")
        .where("b.organizationId = :organizationId", { organizationId })
        .andWhere(
          partyProfile?.name
            ? "(b.customerId = :partyId OR b.customerName ILIKE :partyName)"
            : "b.customerId = :partyId",
          { partyId: String(partyId), partyName: `%${partyProfile?.name}%` }
        )
        .orderBy("b.issueDate", "ASC")
        .getMany();

      // 3. Fetch Payments (Credits for customer payment in, Debits for refunds)
      const paymentRepo = getRepository(Payment);
      const payments = await paymentRepo
        .createQueryBuilder("p")
        .where("p.organizationId = :organizationId", { organizationId })
        .andWhere(
          partyProfile?.name
            ? "(p.partyId = :partyId OR p.partyName ILIKE :partyName)"
            : "p.partyId = :partyId",
          { partyId: String(partyId), partyName: `%${partyProfile?.name}%` }
        )
        .orderBy("p.paymentDate", "ASC")
        .getMany();

      // 4. Combine into chronological entries
      interface LedgerEntry {
        id: string;
        date: Date;
        createdAt: Date;
        voucherNo: string;
        referenceNumber: string;
        type: string; // "invoice", "payment", "opening"
        documentType?: string;
        description: string;
        debit: number;
        credit: number;
        balance: number;
      }

      const entries: LedgerEntry[] = [];

      // Map bills
      bills.forEach((b) => {
        // Skip challan if already converted to tax invoice to avoid double-charging
        if (b.documentType === "challan" && b.convertedInvoiceId) {
          return;
        }

        const billTotal = parseFloat(String(b.total || 0));
        const isPurchase = b.billType === "purchase";
        const voucherNo = b.invoiceId || b.billNumber || (b.challanNo ? `CH-${b.challanNo}` : "INV");

        entries.push({
          id: b.id,
          date: new Date(b.issueDate || b.createdAt),
          createdAt: new Date(b.createdAt || b.issueDate || new Date()),
          voucherNo: voucherNo,
          referenceNumber: voucherNo,
          type: "invoice",
          documentType: b.documentType || (isPurchase ? "purchase_bill" : "invoice"),
          description:
            b.documentType === "challan"
              ? `Delivery Challan (${b.challanNo || ""}) - ${b.paymentStatus || "UNPAID"}`
              : `${isPurchase ? "Purchase Bill" : "Sales Invoice"} (${b.paymentStatus || "UNPAID"})`,
          debit: isPurchase ? 0 : billTotal,
          credit: isPurchase ? billTotal : 0,
          balance: 0, // will compute after sort
        });
      });

      // Map payments
      payments.forEach((p) => {
        const amt = parseFloat(String(p.amount || 0));
        const rawType = String(p.type || "").toLowerCase().replace(/[\s_-]/g, "");
        const isPaymentIn = rawType === "in" || rawType === "paymentin" || p.type === PaymentType.PAYMENT_IN;
        const voucherNo = p.paymentNumber || p.referenceNumber || "PAY";

        let paymentDesc = "Bank Transfer";
        const mode = (p.paymentMode || "").toUpperCase();
        if (mode.includes("BANK") || mode.includes("NEFT") || mode.includes("RTGS") || mode.includes("IMPS")) {
          paymentDesc = "Bank Transfer";
        } else if (mode.includes("CASH")) {
          paymentDesc = "Cash";
        } else if (mode.includes("UPI")) {
          paymentDesc = "UPI";
        } else if (mode.includes("CHEQUE") || mode.includes("CHECK")) {
          paymentDesc = "Cheque";
        } else if (p.paymentMode) {
          paymentDesc = p.paymentMode;
        }

        entries.push({
          id: p.id,
          date: new Date(p.paymentDate || p.createdAt),
          createdAt: new Date(p.createdAt || p.paymentDate || new Date()),
          voucherNo: voucherNo,
          referenceNumber: voucherNo,
          type: "payment",
          documentType: "payment",
          description: paymentDesc,
          debit: isPaymentIn ? 0 : amt,
          credit: isPaymentIn ? amt : 0,
          balance: 0,
        });
      });

      // Sort chronological to compute the progressive running balance accurately:
      // Compare calendar date first. If on the same date, order strictly by createdAt.
      entries.sort((a, b) => {
        const dateA = new Date(a.date).toISOString().slice(0, 10);
        const dateB = new Date(b.date).toISOString().slice(0, 10);
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // Date range filtering with accurate progressive opening balance calculation
      let effectiveOpeningBalance = openingBalance;
      let activeEntries = entries;

      if (startDate || endDate) {
        const start = startDate ? new Date(String(startDate) + "T00:00:00") : null;
        const end = endDate ? new Date(String(endDate) + "T23:59:59.999") : null;

        activeEntries = [];
        for (const e of entries) {
          const eDate = new Date(e.date);
          if (start && eDate < start) {
            effectiveOpeningBalance += e.debit - e.credit;
          } else if (end && eDate > end) {
            // Beyond end date, skip for this statement window
          } else {
            activeEntries.push(e);
          }
        }
      }

      // Calculate running balance for the statement window
      let currentBal = effectiveOpeningBalance;
      let totalDebit = effectiveOpeningBalance;
      let totalCredit = 0;

      const computedEntries = activeEntries.map((e) => {
        currentBal += e.debit - e.credit;
        totalDebit += e.debit;
        totalCredit += e.credit;
        return {
          ...e,
          debit: Number(e.debit.toFixed(2)),
          credit: Number(e.credit.toFixed(2)),
          balance: Number(currentBal.toFixed(2)),
        };
      });

      // Opening balance row always stays first at the very top (pela j revu joiye)
      const openingRow: LedgerEntry = {
        id: "opening",
        date: startDate ? new Date(String(startDate)) : (partyProfile?.createdAt || new Date()),
        createdAt: new Date(0),
        voucherNo: "OPN-001",
        referenceNumber: "OPN-001",
        type: "opening",
        documentType: "opening",
        description: startDate ? "Starting Balance (Prior Period)" : "Opening Balance",
        debit: Number(effectiveOpeningBalance.toFixed(2)),
        credit: 0,
        balance: Number(effectiveOpeningBalance.toFixed(2)),
      };

      // New transactions appear at the top, older records below
      const newestTransactions = [...computedEntries].reverse();
      const ledgerStatement = [openingRow, ...newestTransactions];

      res.json({
        party: partyProfile
          ? {
              id: partyProfile.id,
              cus_id: partyProfile.cus_id,
              name: partyProfile.name || partyProfile.displayName,
              phone: partyProfile.mobile || partyProfile.phone,
              email: partyProfile.email,
              gstNumber: partyProfile.gstNumber,
              address: partyProfile.address,
              type: isCustomer ? "customer" : "vendor",
            }
          : null,
        openingBalance: Number(openingBalance.toFixed(2)),
        totalDebit: Number(totalDebit.toFixed(2)),
        totalCredit: Number(totalCredit.toFixed(2)),
        closingBalance: Number(currentBal.toFixed(2)),
        summary: {
          totalDebit: Number(totalDebit.toFixed(2)),
          totalCredit: Number(totalCredit.toFixed(2)),
          closingBalance: Number(currentBal.toFixed(2)),
        },
        entries: ledgerStatement,
        statement: ledgerStatement,
      });
    } catch (error: any) {
      console.error("Error generating party ledger:", error);
      res.status(500).json({ message: "Error generating ledger" });
    }
  }

  // ==================== OUTSTANDING & SUMMARY ====================

  static async getOutstandingReport(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }

      const billRepo = getRepository(Bill);

      // 1. Receivables & Payables: Unpaid / Pending bills & challans (exclude already converted challans)
      const unpaidBills = await billRepo
        .createQueryBuilder("b")
        .where("b.organizationId = :organizationId", { organizationId })
        .andWhere("b.paymentStatus != :paidStatus", { paidStatus: PaymentStatus.PAID })
        .andWhere("(b.convertedInvoiceId IS NULL)")
        .orderBy("b.issueDate", "ASC")
        .getMany();

      // Group by customer (Receivables) and vendor (Payables)
      const receivablesMap = new Map<string, any>();
      const payablesMap = new Map<string, any>();

      unpaidBills.forEach((b) => {
        const isPurchase = b.billType === "purchase" || b.billType === BillType.PURCHASE;
        const targetMap = isPurchase ? payablesMap : receivablesMap;
        const partyName = b.customerName || (isPurchase ? "Vendor" : "Customer");
        const key = b.customerId || partyName;
        const rawRemaining =
          b.amountRemaining !== null && b.amountRemaining !== undefined && parseFloat(String(b.amountRemaining)) > 0
            ? parseFloat(String(b.amountRemaining))
            : parseFloat(String(b.total || 0));
        const due = parseFloat(rawRemaining.toFixed(2));
        if (due <= 0) return;

        const totalAmount = parseFloat(String(b.total || due));
        const paidAmount = totalAmount > due ? totalAmount - due : 0;
        const billDueDate = b.dueDate || (b.issueDate ? new Date(new Date(b.issueDate).getTime() + 30 * 24 * 60 * 60 * 1000) : null);
        const now = new Date();
        const diffDays = billDueDate ? Math.ceil((new Date(billDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

        if (!targetMap.has(key)) {
          targetMap.set(key, {
            partyId: b.customerId || key,
            partyName,
            partyType: isPurchase ? "vendor" : "customer",
            phone: b.customerPhone || "—",
            unpaidBillsCount: 1,
            billCount: 1,
            totalInvoiced: totalAmount,
            totalPaid: paidAmount,
            totalOutstanding: due,
            outstandingBalance: due,
            oldestBillDate: b.issueDate || b.createdAt,
            dueDate: billDueDate,
            dueDays: diffDays,
            dueStatus: diffDays !== null ? (diffDays < 0 ? `Overdue by ${Math.abs(diffDays)}d` : diffDays === 0 ? "Due Today" : `Due in ${diffDays}d`) : null,
            bills: [
              {
                id: b.id,
                billNumber: b.billNumber || b.invoiceId || b.challanNo,
                date: b.issueDate,
                dueDate: billDueDate,
                total: totalAmount,
                remaining: due,
              },
            ],
          });
        } else {
          const item = targetMap.get(key);
          item.unpaidBillsCount += 1;
          item.billCount += 1;
          item.totalInvoiced += totalAmount;
          item.totalPaid += paidAmount;
          item.totalOutstanding += due;
          item.outstandingBalance += due;
          if (billDueDate && (!item.dueDate || new Date(billDueDate) < new Date(item.dueDate))) {
            item.dueDate = billDueDate;
            item.dueDays = diffDays;
            item.dueStatus = diffDays !== null ? (diffDays < 0 ? `Overdue by ${Math.abs(diffDays)}d` : diffDays === 0 ? "Due Today" : `Due in ${diffDays}d`) : null;
          }
          item.bills.push({
            id: b.id,
            billNumber: b.billNumber || b.invoiceId || b.challanNo,
            date: b.issueDate,
            dueDate: billDueDate,
            total: totalAmount,
            remaining: due,
          });
        }
      });

      const receivables = Array.from(receivablesMap.values()).sort(
        (a, b) => b.outstandingBalance - a.outstandingBalance
      );
      const payables = Array.from(payablesMap.values()).sort(
        (a, b) => b.outstandingBalance - a.outstandingBalance
      );

      const totalReceivables = Number(receivables.reduce((sum, r) => sum + r.outstandingBalance, 0).toFixed(2));
      const totalPayables = Number(payables.reduce((sum, p) => sum + p.outstandingBalance, 0).toFixed(2));

      res.json({
        totalReceivables,
        totalPayables,
        receivables,
        payables,
        summary: { totalReceivables, totalPayables },
      });
    } catch (error: any) {
      console.error("Error generating outstanding report:", error);
      res.status(500).json({ message: "Error generating outstanding report" });
    }
  }

  static async getFinanceSummary(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      if (!organizationId) {
        res.status(403).json({ message: "Organization not found" });
        return;
      }

      const paymentRepo = getRepository(Payment);
      const expenseRepo = getRepository(Expense);
      const billRepo = getRepository(Bill);

      // Total Payments In
      const paymentsInResult = await paymentRepo
        .createQueryBuilder("p")
        .select("SUM(p.amount)", "sum")
        .where("p.organizationId = :organizationId", { organizationId })
        .andWhere("p.type = :type", { type: PaymentType.PAYMENT_IN })
        .getRawOne();
      const totalPaymentIn = parseFloat(paymentsInResult?.sum || "0");

      // Total Payments Out
      const paymentsOutResult = await paymentRepo
        .createQueryBuilder("p")
        .select("SUM(p.amount)", "sum")
        .where("p.organizationId = :organizationId", { organizationId })
        .andWhere("p.type = :type", { type: PaymentType.PAYMENT_OUT })
        .getRawOne();
      const totalPaymentOut = parseFloat(paymentsOutResult?.sum || "0");

      // Total Expenses
      const expenseResult = await expenseRepo
        .createQueryBuilder("e")
        .select("SUM(e.amount)", "sum")
        .where("e.organizationId = :organizationId", { organizationId })
        .getRawOne();
      const totalExpenses = parseFloat(expenseResult?.sum || "0");

      // Outstanding Receivables (Sales)
      const receivablesResult = await billRepo
        .createQueryBuilder("b")
        .select(
          "SUM(CASE WHEN b.amountRemaining IS NOT NULL AND b.amountRemaining > 0 THEN b.amountRemaining ELSE b.total END)",
          "sum"
        )
        .where("b.organizationId = :organizationId", { organizationId })
        .andWhere("b.paymentStatus != :status", { status: PaymentStatus.PAID })
        .andWhere("b.billType != :type", { type: BillType.PURCHASE })
        .andWhere("(b.convertedInvoiceId IS NULL)")
        .getRawOne();
      const totalReceivables = Number(parseFloat(receivablesResult?.sum || "0").toFixed(2));

      // Outstanding Payables (Purchases)
      const payablesResult = await billRepo
        .createQueryBuilder("b")
        .select(
          "SUM(CASE WHEN b.amountRemaining IS NOT NULL AND b.amountRemaining > 0 THEN b.amountRemaining ELSE b.total END)",
          "sum"
        )
        .where("b.organizationId = :organizationId", { organizationId })
        .andWhere("b.paymentStatus != :status", { status: PaymentStatus.PAID })
        .andWhere("b.billType = :type", { type: BillType.PURCHASE })
        .andWhere("(b.convertedInvoiceId IS NULL)")
        .getRawOne();
      const totalPayables = Number(parseFloat(payablesResult?.sum || "0").toFixed(2));

      res.json({
        totalPaymentIn,
        totalPaymentOut,
        totalExpenses,
        netCashFlow: totalPaymentIn - totalPaymentOut - totalExpenses,
        totalReceivables,
        totalPayables,
      });
    } catch (error: any) {
      console.error("Error fetching finance summary:", error);
      res.status(500).json({ message: "Error fetching finance summary" });
    }
  }
}

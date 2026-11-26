import { Router } from "express";
import { BillController } from "../controllers/bill.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// GET routes
router.get("/", BillController.getBills);
router.get("/summary", BillController.getBillingSummary);
router.get("/receivables", BillController.getReceivables);
router.get("/payables", BillController.getPayables);
router.get("/:id", BillController.getBillById);

// POST routes
router.post("/", BillController.createBill);
router.post("/bulk-import", BillController.bulkImportBills);
router.post("/customer-payment", BillController.recordCustomerPayment);
router.post("/bulk-convert-to-invoice", BillController.bulkConvertChallansToInvoice);
router.post("/:id/payment", BillController.recordPayment); // Add route for recording payments
router.post("/:id/convert-to-invoice", BillController.convertChallanToInvoice);

// PUT routes
router.put("/:id", BillController.updateBill);

// PATCH routes
router.patch("/:id/status", BillController.updateBillStatus);

// DELETE routes
router.delete("/:id", BillController.deleteBill);

// Add PDF download route
router.get("/:id/pdf", BillController.downloadBillPDF);

// Fix the route path to make it clearer this is for orders
router.get("/order/:orderId/pdf", BillController.downloadBillPDFByOrderId);

// get bill by order id
router.get("/order/:orderId", BillController.getBillByOrderId);



export default router;

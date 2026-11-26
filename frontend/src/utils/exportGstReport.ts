import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface GstInvoiceRow {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  gstin: string;
  state: string;
  placeOfSupply: string;
  isB2B: boolean;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  invoiceValue: number;
  items: Array<{
    description?: string;
    hsnCode?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
}

export interface HsnSummaryRow {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface GstReportData {
  periodLabel: string;
  companyName: string;
  companyGstin: string;
  b2bInvoices: GstInvoiceRow[];
  b2cInvoices: GstInvoiceRow[];
  hsnSummary: HsnSummaryRow[];
  totals: {
    totalTaxable: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    totalInvoiceValue: number;
    b2bCount: number;
    b2cCount: number;
  };
}

/**
 * Generate CA-Ready GSTR-1 Multi-Sheet Excel (.xlsx)
 */
export function exportGstr1Excel(data: GstReportData) {
  const wb = XLSX.utils.book_new();

  // 1. B2B Sheet (Govt Offline / CA format)
  const b2bRows = data.b2bInvoices.map((inv) => ({
    "GSTIN/UIN of Recipient": inv.gstin || "URP",
    "Receiver Name": inv.customerName,
    "Invoice Number": inv.invoiceNo,
    "Invoice date": inv.invoiceDate,
    "Invoice Value": Number(inv.invoiceValue.toFixed(2)),
    "Place Of Supply": inv.placeOfSupply || "24-Gujarat",
    "Reverse Charge": "N",
    "Applicable % of Tax Rate": inv.gstRate || 5,
    "Invoice Type": "Regular",
    "E-Commerce GSTIN": "",
    "Rate": `${inv.gstRate || 5}%`,
    "Taxable Value": Number(inv.taxableValue.toFixed(2)),
    "Integrated Tax (IGST)": Number(inv.igst.toFixed(2)),
    "Central Tax (CGST)": Number(inv.cgst.toFixed(2)),
    "State Tax (SGST)": Number(inv.sgst.toFixed(2)),
    "Cess Amount": 0,
  }));
  const wsB2B = XLSX.utils.json_to_sheet(b2bRows);
  XLSX.utils.book_append_sheet(wb, wsB2B, "b2b");

  // 2. B2C Small Sheet
  const b2cRows = data.b2cInvoices.map((inv) => ({
    "Type": "OE",
    "Place Of Supply": inv.placeOfSupply || "24-Gujarat",
    "Applicable % of Tax Rate": inv.gstRate || 5,
    "Rate": `${inv.gstRate || 5}%`,
    "Taxable Value": Number(inv.taxableValue.toFixed(2)),
    "Integrated Tax (IGST)": Number(inv.igst.toFixed(2)),
    "Central Tax (CGST)": Number(inv.cgst.toFixed(2)),
    "State Tax (SGST)": Number(inv.sgst.toFixed(2)),
    "Cess Amount": 0,
    "E-Commerce GSTIN": "",
  }));
  const wsB2C = XLSX.utils.json_to_sheet(b2cRows);
  XLSX.utils.book_append_sheet(wb, wsB2C, "b2cs");

  // 3. HSN Summary Sheet
  const hsnRows = data.hsnSummary.map((hsn) => ({
    "HSN": hsn.hsnCode || "5208",
    "Description": hsn.description || "Woven Fabric",
    "UQC": hsn.uqc || "MTR-METERS",
    "Total Quantity": Number(hsn.totalQuantity.toFixed(2)),
    "Total Value": Number(hsn.totalValue.toFixed(2)),
    "Taxable Value": Number(hsn.taxableValue.toFixed(2)),
    "Integrated Tax Amount": Number(hsn.igst.toFixed(2)),
    "Central Tax Amount": Number(hsn.cgst.toFixed(2)),
    "State/UT Tax Amount": Number(hsn.sgst.toFixed(2)),
    "Cess Amount": 0,
  }));
  const wsHSN = XLSX.utils.json_to_sheet(hsnRows);
  XLSX.utils.book_append_sheet(wb, wsHSN, "hsn");

  // 4. Monthly Computation / Tax Summary Sheet
  const summaryRows = [
    { "Particulars": "Company Name", "Value / Details": data.companyName },
    { "Particulars": "Company GSTIN", "Value / Details": data.companyGstin || "N/A" },
    { "Particulars": "Tax Period", "Value / Details": data.periodLabel },
    { "Particulars": "", "Value / Details": "" },
    { "Particulars": "Total B2B Invoices Count", "Value / Details": data.totals.b2bCount },
    { "Particulars": "Total B2C Invoices Count", "Value / Details": data.totals.b2cCount },
    { "Particulars": "Total Invoices Filed", "Value / Details": data.totals.b2bCount + data.totals.b2cCount },
    { "Particulars": "", "Value / Details": "" },
    { "Particulars": "Total Taxable Turnover", "Value / Details": Number(data.totals.totalTaxable.toFixed(2)) },
    { "Particulars": "Total CGST (Central Tax)", "Value / Details": Number(data.totals.totalCgst.toFixed(2)) },
    { "Particulars": "Total SGST (State Tax)", "Value / Details": Number(data.totals.totalSgst.toFixed(2)) },
    { "Particulars": "Total IGST (Integrated Tax)", "Value / Details": Number(data.totals.totalIgst.toFixed(2)) },
    { "Particulars": "Total GST Liability", "Value / Details": Number(data.totals.totalTax.toFixed(2)) },
    { "Particulars": "Gross Total Invoice Value", "Value / Details": Number(data.totals.totalInvoiceValue.toFixed(2)) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Tax Summary");

  // Write file
  const cleanName = data.periodLabel.replace(/[\s/]/g, "_");
  XLSX.writeFile(wb, `GSTR1_CA_Report_${cleanName}.xlsx`);
}

/**
 * Generate GSTR-1 CSV for B2B or Combined
 */
export function exportGstr1Csv(data: GstReportData) {
  const allRows = [...data.b2bInvoices, ...data.b2cInvoices].map((inv) => ({
    "Invoice No": inv.invoiceNo,
    "Invoice Date": inv.invoiceDate,
    "Customer / Party": inv.customerName,
    "GSTIN": inv.gstin || "Unregistered",
    "Place of Supply": inv.placeOfSupply,
    "Category": inv.isB2B ? "B2B" : "B2C",
    "Taxable Value": Number(inv.taxableValue.toFixed(2)),
    "GST Rate": `${inv.gstRate}%`,
    "CGST": Number(inv.cgst.toFixed(2)),
    "SGST": Number(inv.sgst.toFixed(2)),
    "IGST": Number(inv.igst.toFixed(2)),
    "Total Tax": Number(inv.totalTax.toFixed(2)),
    "Invoice Value": Number(inv.invoiceValue.toFixed(2)),
  }));

  const ws = XLSX.utils.json_to_sheet(allRows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanName = data.periodLabel.replace(/[\s/]/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `GST_Sales_Report_${cleanName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate Printable A4 PDF Statement for CA / Tax Filing
 */
export function exportGstr1Pdf(data: GstReportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [32, 41, 54]; // #202936
  const accentColor: [number, number, number] = [59, 130, 246]; // #3b82f6

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(data.companyName.toUpperCase(), 14, 11);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 215, 235);
  doc.text(
    `GSTIN: ${data.companyGstin || "24AAAAA0000A1Z5"}  |  TEXTILE MANUFACTURING & TRADING`,
    14,
    18
  );

  // Right-aligned report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("GSTR-1 TAX REPORT", 196, 11, { align: "right" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 215, 235);
  doc.text(`Period: ${data.periodLabel}`, 196, 18, { align: "right" });

  // 2. Summary KPI Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 30, 182, 20, 2, 2, "FD");

  const kpis = [
    { title: "Taxable Turnover", val: `₹${data.totals.totalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
    { title: "CGST (Central)", val: `₹${data.totals.totalCgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
    { title: "SGST (State)", val: `₹${data.totals.totalSgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
    { title: "IGST (Inter-State)", val: `₹${data.totals.totalIgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
    { title: "Total Tax Liability", val: `₹${data.totals.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * 36.4 + 2;
    doc.setFontSize(6.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x, 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x, 43);
  });

  // 3. Table: B2B Invoices Schedule
  let startY = 55;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. B2B INVOICES (REGISTERED PARTIES)", 14, startY);

  const b2bTableData = data.b2bInvoices.map((inv) => [
    inv.invoiceNo,
    inv.invoiceDate,
    inv.customerName.slice(0, 22),
    inv.gstin,
    inv.placeOfSupply.slice(0, 10),
    `₹${inv.taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    `${inv.gstRate}%`,
    `₹${(inv.cgst + inv.sgst + inv.igst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    `₹${inv.invoiceValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  ]);

  if (b2bTableData.length === 0) {
    b2bTableData.push(["-", "-", "No B2B Invoices in this period", "-", "-", "₹0.00", "-", "₹0.00", "₹0.00"]);
  }

  autoTable(doc, {
    startY: startY + 3,
    head: [["Inv No", "Date", "Customer Name", "GSTIN", "POS", "Taxable (₹)", "Rate", "Tax (₹)", "Total (₹)"]],
    body: b2bTableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      overflow: "ellipsize",
    },
    columnStyles: {
      0: { font: "courier", halign: "left", cellWidth: 20 },
      1: { font: "courier", halign: "left", cellWidth: 18 },
      2: { halign: "left" },
      3: { font: "courier", halign: "left", cellWidth: 28 },
      4: { halign: "left", cellWidth: 18 },
      5: { font: "courier", halign: "right", cellWidth: 22 },
      6: { halign: "center", cellWidth: 10 },
      7: { font: "courier", halign: "right", cellWidth: 20 },
      8: { font: "courier", halign: "right", cellWidth: 22, fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  // 4. Table: HSN Summary
  const lastTable = (doc as any).lastAutoTable;
  const nextY = (lastTable ? lastTable.finalY : startY + 40) + 8;

  if (nextY > 230) {
    doc.addPage();
    startY = 20;
  } else {
    startY = nextY;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. HSN/SAC SUMMARY OF OUTWARD SUPPLIES", 14, startY);

  const hsnTableData = data.hsnSummary.map((h) => [
    h.hsnCode,
    h.description.slice(0, 25),
    h.uqc,
    h.totalQuantity.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    `₹${h.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    `₹${h.taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    `₹${h.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    `₹${h.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    `₹${h.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  ]);

  if (hsnTableData.length === 0) {
    hsnTableData.push(["5208", "Woven Fabric", "MTR", "0", "₹0.00", "₹0.00", "₹0.00", "₹0.00", "₹0.00"]);
  }

  autoTable(doc, {
    startY: startY + 3,
    head: [["HSN Code", "Description", "UQC", "Total Qty", "Total Val (₹)", "Taxable (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)"]],
    body: hsnTableData,
    theme: "striped",
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { font: "courier", halign: "left", cellWidth: 20 },
      1: { halign: "left" },
      2: { halign: "center", cellWidth: 16 },
      3: { font: "courier", halign: "right", cellWidth: 20 },
      4: { font: "courier", halign: "right", cellWidth: 22 },
      5: { font: "courier", halign: "right", cellWidth: 22 },
      6: { font: "courier", halign: "right", cellWidth: 18 },
      7: { font: "courier", halign: "right", cellWidth: 18 },
      8: { font: "courier", halign: "right", cellWidth: 18 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by Texa ERP  |  CA Tax Statement  |  Page ${i} of ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  const cleanName = data.periodLabel.replace(/[\s/]/g, "_");
  doc.save(`GSTR1_Report_${cleanName}.pdf`);
}

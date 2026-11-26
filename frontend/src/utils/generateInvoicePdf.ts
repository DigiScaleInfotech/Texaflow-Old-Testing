import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, numberToWords } from './format';

export interface InvoiceItem {
  id?: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  weight?: number | string | null;
  kg?: number | string | null;
  carton?: number | string | null;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  invoiceNo?: string;
  challanNo?: string;
  docType?: 'invoice' | 'challan';
  paperSize?: 'a4' | 'a5' | 'a6';
  date: string;
  customerName: string;
  companyName?: string;
  customerGst?: string;
  customerPhone?: string;
  billingAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  notes?: string;
  vehicleNo?: string;
  transportName?: string;
}

export const generateInvoicePdf = (invoice: InvoiceData, action: 'save' | 'print' = 'save') => {
  const isChallan = invoice.docType === 'challan';
  const paperSize = invoice.paperSize || 'a5';
  const isA6 = paperSize === 'a6';
  const isA5 = paperSize === 'a5';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA6 ? 'a6' : (isA5 ? 'a5' : 'a4'),
  });

  // Dimensions
  const pageWidth = isA6 ? 105 : (isA5 ? 148 : 210);
  const pageHeight = isA6 ? 148 : (isA5 ? 210 : 297);
  const margin = isA6 ? 4 : (isA5 ? 5 : 10);
  const contentWidth = pageWidth - margin * 2; // A6: 97mm | A5: 138mm | A4: 190mm

  const firmName = "OM SAI ENTERPRISE";
  const firmAddress = "PLOT NO-409, GR FLR, NATHABHAI BHANABHAI COMPOUND, U.M ROAD, SURAT - 395002";
  const firmPhone = "9876543210";
  const firmGstin = "24BTYPS5349N1ZI";
  const bankName = "KOTAK MAHINDRA BANK";
  const bankAccount = "1411123272";
  const bankIfsc = "KKBK0000871";

  let currentY = margin;

  // 1. Top Header Banner (OM SAI ENTERPRISE)
  const headerHeight = isA6 ? 8 : (isA5 ? 9.5 : 11);
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, currentY, contentWidth, headerHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 10.5 : (isA5 ? 12 : 14));
  doc.setTextColor(0, 0, 0);
  doc.text(firmName, pageWidth / 2, currentY + (isA6 ? 5.5 : (isA5 ? 6.5 : 7.5)), { align: 'center' });

  currentY += headerHeight;

  // 2. Address Bar
  const addressHeight = isA6 ? 4.5 : (isA5 ? 5.5 : 7);
  doc.rect(margin, currentY, contentWidth, addressHeight, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 5.2 : (isA5 ? 6.2 : 7.5));
  doc.text(firmAddress, pageWidth / 2, currentY + (isA6 ? 3.2 : (isA5 ? 4.0 : 5)), { align: 'center' });

  currentY += addressHeight;

  // 3. Document Title Bar (No. on Left | TITLE in Center | Date on Right)
  const titleBarHeight = isA6 ? 4.8 : (isA5 ? 5.8 : 7);
  const dateStr = formatDateStr(invoice.date);
  
  let rawDocNo = isChallan
    ? (invoice.challanNo || invoice.invoiceNo || "")
    : (invoice.invoiceNo || invoice.challanNo || "");

  if (!rawDocNo || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(rawDocNo)) {
    if (invoice.id && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(invoice.id)) {
      rawDocNo = invoice.id;
    } else {
      rawDocNo = isChallan ? "CH-0001" : "INV-0001";
    }
  }

  const docNoStr = rawDocNo;
  const docTitle = isChallan ? "DELIVERY CHALLAN" : "TAX INVOICE";
  const docPrefix = isChallan ? "CHALLAN NO. : " : "INV NO. : ";

  doc.rect(margin, currentY, contentWidth, titleBarHeight, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 5.8 : (isA5 ? 7.0 : 8.0));
  doc.text(`${docPrefix}${docNoStr}`, margin + 2.5, currentY + (isA6 ? 3.4 : (isA5 ? 4.2 : 5.0)));
  doc.setFontSize(isA6 ? 6.8 : (isA5 ? 8.2 : 9.5));
  doc.text(docTitle, pageWidth / 2, currentY + (isA6 ? 3.4 : (isA5 ? 4.2 : 5.0)), { align: 'center' });
  doc.setFontSize(isA6 ? 5.8 : (isA5 ? 7.0 : 8.0));
  doc.text(`Date : ${dateStr}`, margin + contentWidth - 2.5, currentY + (isA6 ? 3.4 : (isA5 ? 4.2 : 5.0)), { align: 'right' });

  currentY += titleBarHeight;

  // 4. TWO EQUAL 50% - 50% BOXES (Seller on Left, Buyer on Right)
  const boxHeight = isA6 ? 19 : (isA5 ? 24 : 28);
  const colWidth = contentWidth / 2;

  doc.rect(margin, currentY, contentWidth, boxHeight, 'S');
  doc.line(margin + colWidth, currentY, margin + colWidth, currentY + boxHeight);

  // Left Box (50%): Seller
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 6.2 : (isA5 ? 7.2 : 8.5));
  doc.text(`M/s. : ${firmName}`, margin + 2.5, currentY + (isA6 ? 3.2 : (isA5 ? 4.0 : 4.5)));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA6 ? 5.2 : (isA5 ? 6.2 : 7.5));
  doc.text(firmAddress, margin + 2.5, currentY + (isA6 ? 6.5 : (isA5 ? 7.8 : 9.0)), { maxWidth: colWidth - 5 });
  doc.text(`Mo : ${firmPhone}`, margin + 2.5, currentY + (isA6 ? 12.5 : (isA5 ? 15.5 : 18.0)));

  // Dashed line above GST
  doc.setLineDashPattern([1, 1], 0);
  const dashY = currentY + (isA6 ? 14.5 : (isA5 ? 18.0 : 20.5));
  doc.line(margin + 2.5, dashY, margin + colWidth - 2.5, dashY);
  doc.setLineDashPattern([], 0); // reset

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 5.2 : (isA5 ? 6.2 : 7.5));
  const gstY = currentY + (isA6 ? 17.5 : (isA5 ? 21.5 : 24.5));
  doc.text(`GST No. : ${firmGstin}`, margin + 2.5, gstY);
  doc.text('State Code : 24', margin + colWidth - (isA6 ? 17 : 24), gstY);

  // Right Box (50%): Buyer
  const buyerName = invoice.companyName && invoice.customerName && invoice.companyName !== invoice.customerName
    ? `${invoice.customerName} ( ${invoice.companyName} )`
    : (invoice.companyName || invoice.customerName || "Shiv Creation");
  const buyerGst = invoice.customerGst || "24KKUPD1972G1ZS";

  const parseAddress = (addr: any) => {
    if (!addr) return "196 Shyamdham Socayti, Nana Varachha Road Surat";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
    }
    return String(addr);
  };
  const buyerAddr = parseAddress(invoice.billingAddress);
  const buyerPhone = invoice.customerPhone || "+91 9978987181";
  const isInterstate = buyerGst && !buyerGst.startsWith("24");
  const stateCodeStr = isInterstate ? buyerGst.substring(0, 2) : "24";

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 6.2 : (isA5 ? 7.2 : 8.5));
  doc.text(`M/s. : ${buyerName}`, margin + colWidth + 2.5, currentY + (isA6 ? 3.2 : (isA5 ? 4.0 : 4.5)), { maxWidth: colWidth - 5 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA6 ? 5.2 : (isA5 ? 6.2 : 7.5));
  doc.text(buyerAddr, margin + colWidth + 2.5, currentY + (isA6 ? 6.5 : (isA5 ? 7.8 : 9.0)), { maxWidth: colWidth - 5 });
  if (buyerPhone) {
    doc.text(`Mo : ${buyerPhone}`, margin + colWidth + 2.5, currentY + (isA6 ? 12.5 : (isA5 ? 15.5 : 18.0)));
  }

  // Dashed line above GST
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + colWidth + 2.5, dashY, margin + contentWidth - 2.5, dashY);
  doc.setLineDashPattern([], 0); // reset

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 5.2 : (isA5 ? 6.2 : 7.5));
  doc.text(`GST No. : ${buyerGst}`, margin + colWidth + 2.5, gstY);
  doc.text(`State Code : ${stateCodeStr}`, margin + contentWidth - (isA6 ? 17 : 24), gstY);

  currentY += boxHeight;

  // 5. Items Table
  let subtotalAmount = 0;
  let totalQty = 0;
  const items = invoice.items.length > 0 ? invoice.items : [
    { description: '124 - LL', hsnCode: '5605', quantity: 100, unitPrice: 285, total: 7125 }
  ];

  const hasCartoon = items.some((it: any) => {
    const c = it.carton ?? it.cartoon;
    return c !== undefined && c !== null && String(c).trim() !== "" && String(c).trim() !== "0" && String(c).trim() !== "-";
  });

  const tableBody = items.map((it: any, idx) => {
    const qty = Number(it.quantity) || 1;
    const rate = Number(it.unitPrice) || 0;
    const amt = Number(it.total) || qty * rate;
    const wt = it.weight ? Number(it.weight).toFixed(3) : '-';
    const kgVal = it.kg ? Number(it.kg).toFixed(2) : '-';
    const ctn = it.carton || it.cartoon || '-';
    subtotalAmount += amt;
    totalQty += qty;

    if (hasCartoon) {
      return [
        String(idx + 1),
        it.description || '124 - LL',
        it.hsnCode || '5605',
        qty.toFixed(3),
        wt,
        kgVal,
        ctn,
        rate.toFixed(2),
        amt.toFixed(2),
      ];
    } else {
      return [
        String(idx + 1),
        it.description || '124 - LL',
        it.hsnCode || '5605',
        qty.toFixed(3),
        wt,
        kgVal,
        rate.toFixed(2),
        amt.toFixed(2),
      ];
    }
  });

  // Proportional filler rows so table connects straight down without horizontal lines
  const minRows = isA6 ? 8 : (isA5 ? 11 : 24);
  const emptyCols = hasCartoon ? 9 : 8;
  while (tableBody.length < minRows) {
    tableBody.push(Array(emptyCols).fill(''));
  }

  const tableHead = hasCartoon
    ? [['SR', 'ITEM', 'HSN CODE', 'QTY', 'WEIGHT', 'KG', 'CARTOON', 'RATE (Rs.)', 'AMOUNT (Rs.)']]
    : [['SR', 'ITEM', 'HSN CODE', 'QTY', 'WEIGHT', 'KG', 'RATE (Rs.)', 'AMOUNT (Rs.)']];

  let columnStyles: Record<number, any> = {};
  if (isA6) {
    columnStyles = hasCartoon
      ? {
          0: { halign: 'center', cellWidth: 6 },
          1: { halign: 'left', cellWidth: 23 },
          2: { halign: 'center', cellWidth: 10 },
          3: { halign: 'right', cellWidth: 11 },
          4: { halign: 'right', cellWidth: 9 },
          5: { halign: 'right', cellWidth: 8 },
          6: { halign: 'center', cellWidth: 8 },
          7: { halign: 'right', cellWidth: 11 },
          8: { halign: 'right', cellWidth: 11 },
        }
      : {
          0: { halign: 'center', cellWidth: 6 },
          1: { halign: 'left', cellWidth: 29 },
          2: { halign: 'center', cellWidth: 11 },
          3: { halign: 'right', cellWidth: 12 },
          4: { halign: 'right', cellWidth: 10 },
          5: { halign: 'right', cellWidth: 8 },
          6: { halign: 'right', cellWidth: 10.5 },
          7: { halign: 'right', cellWidth: 10.5 },
        };
  } else if (isA5) {
    columnStyles = hasCartoon
      ? {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'left', cellWidth: 35 },
          2: { halign: 'center', cellWidth: 13 },
          3: { halign: 'right', cellWidth: 14 },
          4: { halign: 'right', cellWidth: 13 },
          5: { halign: 'right', cellWidth: 10 },
          6: { halign: 'center', cellWidth: 10 },
          7: { halign: 'right', cellWidth: 17.5 },
          8: { halign: 'right', cellWidth: 17.5 },
        }
      : {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'left', cellWidth: 43 },
          2: { halign: 'center', cellWidth: 14 },
          3: { halign: 'right', cellWidth: 15 },
          4: { halign: 'right', cellWidth: 14 },
          5: { halign: 'right', cellWidth: 11 },
          6: { halign: 'right', cellWidth: 16.5 },
          7: { halign: 'right', cellWidth: 16.5 },
        };
  } else {
    columnStyles = hasCartoon
      ? {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 48 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'right', cellWidth: 20 },
          4: { halign: 'right', cellWidth: 18 },
          5: { halign: 'right', cellWidth: 14 },
          6: { halign: 'center', cellWidth: 14 },
          7: { halign: 'right', cellWidth: 24 },
          8: { halign: 'right', cellWidth: 24 },
        }
      : {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 60 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'right', cellWidth: 20 },
          4: { halign: 'right', cellWidth: 18 },
          5: { halign: 'right', cellWidth: 16 },
          6: { halign: 'right', cellWidth: 24 },
          7: { halign: 'right', cellWidth: 24 },
        };
  }

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    tableWidth: contentWidth,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: isA6 ? 5.5 : (isA5 ? 6.8 : 7.5),
      cellPadding: isA6 ? 1.0 : (isA5 ? 1.4 : 1.8),
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0,
      lineColor: [0, 0, 0],
    },
    columnStyles,
    didDrawCell: (data) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);

      // Draw vertical divider on the right of every cell
      doc.line(
        data.cell.x + data.cell.width,
        data.cell.y,
        data.cell.x + data.cell.width,
        data.cell.y + data.cell.height
      );

      // Draw vertical line on the left of column 0 (SR)
      if (data.column.index === 0) {
        doc.line(
          data.cell.x,
          data.cell.y,
          data.cell.x,
          data.cell.y + data.cell.height
        );
      }

      // Draw top and bottom horizontal border on header row
      if (data.section === 'head') {
        doc.line(
          data.cell.x,
          data.cell.y,
          data.cell.x + data.cell.width,
          data.cell.y
        );
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || currentY + (isA6 ? 38 : (isA5 ? 60 : 159));

  // Draw bottom border closing the table
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(margin, finalY, margin + contentWidth, finalY);

  currentY = finalY;

  // 6. Calculations
  const discountAmount = Number(invoice.discount || 0);
  const activeDiscount = discountAmount > 0 ? discountAmount : (subtotalAmount * 0.05);
  const discountPercent = 5.0;
  const taxableAmount = Math.max(0, subtotalAmount - activeDiscount);

  const cgstAmount = isInterstate ? 0 : Number((taxableAmount * 0.025).toFixed(2));
  const sgstAmount = isInterstate ? 0 : Number((taxableAmount * 0.025).toFixed(2));
  const igstAmount = isInterstate ? Number((taxableAmount * 0.05).toFixed(2)) : 0;
  const totalGst = isInterstate ? igstAmount : (cgstAmount + sgstAmount);

  const rawGrandTotal = taxableAmount + totalGst;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  // 7. Bottom Section (Unified A5 design: Bank Details + QR on Left | Full Calculation on Right)
  const bottomSplit = isA6 ? 56 : (isA5 ? 80 : 115);
  const tier1Height = isA6 ? 18 : (isA5 ? 25 : 29);

  doc.rect(margin, currentY, bottomSplit, tier1Height, 'S');
  doc.rect(margin + bottomSplit, currentY, contentWidth - bottomSplit, tier1Height, 'S');

  // Bank Details + QR on Left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 5.8 : (isA5 ? 7.0 : 8.0));
  doc.text('Bank Details:', margin + 2.5, currentY + (isA6 ? 3.5 : (isA5 ? 4.0 : 4.5)));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 5.2 : (isA5 ? 6.5 : 7.5));
  const lineGap = isA6 ? 3.5 : (isA5 ? 4.2 : 5.0);
  let bY = currentY + (isA6 ? 7.2 : (isA5 ? 8.5 : 10.0));
  const colLabelW = isA6 ? 16 : (isA5 ? 20 : 25);

  doc.text('Bank Name', margin + 2.5, bY);
  doc.text(`:   ${bankName}`, margin + colLabelW, bY);
  bY += lineGap;

  doc.text('Bank A/c', margin + 2.5, bY);
  doc.text(`:   ${bankAccount}`, margin + colLabelW, bY);
  bY += lineGap;

  doc.text('Bank IFSC', margin + 2.5, bY);
  doc.text(`:   ${bankIfsc}`, margin + colLabelW, bY);
  bY += lineGap;

  doc.text('UPI ID', margin + 2.5, bY);
  doc.text(':   shivcreation@sbi', margin + colLabelW, bY);

  // QR Code Box (SCAN & PAY):
  const qrW = isA6 ? 13 : (isA5 ? 17 : 20);
  const qrH = isA6 ? 15 : (isA5 ? 19 : 22);
  const qrX = margin + bottomSplit - qrW - 2;
  const qrY = currentY + (isA6 ? 2.5 : 3.5);
  doc.setDrawColor(96, 165, 250);
  doc.setLineWidth(0.3);
  doc.roundedRect(qrX, qrY, qrW, qrH, 1, 1, 'S');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);

  const fSize = isA6 ? 3 : (isA5 ? 4 : 5);
  doc.rect(qrX + 1.5, qrY + 1.5, fSize, fSize, 'S');
  doc.rect(qrX + qrW - fSize - 1.5, qrY + 1.5, fSize, fSize, 'S');
  doc.rect(qrX + 1.5, qrY + qrH - fSize - 3.5, fSize, fSize, 'S');

  doc.setTextColor(29, 78, 216);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 4.2 : (isA5 ? 5.0 : 5.5));
  doc.text('SCAN & PAY', qrX + qrW / 2, qrY + qrH - 1.2, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Right: Calculations
  const rightX = margin + bottomSplit;
  const rightW = contentWidth - bottomSplit;

  let calcY = currentY + (isA6 ? 3.4 : (isA5 ? 4.0 : 4.5));
  const cGap = isA6 ? 3.0 : (isA5 ? 3.8 : 4.5);
  const printCalc = (label: string, rate: string, amount: string, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isA6 ? 5.2 : (isA5 ? 6.5 : 7.5));
    doc.text(label, rightX + (isA6 ? 2 : 3), calcY);
    if (rate) {
      doc.text(rate, rightX + (rightW * 0.45), calcY, { align: 'center' });
    }
    doc.text(amount, rightX + rightW - (isA6 ? 2 : 3), calcY, { align: 'right' });
    calcY += cGap;
  };

  printCalc('Sub Total', '', subtotalAmount.toFixed(2), true);
  if (discountAmount > 0) {
    printCalc('Discount', `${discountPercent.toFixed(2)}%`, activeDiscount.toFixed(2));
  }
  printCalc('Taxable Amount', '', taxableAmount.toFixed(2), true);
  printCalc('CGST', '2.50%', cgstAmount.toFixed(2));
  printCalc('SGST', '2.50%', sgstAmount.toFixed(2));
  if (roundOff !== 0) {
    printCalc('Round Off', '', roundOff.toFixed(2));
  }

  currentY += tier1Height;

  // --- Tier 2: FULL-WIDTH Gray Bar (Words on Left | Total Amount on Right) ---
  const tier2Height = isA6 ? 6 : (isA5 ? 7 : 8);
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, currentY, contentWidth, tier2Height, 'FD');
  doc.line(margin + bottomSplit, currentY, margin + bottomSplit, currentY + tier2Height);

  doc.setFont('times', 'italic');
  doc.setFontSize(isA6 ? 5.8 : (isA5 ? 7.0 : 8.0));
  doc.text(numberToWords(grandTotal), margin + 2.5, currentY + (isA6 ? 4.0 : (isA5 ? 4.8 : 5.5)), { maxWidth: bottomSplit - 5 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 6.2 : (isA5 ? 7.5 : 8.5));
  doc.text(`Total :   Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + contentWidth - 2.5, currentY + (isA6 ? 4.0 : (isA5 ? 4.8 : 5.5)), { align: 'right' });

  currentY += tier2Height;

  // --- Tier 3: Terms & Conditions on Left | Signatory on Right ---
  const tier3Height = isA6 ? 19 : (isA5 ? 24 : 28);
  doc.rect(margin, currentY, contentWidth, tier3Height, 'S');
  doc.line(margin + bottomSplit, currentY, margin + bottomSplit, currentY + tier3Height);

  // Left (Terms & Conditions):
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 5.0 : (isA5 ? 6.0 : 6.8));
  doc.text('Terms and Conditions :', margin + 2.5, currentY + (isA6 ? 3.0 : 3.8));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA6 ? 4.0 : (isA5 ? 4.8 : 5.5));
  const tGap = isA6 ? 2.1 : (isA5 ? 2.6 : 3.2);
  let tY = currentY + (isA6 ? 5.5 : 6.8);
  doc.text('1. The Goods are dispatched on your account & at your risk.', margin + 2.5, tY);
  tY += tGap;
  doc.text('2. Any complaint must be reported in writing within 24 hours.', margin + 2.5, tY);
  tY += tGap;
  doc.text('3. Goods sold will not taken back.', margin + 2.5, tY);
  tY += tGap;
  doc.text("4. Subject to 'SURAT' Jurisdiction. E. & O.E.", margin + 2.5, tY);
  tY += tGap;
  doc.text('5. No Dyeing guarantee.', margin + 2.5, tY);

  // Right (Signatory):
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA6 ? 6.0 : (isA5 ? 7.0 : 7.5));
  doc.text(`FOR ${firmName}`, margin + contentWidth - 2.5, currentY + (isA6 ? 4.0 : 4.5), { align: 'right' });

  doc.setFontSize(isA6 ? 5.0 : (isA5 ? 6.2 : 7.0));
  doc.text('AUTHORISED SIGNATORY', margin + contentWidth - 2.5, currentY + tier3Height - 2.5, { align: 'right' });

  const cleanDocNo = docNoStr.replace(/[^a-zA-Z0-9_-]/g, '-');
  const fileName = isChallan
    ? (cleanDocNo.startsWith('CH-') || cleanDocNo.startsWith('CH') ? `${cleanDocNo}.pdf` : `CH-${cleanDocNo}.pdf`)
    : (cleanDocNo.startsWith('INV-') || cleanDocNo.startsWith('INV') ? `${cleanDocNo}.pdf` : `INV-${cleanDocNo}.pdf`);

  if (action === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const existingIframe = document.getElementById('pdf-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'pdf-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = String(blobUrl);
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          window.open(blobUrl, '_blank');
        }
      }, 300);
    };
  } else {
    doc.save(fileName);
  }
};

const formatDateStr = (dateString?: string): string => {
  if (!dateString) return '24/11/2026';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

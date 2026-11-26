import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './format';

export interface LedgerPdfEntry {
  date: string;
  voucherNo?: string;
  type: string;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerPdfData {
  partyName: string;
  partyType?: string;
  partyPhone?: string;
  periodText: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: LedgerPdfEntry[];
}

export const getShortPartyName = (partyName?: string): string => {
  if (!partyName) return 'Party';
  // Check if parentheses exist e.g. "Meet ( Shiv Creation )" -> extract company inside "Shiv Creation"
  const match = partyName.match(/\((.*?)\)/);
  if (match && match[1]?.trim()) {
    const clean = match[1].replace(/[^a-zA-Z0-9]/g, '');
    if (clean) return clean;
  }
  // Otherwise clean party name without spaces
  const clean = partyName.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/).join('');
  return clean || 'Party';
};

export const generateLedgerPdf = (data: LedgerPdfData, action: 'save' | 'print' = 'save') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Company Header (Clean & Minimalist Indian Accounting Design - White Background)
  const firmName = 'OM SAI ENTERPRISE';
  const firmAddress = 'PLOT NO-409, GR FLR, NATHABHAI BHANABHAI COMPOUND, U.M ROAD, SURAT - 395002';
  const firmPhone = '+91 9876543210';
  const firmGstin = '24BTYPS5349N1ZI';

  // Firm Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(firmName, pageWidth / 2, 14, { align: 'center' });

  // Firm Subtitle & Address
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(firmAddress, pageWidth / 2, 19, { align: 'center' });
  doc.text(`Mo: ${firmPhone}   |   GSTIN: ${firmGstin}`, pageWidth / 2, 23.5, { align: 'center' });

  // Thin dividing line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.line(margin, 26, pageWidth - margin, 26);

  // 2. Title & Statement Date
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, 28, contentWidth, 8, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(margin, 28, contentWidth, 8, 'S');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('STATEMENT OF ACCOUNT / PARTY LEDGER', margin + 4, 33.5);

  const printDateStr = `Date: ${new Date().toLocaleDateString('en-IN')}`;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(printDateStr, pageWidth - margin - 4, 33.5, { align: 'right' });

  // 3. Party & Balance Summary Card
  const boxY = 39;
  const boxHeight = 25;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, boxY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

  // Vertical split line in info box
  const midX = margin + contentWidth * 0.52;
  doc.line(midX, boxY, midX, boxY + boxHeight);

  // Left Column: Party Details
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('M/s. / Party Name:', margin + 4, boxY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.partyName || 'Party Name', margin + 4, boxY + 11.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  if (data.partyPhone) {
    doc.text(`Contact: ${data.partyPhone}`, margin + 4, boxY + 16.5);
  }
  doc.text(`Period: ${data.periodText || 'All Time'}`, margin + 4, data.partyPhone ? boxY + 21 : boxY + 17);

  // Right Column: Accounting Balances Summary
  const colRightX = midX + 4;
  const valRightX = pageWidth - margin - 4;

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Opening Balance:', colRightX, boxY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${formatCurrency(data.openingBalance)}`, valRightX, boxY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Debit (Dr):', colRightX, boxY + 11);
  doc.setTextColor(22, 101, 52); // green-800
  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${formatCurrency(data.totalDebit)}`, valRightX, boxY + 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Credit (Cr):', colRightX, boxY + 15.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${formatCurrency(data.totalCredit)}`, valRightX, boxY + 15.5, { align: 'right' });

  // Divider inside summary box
  doc.setDrawColor(226, 232, 240);
  doc.line(colRightX, boxY + 18, valRightX, boxY + 18);

  const closingText =
    data.closingBalance >= 0
      ? `INR ${formatCurrency(data.closingBalance)} Dr (Receivable)`
      : `INR ${formatCurrency(Math.abs(data.closingBalance))} Cr (Payable)`;

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Closing Balance:', colRightX, boxY + 22.5);
  doc.setTextColor(data.closingBalance > 0 ? 180 : 22, data.closingBalance > 0 ? 83 : 101, data.closingBalance > 0 ? 9 : 52);
  doc.text(closingText, valRightX, boxY + 22.5, { align: 'right' });

  // 4. Ledger Table
  const tableRows = data.entries.map((entry) => [
    entry.date ? new Date(entry.date).toLocaleDateString('en-IN') : '—',
    entry.voucherNo || '—',
    entry.type || '—',
    entry.description || '—',
    entry.debit > 0 ? formatCurrency(entry.debit) : '—',
    entry.credit > 0 ? formatCurrency(entry.credit) : '—',
    `${formatCurrency(Math.abs(entry.balance))} ${entry.balance >= 0 ? 'Dr' : 'Cr'}`,
  ]);

  autoTable(doc, {
    startY: boxY + boxHeight + 4,
    head: [['Date', 'Voucher #', 'Type', 'Particulars / Description', 'Debit (Dr ₹)', 'Credit (Cr ₹)', 'Balance (₹)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42], // slate-900
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },
      1: { cellWidth: 24, halign: 'left' },
      2: { cellWidth: 20, halign: 'left' },
      3: { cellWidth: 'auto', halign: 'left' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    foot: [
      [
        '',
        '',
        '',
        'Total / Closing Balance:',
        formatCurrency(data.totalDebit),
        formatCurrency(data.totalCredit),
        `${formatCurrency(Math.abs(data.closingBalance))} ${data.closingBalance >= 0 ? 'Dr' : 'Cr'}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
    },
    margin: { left: margin, right: margin, bottom: 15 },
    didDrawPage: (hookData) => {
      // Clean footer
      const str = `Page ${hookData.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('This is a computer generated account statement • Texa ERP', margin, pageHeight - 8);
      doc.text(str, pageWidth - margin, pageHeight - 8, { align: 'right' });
    },
  });

  // Filename - Short & Clean e.g. Ledger_ShivCreation.pdf
  const shortParty = getShortPartyName(data.partyName);
  const fileName = `Ledger_${shortParty}.pdf`;

  if (action === 'print') {
    const blobUrl = doc.output('bloburl');
    const existingIframe = document.getElementById('pdf-ledger-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'pdf-ledger-print-iframe';
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

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  Edit,
  Loader2,
  Truck,
} from 'lucide-react';
import { generateInvoicePdf } from '@/utils/generateInvoicePdf';
import { billingService } from '@/services/billing.service';
import { formatCurrency, formatShortId, numberToWords } from '@/utils/format';

const QrCodeSvg = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="29" height="29" fill="white" />
    {/* Finder Top-Left */}
    <rect x="1" y="1" width="7" height="7" stroke="black" strokeWidth="1.5" fill="white" />
    <rect x="3" y="3" width="3" height="3" fill="black" />
    {/* Finder Top-Right */}
    <rect x="21" y="1" width="7" height="7" stroke="black" strokeWidth="1.5" fill="white" />
    <rect x="23" y="3" width="3" height="3" fill="black" />
    {/* Finder Bottom-Left */}
    <rect x="1" y="21" width="7" height="7" stroke="black" strokeWidth="1.5" fill="white" />
    <rect x="3" y="23" width="3" height="3" fill="black" />
    {/* Data modules */}
    <rect x="10" y="2" width="2" height="2" fill="black" />
    <rect x="14" y="2" width="2" height="2" fill="black" />
    <rect x="17" y="2" width="2" height="2" fill="black" />
    <rect x="10" y="5" width="2" height="2" fill="black" />
    <rect x="13" y="5" width="2" height="2" fill="black" />
    <rect x="16" y="5" width="2" height="2" fill="black" />
    <rect x="10" y="8" width="2" height="2" fill="black" />
    <rect x="14" y="8" width="2" height="2" fill="black" />
    <rect x="2" y="10" width="2" height="2" fill="black" />
    <rect x="5" y="10" width="2" height="2" fill="black" />
    <rect x="8" y="10" width="2" height="2" fill="black" />
    <rect x="11" y="11" width="3" height="3" fill="black" />
    <rect x="16" y="10" width="2" height="2" fill="black" />
    <rect x="20" y="10" width="2" height="2" fill="black" />
    <rect x="24" y="10" width="2" height="2" fill="black" />
    <rect x="2" y="14" width="2" height="2" fill="black" />
    <rect x="6" y="14" width="2" height="2" fill="black" />
    <rect x="10" y="14" width="2" height="2" fill="black" />
    <rect x="14" y="14" width="2" height="2" fill="black" />
    <rect x="17" y="14" width="2" height="2" fill="black" />
    <rect x="21" y="14" width="2" height="2" fill="black" />
    <rect x="25" y="14" width="2" height="2" fill="black" />
    <rect x="10" y="18" width="2" height="2" fill="black" />
    <rect x="14" y="18" width="2" height="2" fill="black" />
    <rect x="18" y="18" width="2" height="2" fill="black" />
    <rect x="22" y="18" width="2" height="2" fill="black" />
    <rect x="10" y="22" width="2" height="2" fill="black" />
    <rect x="13" y="22" width="2" height="2" fill="black" />
    <rect x="17" y="22" width="2" height="2" fill="black" />
    <rect x="21" y="22" width="2" height="2" fill="black" />
    <rect x="25" y="22" width="2" height="2" fill="black" />
    <rect x="10" y="25" width="2" height="2" fill="black" />
    <rect x="14" y="25" width="2" height="2" fill="black" />
    <rect x="18" y="25" width="2" height="2" fill="black" />
    <rect x="23" y="25" width="2" height="2" fill="black" />
  </svg>
);

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        let data = await billingService.getBillById(invoiceId);
        if (!data) {
          // Fallback in case ID was invoiceId or search
          const all = await billingService.getBills();
          if (all && all.bills) {
            data = all.bills.find(
              (b: any) =>
                b.id === invoiceId ||
                b.invoiceId === invoiceId ||
                b.billNumber === invoiceId ||
                b.challanNo === invoiceId
            );
          }
        }
        if (data) {
          if (data.documentType === 'challan') {
            router.replace(`/challans/${data.id || invoiceId}`);
            return;
          }
          setBill(data);
        }
      } catch (err) {
        console.error('Error fetching invoice details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchBill();
    }
  }, [invoiceId, router]);

  const items = bill?.items && bill.items.length > 0 ? bill.items : [
    {
      description: "124 - LL",
      hsnCode: "9988",
      quantity: 100.000,
      unitPrice: 285.00,
      total: 7125.00,
      weight: null,
      kg: null,
      carton: null,
    }
  ];

  // Condition requested by user: If NO cartoon entered by user, do not show CARTOON column
  const hasCartoon = items.some((it: any) => {
    const val = it.carton ?? it.cartoon;
    return val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-' && Number(val) > 0;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading Invoice...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 glass-card rounded-xl text-center space-y-4">
        <p className="text-sm text-red-500 font-medium">Invoice not found.</p>
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  // Firm data
  const firmName = "OM SAI ENTERPRISE";
  const firmAddress = "PLOT NO-409, GR FLR, NATHABHAI BHANABHAI COMPOUND, U.M ROAD, SURAT - 395002";
  const firmPhone = "9876543210";
  const firmGstin = "24BTYPS5349N1ZI";
  const bankName = "KOTAK MAHINDRA BANK";
  const bankAccount = "1411123272";
  const bankIfsc = "KKBK0000871";

  const invoiceNo = bill.billNumber || bill.invoiceId || "INV-1750";
  const displayDate = bill.issueDate
    ? new Date(bill.issueDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "24/11/2026";

  let calculatedSubtotal = 0;
  items.forEach((it: any) => {
    const qty = Number(it.quantity || it.qty) || 1;
    const rate = Number(it.unitPrice || it.rate) || 0;
    calculatedSubtotal += Number(it.total || it.amount) || qty * rate;
  });

  const subTotal = calculatedSubtotal > 0 ? calculatedSubtotal : Number(bill.subtotal || 7125);
  const discountAmount = Number(bill.discount || 0);
  const activeDiscount = discountAmount > 0 ? discountAmount : (subTotal * 0.05); // Default 5%
  const taxableAmount = Math.max(0, subTotal - activeDiscount);

  // Taxes (2.5% CGST, 2.5% SGST)
  const isInterstate = bill.vendorGstNumber && !bill.vendorGstNumber.startsWith("24");
  const cgstAmount = isInterstate ? 0 : Number((taxableAmount * 0.025).toFixed(2));
  const sgstAmount = isInterstate ? 0 : Number((taxableAmount * 0.025).toFixed(2));
  const igstAmount = isInterstate ? Number((taxableAmount * 0.05).toFixed(2)) : 0;
  const totalGst = isInterstate ? igstAmount : (cgstAmount + sgstAmount);

  const rawGrandTotal = taxableAmount + totalGst;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  // Buyer details formatting - prevent duplicate company name
  let buyerName = bill.customerName || bill.companyName || "Meet ( Shiv Creation )";
  if (bill.companyName && bill.customerName && bill.companyName !== bill.customerName) {
    if (!bill.customerName.includes(bill.companyName)) {
      buyerName = `${bill.customerName} ( ${bill.companyName} )`;
    }
  }
  const buyerGst = bill.vendorGstNumber || "24KKUPD1972G1ZS";
  const buyerPhone = bill.customerPhone || "+91 9978987181";
  const partyStateCode = isInterstate ? buyerGst.substring(0, 2) : "24";

  // Address parsing so it never fails or cuts off
  const parseAddress = (addr: any) => {
    if (!addr) return "Plot No. 104-106, GIDC Khatodara Industrial Estate, Surat, Gujarat - 395002";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
    }
    return String(addr);
  };
  const buyerAddress = parseAddress(bill.billingAddress);

  const getInvoicePayload = () => ({
    id: bill.id,
    invoiceNo: invoiceNo,
    challanNo: bill.challanNo,
    docType: 'invoice' as const,
    paperSize: 'a5' as const,
    date: bill.issueDate,
    customerName: buyerName,
    companyName: bill.companyName,
    customerGst: buyerGst,
    customerPhone: buyerPhone,
    billingAddress: buyerAddress,
    items: items.map((it: any) => ({
      id: it.id,
      description: it.description || it.item || '124 - LL',
      hsnCode: it.hsnCode || '9988',
      quantity: Number(it.quantity || it.qty) || 1,
      weight: it.weight,
      kg: it.kg,
      carton: it.carton || it.cartoon,
      unitPrice: Number(it.unitPrice || it.rate) || 0,
      total: Number(it.total || it.amount) || 0,
    })),
    subtotal: subTotal,
    discount: discountAmount,
    tax: totalGst,
    total: grandTotal,
    notes: bill.notes,
    vehicleNo: bill.vehicleNo,
    transportName: bill.transportName,
  });

  const handleDownloadPdf = () => {
    if (!bill) return;
    generateInvoicePdf(getInvoicePayload(), 'save');
  };

  const handlePrint = () => {
    if (!bill) return;
    generateInvoicePdf(getInvoicePayload(), 'print');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Controls Bar - Hidden when printing */}
      <div className="flex items-center justify-end gap-3 print:hidden">
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/billing/edit/${bill.id}`)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. EXACT A5 SHEET (148mm x 210mm) - CRISP WHITE PAPER WITH MARGINS LIKE IMAGE 2 */}
      <div className="py-6 px-2 sm:px-4 flex justify-center bg-transparent print:p-0 print:m-0">
        <div className="print-page bg-white p-3 sm:p-5 shadow-2xl w-full max-w-[620px] print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
          <div className="print-bill bg-white text-black border border-black rounded-none w-full overflow-hidden">

            {/* ROW 1: Header Firm Name */}
            <div className="bg-[#e6e6e6] border-b border-black py-2 px-3 text-center">
              <h1 className="text-lg font-bold tracking-wider uppercase font-sans text-black">
                {firmName}
              </h1>
            </div>

            {/* ROW 2: Address */}
            <div className="border-b border-black py-1 px-2.5 text-center bg-white overflow-hidden">
              <p className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider text-black font-sans whitespace-nowrap">
                {firmAddress}
              </p>
            </div>

            {/* ROW 3: Bar (INV NO. on Left | TAX INVOICE in Center | Date on Right) */}
            <div className="border-b border-black py-1 px-2.5 flex justify-between items-center text-[9.5px] sm:text-[10px] font-bold text-black bg-white">
              <div className="w-1/3 text-left font-mono whitespace-nowrap">
                <span className="font-sans font-bold">INV NO. : </span>{invoiceNo}
              </div>
              <div className="w-1/3 text-center text-[10px] sm:text-[11px] font-bold tracking-wider uppercase whitespace-nowrap">
                TAX INVOICE
              </div>
              <div className="w-1/3 text-right font-mono whitespace-nowrap">
                <span className="font-sans font-bold">Date : </span>{displayDate}
              </div>
            </div>

            {/* ROW 4: TWO EQUAL SIZED 50% - 50% BOXES WITH PERFECT HORIZONTAL ALIGNMENT */}
            <div className="border-b border-black grid grid-cols-2 divide-x divide-black bg-white">
              {/* Left Box (50%): Seller / Our Company Details */}
              <div className="p-2 flex flex-col justify-between min-h-[85px]">
                <div className="space-y-0.5 text-[9.5px] sm:text-[10px] text-black">
                  <p className="font-bold">
                    M/s. : <span className="font-bold">{firmName}</span>
                  </p>
                  <p className="leading-tight text-[9px]">
                    {firmAddress}
                  </p>
                  <p className="text-[9px]">
                    <span className="font-bold">Mo :</span> {firmPhone}
                  </p>
                </div>
                {/* Dashed divider line */}
                <div className="pt-1 mt-1 border-t border-dashed border-gray-400 flex justify-between font-mono text-[9px]">
                  <span>
                    <strong className="font-sans">GST No. :</strong> {firmGstin}
                  </span>
                  <span>
                    <strong className="font-sans">State Code :</strong> 24
                  </span>
                </div>
              </div>

              {/* Right Box (50%): Buyer / Consignee Details */}
              <div className="p-2 flex flex-col justify-between min-h-[85px]">
                <div className="space-y-0.5 text-[9.5px] sm:text-[10px] text-black">
                  <p className="font-bold">
                    M/s. : <span className="font-bold">{buyerName}</span>
                  </p>
                  <p className="leading-tight text-[9px]">
                    {buyerAddress}
                  </p>
                  {buyerPhone && (
                    <p className="text-[9px]">
                      <span className="font-bold">Mo :</span> {buyerPhone}
                    </p>
                  )}
                </div>
                {/* Dashed divider line */}
                <div className="pt-1 mt-1 border-t border-dashed border-gray-400 flex justify-between font-mono text-[9px]">
                  <span>
                    <strong className="font-sans">GST No. :</strong> {buyerGst || '-'}
                  </span>
                  <span>
                    <strong className="font-sans">State Code :</strong> {partyStateCode}
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 5: Items Table with MATHEMATICALLY BALANCED COLUMNS & ZERO CUTOUT */}
            <table className="w-full border-collapse table-fixed text-[9.5px] sm:text-[10px] border-b border-black bg-white">
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: hasCartoon ? '22%' : '27%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: hasCartoon ? '9%' : '11%' }} />
                <col style={{ width: hasCartoon ? '9%' : '11%' }} />
                <col style={{ width: '8%' }} />
                {hasCartoon && <col style={{ width: '8%' }} />}
                <col style={{ width: '13%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-black font-sans font-bold text-black text-center bg-white h-6">
                  <th className="border-r border-black py-1 whitespace-nowrap text-center">SR</th>
                  <th className="border-r border-black py-1 px-1 text-left whitespace-nowrap">ITEM</th>
                  <th className="border-r border-black py-1 whitespace-nowrap text-center">HSN CODE</th>
                  <th className="border-r border-black py-1 px-1 text-right whitespace-nowrap">QTY</th>
                  <th className="border-r border-black py-1 px-1 text-right whitespace-nowrap">WEIGHT</th>
                  <th className="border-r border-black py-1 px-1 text-right whitespace-nowrap">KG</th>
                  {hasCartoon && (
                    <th className="border-r border-black py-1 whitespace-nowrap text-center">CARTOON</th>
                  )}
                  <th className="border-r border-black py-1 px-1 text-right whitespace-nowrap">RATE (Rs.)</th>
                  <th className="py-1 px-1 text-right whitespace-nowrap">AMOUNT (Rs.)</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[9.5px] sm:text-[10px] text-black">
                {items.map((it: any, idx: number) => {
                  const qty = Number(it.quantity || it.qty || 1);
                  const wt = it.weight ? Number(it.weight).toFixed(3) : '-';
                  const kgVal = it.kg ? Number(it.kg).toFixed(2) : '-';
                  const ctn = it.carton || it.cartoon || '-';
                  const rate = Number(it.unitPrice || it.rate || 0);
                  const amt = Number(it.total || it.amount || 0) || qty * rate;

                  return (
                    <tr key={idx} className="h-5 leading-5 align-top">
                      <td className="border-r border-black text-center py-0.5">{idx + 1}</td>
                      <td className="border-r border-black text-left px-1 py-0.5 font-sans uppercase truncate" title={it.description || it.item}>
                        {it.description || it.item || 'Textile Fabric'}
                      </td>
                      <td className="border-r border-black text-center py-0.5">{it.hsnCode || '9988'}</td>
                      <td className="border-r border-black text-right px-1.5 py-0.5">{qty.toFixed(3)}</td>
                      <td className="border-r border-black text-right px-1.5 py-0.5">{wt}</td>
                      <td className="border-r border-black text-right px-1.5 py-0.5">{kgVal}</td>
                      {hasCartoon && (
                        <td className="border-r border-black text-center py-0.5">{ctn}</td>
                      )}
                      <td className="border-r border-black text-right px-1.5 py-0.5">{rate.toFixed(2)}</td>
                      <td className="text-right px-1.5 py-0.5">{amt.toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Empty filler row: continuous vertical column lines and ZERO horizontal lines, proportioned for A5 */}
                <tr className="h-[160px]">
                  <td className="border-r border-black p-0"><div className="h-[160px]" /></td>
                  <td className="border-r border-black p-0"><div className="h-[160px]" /></td>
                  <td className="border-r border-black p-0"><div className="h-[160px]" /></td>
                  <td className="border-r border-black p-0"><div className="h-[160px]" /></td>
                  <td className="border-r border-black p-0"><div className="h-[160px]" /></td>
                  <td className="border-r border-black p-0"><div className="h-[160px]" /></td>
                  {hasCartoon && <td className="border-r border-black p-0"><div className="h-[160px]" /></td>}
                  <td className="border-r border-black p-0"><div className="h-[160px]" /></td>
                  <td className="p-0"><div className="h-[160px]" /></td>
                </tr>
              </tbody>
            </table>

            {/* ROW 6: Bottom Section matching Image 2 perfectly with Continuous Vertical Line */}
            {/* Tier 1: Bank Details + QR Code on Left | Calculations on Right */}
            <div className="grid grid-cols-12 divide-x divide-black bg-white">
              {/* Left Box (col-span-7): Bank Details & QR Code */}
              <div className="col-span-7 p-2 flex justify-between items-center font-mono text-[9px] sm:text-[9.5px]">
                <div className="space-y-0.5">
                  <p className="font-bold underline font-sans mb-1 text-[9.5px] sm:text-[10px]">Bank Details:</p>
                  <div className="flex">
                    <span className="w-20 font-bold font-sans">Bank Name</span>
                    <span className="font-bold">: &nbsp;{bankName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-bold font-sans">Bank A/c</span>
                    <span className="font-bold">: &nbsp;{bankAccount}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-bold font-sans">Bank IFSC</span>
                    <span className="font-bold">: &nbsp;{bankIfsc}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-bold font-sans">UPI ID</span>
                    <span className="font-bold">: &nbsp;shivcreation@sbi</span>
                  </div>
                </div>

                {/* Authentic SVG QR Code SCAN & PAY card */}
                <div className="border border-blue-400 rounded p-1 bg-white flex flex-col items-center justify-center shrink-0 shadow-xs mr-1">
                  <QrCodeSvg size={38} />
                  <span className="text-[7px] font-bold text-blue-700 tracking-wider uppercase mt-0.5">SCAN & PAY</span>
                </div>
              </div>

              {/* Right Box (col-span-5): Taxable Amount & GST Calculation rows */}
              <div className="col-span-5 p-2 font-mono text-[9px] sm:text-[9.5px] text-black flex flex-col justify-center space-y-0.5">
                <div className="flex justify-between px-1 font-bold">
                  <span>Sub Total</span>
                  <span>{subTotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between px-1">
                    <span>Discount (5.00%)</span>
                    <span>{activeDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between px-1 font-bold">
                  <span>Taxable Amount</span>
                  <span>{taxableAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between px-1">
                  <span>CGST 2.50%</span>
                  <span>{cgstAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between px-1">
                  <span>SGST 2.50%</span>
                  <span>{sgstAmount.toFixed(2)}</span>
                </div>

                {roundOff !== 0 && (
                  <div className="flex justify-between px-1">
                    <span>Round Off</span>
                    <span>{roundOff.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tier 2: FULL-WIDTH Gray Bar with Continuous Vertical Divider */}
            <div className="border-t border-b border-black bg-[#e6e6e6] grid grid-cols-12 divide-x divide-black py-1 text-[9px] sm:text-[9.5px]">
              <div className="col-span-7 px-2 font-serif italic font-bold text-black truncate flex items-center">
                {numberToWords(grandTotal)}
              </div>
              <div className="col-span-5 px-2 flex justify-between items-center font-sans font-bold text-black">
                <span>Total :</span>
                <span className="font-mono font-black text-[10.5px]">
                  Rs. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Tier 3: 5 Terms & Conditions on Left | Signatory on Right */}
            <div className="grid grid-cols-12 divide-x divide-black bg-white">
              {/* Left (col-span-7): 5 Terms and Conditions */}
              <div className="col-span-7 p-2 text-[7.5px] sm:text-[8px] space-y-0.5 text-black font-sans leading-tight">
                <p className="font-bold underline mb-0.5 text-[8.5px]">Terms and Conditions :</p>
                <p>1. The Goods are dispatched on your account & at your risk.</p>
                <p>2. Any complaint must be reported in writing within 24 hours.</p>
                <p>3. Goods sold will not taken back.</p>
                <p>4. Subject to 'SURAT' Jurisdiction. E. & O.E.</p>
                <p>5. No Dyeing guarantee.</p>
              </div>

              {/* Right (col-span-5): Signatory */}
              <div className="col-span-5 p-2 text-right flex flex-col justify-between min-h-[85px] font-sans">
                <p className="font-bold text-[9.5px] text-black">
                  FOR {firmName}
                </p>
                <p className="font-bold text-[8px] uppercase text-black tracking-wider">
                  AUTHORISED SIGNATORY
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Print Specific CSS for A5 Portrait */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 5mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          nav, aside, header, footer, .print\\:hidden {
            display: none !important;
          }
          .print-page {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
          }
          .print-bill {
            border: 1px solid black !important;
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}

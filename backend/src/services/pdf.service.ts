import PDFDocument from "pdfkit";
import { Bill } from "../entities/bill.entity";
import { BillItem } from "../entities/bill-item.entity";
import { Response } from "express";
import { format } from "date-fns";
import path from "path";
import fs from "fs";

/**
 * PDFService generates PDF documents for bills/invoices using pdfkit.
 */
export class PDFService {
  /**
   * Format numbers in Indian format with K, Lakh, Cr abbreviations
   */
  static formatIndianCurrency(num: number): string {
    // Show as is for small amounts
    return num.toFixed(2);
  }

  /**
   * Truncate text to fit in specified width
   */
  static truncateText(text: string, maxLength: number): string {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  }

  /**
   * Generate a PDF for a bill and pipe it to the response.
   * @param bill The bill entity (with items)
   * @param res Express response object
   * @param organizationGstDetails Organization's GST details
   * @param customerGstDetails Customer's GST details
   */
  static async generateBillPDF(
    bill: Bill,
    res: Response,
    organizationGstDetails?: any,
    customerGstDetails?: any
  ): Promise<void> {
    // Create a new PDF document with more professional margins
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      bufferPages: true,
    });

    console.log("organizationGstDetails", organizationGstDetails);
    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${bill.billNumber || bill.id}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Use the built-in Helvetica font which is guaranteed to work
    doc.font("Helvetica");

    // Explicitly set text color to black for better print quality
    doc.fillColor("#000000");

    // Define page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Main border around the entire invoice (outer frame)
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();

    // Header section with gray background and large title
    doc.rect(30, 30, pageWidth - 60, 35).fillAndStroke("#e0e0e0", "#000000");
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(organizationGstDetails.name || "TEXAFLOW", 30, 38, {
        align: "center",
        width: pageWidth - 60,
      });

    // Company info section
    if (organizationGstDetails.address.organizationAddress) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000")
        .text(
          organizationGstDetails.address.organizationAddress.street +
            "," +
            organizationGstDetails.address.organizationAddress.city +
            "," +
            organizationGstDetails.address.organizationAddress.state +
            "," +
            organizationGstDetails.address.organizationAddress.country +
            "," +
            organizationGstDetails.address.organizationAddress.postalCode ||
            "Not Available",
          30,
          68,
          { align: "center", width: pageWidth - 60 }
        );
    } else {
      console.log(
        organizationGstDetails.address,
        organizationGstDetails.address
      );
    }
    doc.fontSize(10).text("Mo : " + organizationGstDetails.phone, 30, 87, {
      align: "right",
      width: pageWidth - 63,
    });

    // Invoice details section
    // Increase height for invoice details and buyer details
    const customerDetailsStartY = 98;
    const customerDetailsHeight = 90;
    const customerDetailsEndY = customerDetailsStartY + customerDetailsHeight;

    doc
      .rect(
        30,
        customerDetailsStartY,
        (pageWidth - 95) * 0.6,
        customerDetailsHeight + 25
      )
      .stroke();
    doc
      .rect(
        30 + (pageWidth - 95) * 0.6,
        customerDetailsStartY,
        (pageWidth - 7) * 0.4,
        customerDetailsHeight + 25
      )
      .fillAndStroke("#e0e0e0", "#000000");

    // Add organization GST number
    doc.fontSize(10).fillColor("#000000").text("GST No.", 40, 87);
    doc
      .font("Helvetica")
      .text(organizationGstDetails?.gstNumber || "Not Available", 100, 87);

    // Customer details section
    doc
      .font("Helvetica-Bold")
      .text("M/s :", 40, customerDetailsStartY + 30)
      .font("Helvetica");

    // Format customer address properly using available data
    const customerAddress = bill.billingAddress
      ? `${bill.customerName || ""},\n${bill.billingAddress.street || ""}\n${
          bill.billingAddress.city || ""
        }, ${bill.billingAddress.state || ""}\n${
          bill.billingAddress.zip || ""
        }, ${bill.billingAddress.country || ""}`
      : bill.customerName || "Party Name & Address";

    doc.text(customerAddress, 70, customerDetailsStartY + 30, {
      width: (pageWidth - 60) * 0.6 - 50,
      lineGap: 2,
    });

    // Invoice details on the right side
    doc
      .font("Helvetica-Bold")
      .fontSize(14) // Increase font size to 18 (adjust as needed)
      .text(
        "Tax Invoice",
        30 + (pageWidth - 60) * 0.6 + 10,
        customerDetailsStartY + 10
      );

    doc.font("Helvetica").fontSize(10);

    doc
      .font("Helvetica-Bold")
      .text(
        "INV NO.",
        30 + (pageWidth - 60) * 0.6 + 10,
        customerDetailsStartY + 30
      )
      .font("Helvetica")
      .text(
        PDFService.truncateText(bill.billNumber || bill.invoiceId || "", 15),
        30 + (pageWidth - 60) * 0.6 + 70,
        customerDetailsStartY + 30
      )
      .font("Helvetica-Bold")
      .text(
        "Date :",
        30 + (pageWidth - 60) * 0.6 + 10,
        customerDetailsStartY + 45
      )
      .font("Helvetica")
      .text(
        format(new Date(bill.issueDate), "dd/MM/yyyy"),
        30 + (pageWidth - 60) * 0.6 + 70,
        customerDetailsStartY + 45
      )
      .font("Helvetica-Bold")
      .text(
        "Due Date :",
        30 + (pageWidth - 60) * 0.6 + 10,
        customerDetailsStartY + 60
      )
      .font("Helvetica")
      .text(
        bill.dueDate ? format(new Date(bill.dueDate), "dd/MM/yyyy") : "-",
        30 + (pageWidth - 60) * 0.6 + 70,
        customerDetailsStartY + 60
      );

    // GST info row - positioned exactly at the end of customer details section
    // doc.rect(30, customerDetailsEndY, (pageWidth - 60) * 0.6, 25).stroke();
    // doc
    //   .rect(
    //     30 + (pageWidth - 95) * 0.6,
    //     customerDetailsEndY,
    //     (pageWidth - 8) * 0.4,
    //     25
    //   )
    //   .stroke();

    doc
      .font("Helvetica-Bold")
      .text("GST No.", 40, customerDetailsEndY + 10)
      .font("Helvetica")
      .text(
        customerGstDetails?.gstNumber || "Not Available",
        90,
        customerDetailsEndY + 10
      );

    // Get state code from GST number (first two digits) if available
    let stateCode = "";
    const customerGstNumber = customerGstDetails?.gstNumber || "";
    if (customerGstNumber && customerGstNumber.length >= 2) {
      stateCode = customerGstNumber.substring(0, 2);
    }

    console.log("State Code:", stateCode);

    doc
      .font("Helvetica-Bold")
      .text(
        "State Code :",
        30 + (pageWidth - 300) * 0.6 + 10,
        customerDetailsEndY + 10
      )
      .font("Helvetica")
      .text(
        stateCode || "N/A",
        30 + (pageWidth - 300) * 0.6 + 80,
        customerDetailsEndY + 10
      );

    // Table header (adjust position based on GST info row)
    const tableTop = customerDetailsEndY + 25;
    const colWidths = [30, 170, 40, 60, 60, 70, 105];
    const tableHeaders = [
      "No",
      "DESCRIPTION",
      "Qty",
      "Weight",
      "Cartoon",
      "Rate",
      "Amount",
    ];
    doc
      .rect(30, tableTop, pageWidth - 60, 25)
      .fillAndStroke("#e0e0e0", "#000000");
    let x = 30;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000000");
    for (let i = 0; i < colWidths.length; i++) {
      doc.text(tableHeaders[i], x + 5, tableTop + 8, {
        width: colWidths[i] - 10,
        align: i === 0 || i === 1 ? "left" : "center",
      });
      if (i > 0) {
        doc
          .moveTo(x, tableTop)
          .lineTo(x, tableTop + 25)
          .stroke();
      }
      x += colWidths[i];
    }
    doc
      .moveTo(x, tableTop)
      .lineTo(x, tableTop + 25)
      .stroke();

    // Table rows
    let yPos = tableTop + 25;
    let totalAmount = 0;
    let totalWeight = 0;
    (bill.items as BillItem[]).forEach((item, index) => {
      const unitPrice =
        typeof item.unitPrice === "number"
          ? item.unitPrice
          : Number(item.unitPrice);
      const quantity = item.quantity || 0;
      const itemTotal = Number(item.total);
      const weight = (item as any).weight || 0;
      totalAmount += itemTotal;
      totalWeight += weight;
      let xPos = 30;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#000000")
        .text(index + 1, xPos + 5, yPos + 7, {
          width: colWidths[0] - 10,
          align: "left",
        });
      xPos += colWidths[0];
      doc.text(
        PDFService.truncateText(item.description || "", 25),
        xPos + 5,
        yPos + 7,
        {
          width: colWidths[1] - 10,
          align: "left",
        }
      );
      xPos += colWidths[1];
      doc.text(quantity.toString(), xPos + 5, yPos + 7, {
        width: colWidths[2] - 10,
        align: "center",
      });
      xPos += colWidths[2];
      doc.text(weight.toFixed(2), xPos + 5, yPos + 7, {
        width: colWidths[3] - 10,
        align: "center",
      });
      xPos += colWidths[3];
      doc.text(item.carton, xPos + 5, yPos + 7, {
        width: colWidths[4] - 10,
        align: "center",
      });
      xPos += colWidths[4];
      doc.text(PDFService.formatIndianCurrency(unitPrice), xPos + 5, yPos + 7, {
        width: colWidths[5] - 10,
        align: "right",
      });
      xPos += colWidths[5];
      doc.text(PDFService.formatIndianCurrency(itemTotal), xPos + 5, yPos + 7, {
        width: colWidths[6] - 15,
        align: "right",
      });
      // Row borders
      let borderX = 30;
      for (let i = 0; i < colWidths.length; i++) {
        doc
          .moveTo(borderX, yPos)
          .lineTo(borderX, yPos + 25)
          .stroke();
        borderX += colWidths[i];
      }
      yPos += 25;
    });

    // Ensure the product list section is at least 60% of the page height
    const minProductListHeight = Math.floor(pageHeight * 0.6);
    if (yPos < minProductListHeight) {
      // Draw empty rows to fill up to 60% of the page
      while (yPos < minProductListHeight) {
        let borderX = 30;
        for (let i = 0; i < colWidths.length; i++) {
          doc
            .moveTo(borderX, yPos)
            .lineTo(borderX, yPos + 25)
            .stroke();
          borderX += colWidths[i];
        }
        yPos += 25;
      }
    }

    // Draw a horizontal line at the bottom of the product list section
    doc
      .moveTo(30, yPos)
      .lineTo(pageWidth - 30, yPos)
      .stroke();

    // Totals row
    let xPos = 30 + colWidths[0] + colWidths[1] + colWidths[2];
    doc
      .font("Helvetica-Bold")
      .text(totalWeight.toFixed(2), xPos + 5, yPos + 7, {
        width: colWidths[3] - 10,
        align: "center",
      });
    xPos = 30 + colWidths.slice(0, 6).reduce((a, b) => a + b, 0);
    doc
      .font("Helvetica-Bold")
      .text(PDFService.formatIndianCurrency(totalAmount), xPos + 5, yPos + 7, {
        width: colWidths[6] - 15,
        align: "right",
      });
    doc
      .moveTo(30, yPos + 25)
      .lineTo(pageWidth - 30, yPos + 25)
      .stroke();
    yPos += 25;

    // Positioning after total
    const bankDetailsY = doc.y + 20; // Add space after last line (total/subtotal)

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Bank Details", 35, bankDetailsY);

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        `Bank Name: ${
          organizationGstDetails.address.bankDetails.bankName || "Not Available"
        }`,
        35,
        bankDetailsY + 20
      )
      .text(
        `A/C Number: ${
          organizationGstDetails.address.bankDetails.accountNumber ||
          "Not Available"
        }`,
        35,
        bankDetailsY + 30
      )
      .text(
        `IFSC Code: ${
          organizationGstDetails.address.bankDetails.ifscCode || "Not Available"
        }`,
        35,
        bankDetailsY + 40
      )
      .text(
        `Branch: ${
          organizationGstDetails.address.bankDetails.branch || "Not Available"
        }`,
        35,
        bankDetailsY + 50
      );

    // Bank & totals section
    const bankBoxTop = yPos;
    const bankBoxHeight = 80;
    doc.rect(30, bankBoxTop, pageWidth - 60, bankBoxHeight).stroke();
    doc
      .moveTo(30 + (pageWidth - 60) - 250, bankBoxTop)
      .lineTo(30 + (pageWidth - 60) - 250, bankBoxTop + bankBoxHeight)
      .stroke();

    // Calculate positions for alignment
    const labelX = pageWidth - 250 + 10; // Add padding from the divider
    const valueX = pageWidth - 90; // Fixed position for right-aligned values
    const labelWidth = 100; // Width for labels
    const valueWidth = 75; // Width for values

    // Subtotal
    doc.font("Helvetica-Bold").text("Subtotal", labelX, bankBoxTop + 10, {
      width: labelWidth,
      align: "left",
    });

    doc
      .font("Helvetica")
      .text(
        PDFService.formatIndianCurrency(totalAmount),
        valueX,
        bankBoxTop + 10,
        { width: 50, align: "right" }
      );

    function calculateTaxRate(subtotal: number, tax: number): number {
      if (subtotal <= 0) {
        return 0; // Avoid division by zero
      }
      if (tax <= 0) {
        return 0; // Avoid division by zero
      }
      const taxRate = (tax / subtotal) * 100;
      return Number(taxRate.toFixed(2)); // returns rate rounded to 2 decimal places as a number
    }

    const gstRate = calculateTaxRate(bill.subtotal, bill.tax); // Default GST rate is 18%
    const gstAmount = totalAmount * (gstRate / 100);
    if (gstRate > 0) {
      // GST

      doc.font("Helvetica-Bold").text("GST", labelX, bankBoxTop + 30, {
        width: 50,
        align: "left",
      });

      doc
        .font("Helvetica")
        .text(
          `18% (${PDFService.formatIndianCurrency(gstAmount)})`,
          valueX,
          bankBoxTop + 30,
          { width: 50, align: "right" }
        );

      console.log("GST Amount", bill);
    }

    // Total Amount row (placed below the box)
    const totalRowY = bankBoxTop + bankBoxHeight + 10;

    // Define box dimensions
    const boxX = 30 + (pageWidth - 60) - 250;
    const boxY = bankBoxTop + 50;
    const boxWidth = pageWidth - 30 - boxX;
    const boxHeight = 30;
    doc
      .save() // Save current graphics state
      .rect(boxX, boxY, boxWidth, boxHeight)
      .fillColor("#f0f0f0")
      .fill();

    // Draw black border
    doc
      .restore() // Restore previous state (resets fill color to default)
      .lineWidth(1)
      .strokeColor("black")
      .rect(boxX, boxY, boxWidth, boxHeight)
      .stroke();

    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("Total Amount :", boxX + 10, boxY + 7, {
        width: boxWidth - 20,
        align: "left",
      });

    doc
      .font("Helvetica-Bold")
      .text(
        PDFService.formatIndianCurrency(totalAmount + gstAmount),
        valueX,
        bankBoxTop + 60,
        { width: 50, align: "right" }
      );

    // Terms and signature
    yPos += bankBoxHeight;
    doc.font("Helvetica-Bold").text("Terms and Conditions :", 40, yPos + 10);
    doc.font("Helvetica").fontSize(9);
    const terms = [...organizationGstDetails.termsAndConditions];
    let termYPos = yPos + 30;
    terms.forEach((term) => {
      doc.text(term, 40, termYPos);
      termYPos += 15;
    });
    // Signature section
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("FOR TEXAFLOW", pageWidth - 250, termYPos + 30, {
        align: "center",
        width: 210,
      });
    doc
      .font("Helvetica")
      .fontSize(11)
      .text("AUTHORISED SIGNATORY", pageWidth - 250, termYPos + 80, {
        align: "center",
        width: 210,
      });

    // Finalize the PDF and end the stream
    doc.end();
  }

  /**
   * Save PDF to file, ensuring directory exists
   */
  static async saveInvoicePDFToFile(
    bill: any,
    filename: string
  ): Promise<string> {
    // Ensure the invoices directory exists
    const invoicesDir = path.join(process.cwd(), "invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filePath = path.join(invoicesDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // ...generate PDF content as per your existing layout...
      // Example:
      // this.generatePDFContent(doc, bill);

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    });
  }
}

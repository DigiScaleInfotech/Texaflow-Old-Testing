import { Request, Response, NextFunction } from "express";
import { MediaService } from "../services/media.service";
import { getRepository } from "../config/database";
import { Document } from "../entities/document.entity";
import { DocumentType, DocumentStatus } from "../interface/document";

interface CustomRequest extends Request {
  user?: any;
  documentIds?: Record<string, string>;
  documentUrls?: Record<string, string>;
}

export async function documentUploadMiddleware(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Skip if no files
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next();
    }

    const documentUrls: Record<string, string> = {};
    const documentIds: Record<string, string> = {};

    // Process each file that matches document pattern
    const documentFiles = req.files.filter(
      (file) =>
        file.fieldname.startsWith("documents[") && file.fieldname.endsWith("]")
    );

    if (documentFiles.length > 0) {
      const documentRepository = getRepository(Document);

      // Create temporary documents (we'll update organization ID later)
      for (const file of documentFiles) {
        // Extract field key from fieldname (documents[name])
        const fieldNameMatch = file.fieldname.match(/documents\[(.*?)\]/);
        if (!fieldNameMatch || !fieldNameMatch[1]) continue;

        const fieldKey = fieldNameMatch[1];
        const documentLabels = req.body.documentLabels || {};
        const documentLabel = documentLabels[fieldKey] || "Document";

        // Determine document type based on field name or label
        let documentType = DocumentType.OTHER;
        if (/gst/i.test(fieldKey) || /gst/i.test(documentLabel)) {
          documentType = DocumentType.GST;
        } else if (/pan/i.test(fieldKey) || /pan/i.test(documentLabel)) {
          documentType = DocumentType.PAN;
        } else if (
          /business|registration|certificate/i.test(fieldKey) ||
          /business|registration|certificate/i.test(documentLabel)
        ) {
          documentType = DocumentType.BUSINESS_REGISTRATION;
        } else if (
          /id|proof/i.test(fieldKey) ||
          /id|proof/i.test(documentLabel)
        ) {
          documentType = DocumentType.ID_PROOF;
        } else if (
          /address/i.test(fieldKey) ||
          /address/i.test(documentLabel)
        ) {
          documentType = DocumentType.ADDRESS_PROOF;
        }

        // Upload the file using MediaService
        const uploadResult = await MediaService.uploadMedia(file, "document");

        documentUrls[file.fieldname] = uploadResult.url;

        // Create a temporary document entry (organization ID will be updated later)
        const document = documentRepository.create({
          name: documentLabel,
          originalName: file.originalname,
          path: uploadResult.path,
          url: uploadResult.url,
          mimeType: file.mimetype,
          size: file.size,
          documentType,
          status: DocumentStatus.PENDING,
          organizationId: "00000000-0000-0000-0000-000000000000", // Temporary value
          isActive: true,
        });

        // Save document to get an ID
        const savedDoc = await documentRepository.save(document);
        documentIds[file.fieldname] = savedDoc.id;
      }
    }

    // Attach document info to request
    req.documentUrls = documentUrls;
    req.documentIds = documentIds;

    next();
  } catch (error) {
    console.error("Document upload middleware error:", error);
    next(error);
  }
}

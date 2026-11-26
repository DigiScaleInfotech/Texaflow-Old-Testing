import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Document } from "../entities/document.entity";
import { DocumentStatus, DocumentType } from "../interface/document";
import { UserRole } from "../interface/user";

interface CustomRequest extends Request {
  user?: any;
}

export class DocumentController {
  /**
   * Get all documents for an organization
   */
  static async getDocuments(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId =
        req.params.organizationId || req.user?.organizationId;

      if (!organizationId) {
        res.status(400).json({ message: "Organization ID is required" });
        return;
      }

      // Check if user has permission
      if (
        req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN &&
        req.user.organizationId !== organizationId
      ) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      const documentRepository = getRepository(Document);

      const documents = await documentRepository.find({
        where: { organizationId, isActive: true },
        order: { createdAt: "DESC" },
      });

      res.json({ documents });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Error fetching documents" });
    }
  }

  /**
   * Get a specific document
   */
  static async getDocument(req: CustomRequest, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      const documentRepository = getRepository(Document);

      const document = await documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
      }

      // Check if user has permission
      if (
        req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN &&
        req.user.organizationId !== document.organizationId
      ) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      res.json({ document });
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Error fetching document" });
    }
  }

  /**
   * Update document status (for admins)
   */
  static async updateDocumentStatus(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const documentId = req.params.id;
      const { status, remarks } = req.body;

      // Only admins can update document status
      if (
        req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN
      ) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      if (!Object.values(DocumentStatus).includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }

      const documentRepository = getRepository(Document);
      const document = await documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
      }

      document.status = status;
      document.remarks = remarks;

      if (status === DocumentStatus.VERIFIED) {
        document.verifiedAt = new Date();
        document.verifiedBy = req.user.id;
      }

      await documentRepository.save(document);

      res.json({ message: "Document status updated", document });
    } catch (error) {
      console.error("Error updating document status:", error);
      res.status(500).json({ message: "Error updating document status" });
    }
  }

  /**
   * Delete document (mark as inactive)
   */
  static async deleteDocument(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const documentId = req.params.id;
      const documentRepository = getRepository(Document);

      const document = await documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
      }

      // Check if user has permission
      if (
        req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN &&
        req.user.organizationId !== document.organizationId
      ) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      // Mark as inactive instead of deleting
      document.isActive = false;
      await documentRepository.save(document);

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Error deleting document" });
    }
  }
}

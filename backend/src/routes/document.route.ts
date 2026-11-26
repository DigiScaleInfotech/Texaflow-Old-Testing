import { Router } from "express";
import { DocumentController } from "../controllers/document.controller";
import { authenticate } from "../middleware/auth.middleware";
import { documentUploadMiddleware } from "../middleware/document-upload.middleware";
import multer from "multer";

const router = Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, callback) => {
    // Accept only specific file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG are allowed."
        )
      );
    }
  },
});

// All routes need authentication
router.use(authenticate);

// Get all documents for an organization
router.get("/organization/:organizationId", DocumentController.getDocuments);

// Get all documents for current user's organization
router.get("/my-documents", DocumentController.getDocuments);

// Get specific document
router.get("/:id", DocumentController.getDocument);

// Upload documents
router.post("/upload", upload.any(), documentUploadMiddleware, (req, res) => {
  res.json({
    message: "Documents uploaded successfully",
    urls: (req as any).mediaUrls,
    documentIds: (req as any).documentIds,
  });
});

// Update document status (admin only)
router.patch("/:id/status", DocumentController.updateDocumentStatus);

// Delete document
router.delete("/:id", DocumentController.deleteDocument);

export default router;

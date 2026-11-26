import { Router } from "express";
import { MediaController } from "../controllers/media.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";

const router = Router();

// Apply auth middleware to all media routes
router.use(authenticate);

// GET routes
router.get("/", MediaController.getAllMedia);
router.get("/:id", MediaController.getMediaById);

// POST routes
router.post("/upload", mediaUploadMiddleware, MediaController.uploadMedia);
router.post(
  "/bulk-upload",
  mediaUploadMiddleware,
  MediaController.bulkUploadMedia
);

// DELETE routes
router.delete("/:id", MediaController.deleteMedia);

export default router;

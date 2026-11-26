import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";

const router = Router();

/**
 * Get current user profile
 */
router.get("/profile", authenticate, UserController.getProfile);

/**
 * Update user profile
 */
router.put(
  "/profile",
  authenticate,
  mediaUploadMiddleware,
  UserController.updateProfile
);

/**
 * Change password
 * @route PUT /users/change-password
 */
router.put("/change-password", authenticate, UserController.changePassword);

/**
 * Update user preferences
 */
router.put("/preferences", authenticate, UserController.updatePreferences);

export default router;

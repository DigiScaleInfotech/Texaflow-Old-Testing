import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mediaUploadMiddleware } from "../middleware/media-upload.middleware";
import { documentUploadMiddleware } from "../middleware/document-upload.middleware";
import multer from "multer";

const router = Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 10MB max file size
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

/**
 * Register a new vendor with document upload
 */
router.post(
  "/register/vendor", // Use the existing media upload middleware instead of fileUpload
  AuthController.registerVendor
);

/**
 * Login for vendor, admin, and super admin
 */
router.post("/login", AuthController.login);

/**
 * Refresh token
 */
router.post("/refresh-token", AuthController.refreshToken);

/**
 * Logout user
 */
router.post("/logout", AuthController.logout);

/**
 * Get current user - explicitly apply the authenticate middleware
 */
router.get("/me", authenticate, AuthController.getCurrentUser);

/**
 * Check username availability
 */
router.get("/check-username", AuthController.checkUsernameAvailability);

/**
 * Email verification endpoint
 */
router.get("/verify-email/:token", AuthController.verifyEmail);

/**
 * Resend email verification
 */
router.post(
  "/resend-verification-email",
  AuthController.resendVerificationEmail
);

/**
 * Forgot password - request reset email
 */
router.post("/forgot-password", AuthController.forgotPassword);

/**
 * Reset password with token
 */
router.post("/reset-password", AuthController.resetPassword);

/**
 * Verify email with code
 */
router.post("/verify-email-code", AuthController.verifyEmailCode);

/**
 * Check if email exists
 */
router.post("/check-email", AuthController.checkEmailExists);

/**
 * Send verification email
 */
router.post("/send-verification", AuthController.sendvarificationEmail);


router.post(
  "/verify-email-code-at-registration",
  AuthController.verifyEmailCodeForRegistration
);

export default router;

import { Request, Response, NextFunction } from "express";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";

// Ensure uploads directory exists
const TEMP_DIR = path.join(__dirname, "../../uploads/temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Multer file filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: any
) => {
  // Accept common document and image types
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

// Create multer upload instance
const uploadMulter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 10MB file size limit
  },
});

// Export middleware function
export const fileUpload = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadMulter.any();

  // Fix: Use proper multer callback type
  upload(req, res, function (err) {
    if (err) {
      console.error("File upload error:", err);
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(413)
            .json({ message: "File too large, maximum size is 10MB" });
        }
      }
      return res
        .status(400)
        .json({ message: err.message || "Error uploading files" });
    }
    next();
  });
};

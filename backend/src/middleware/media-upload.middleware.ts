import { Request, Response, NextFunction } from "express";
import { MediaService } from "../services/media.service";

// Supported media field names
const MEDIA_FIELDS = ["image", "video", "audio", "pdf", "doc"];

export async function mediaUploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let file: any = null;
    let mediaType: string | null = null;

    console.log("Media upload middleware triggered");
    console.log("Request files (multer):", req.file);
    console.log(
      "Request files (all fields):",
      req.files ? Object.keys(req.files) : "No files"
    );

    // Check for multer style file
    if (req.file && MEDIA_FIELDS.includes(req.file.fieldname)) {
      file = req.file;
      mediaType = req.file.fieldname;
      console.log("Found multer file:", file.fieldname);
    }
    // Check for express-fileupload style files
    else if (req.files) {
      let foundSupported = false;
      for (const field of Object.keys(req.files)) {
        // Skip doc0, doc1, ... fields (let controller handle them)
        if (/^doc\d+$/.test(field)) {
          continue;
        }
        if (MEDIA_FIELDS.includes(field)) {
          const fileData = (req.files as any)[field];
          file = Array.isArray(fileData) ? fileData[0] : fileData;
          mediaType = field;
          foundSupported = true;
          console.log(`Found file in '${field}' field:`, file.name);
          break;
        }
      }
      if (!foundSupported) {
        // Log all present file fields if none are supported
        const presentFields = Object.keys(req.files);
        if (presentFields.length > 0) {
          console.log(
            `Files present in request, but not in supported MEDIA_FIELDS: [${presentFields.join(
              ", "
            )}]`
          );
        }
      }
    }

    if (file && mediaType) {
      console.log(
        `Processing ${mediaType} file: ${
          file.name || file.originalname || "unnamed"
        }`
      );

      // Pass the entire file object to MediaService (not just the path)
      const uploadResult = await MediaService.uploadMedia(file, mediaType);

      // Attach the URL to req for downstream use
      (req as any).mediaUrl = uploadResult.url;
      console.log(`Media uploaded successfully. URL: ${uploadResult.url}`);
    } else {
      if (req.files && Object.keys(req.files).length > 0) {
        console.log(
          "No supported media file found in request, but files present:",
          Object.keys(req.files)
        );
      } else {
        console.log("No media file found in request");
      }
    }

    next();
  } catch (error) {
    console.error("Media upload middleware error:", error);
    // Continue despite error but with warning
    console.warn("Continuing without media upload");
    next();
  }
}

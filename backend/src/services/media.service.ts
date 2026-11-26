import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import * as path from "path";

// API configuration
const MEDIA_API_URL = process.env.MEDIA_API_URL || "http://147.93.107.73:4000";
const IMAGE_SERVER_URL =
  process.env.MEDIA_API_URL || "http://147.93.107.73:4000";

// Load API key from environment with proper logging to help with debugging
const API_KEY = process.env.IMAGE_SERVER_API_KEY || "";

// Add more detailed debugging to check API key
console.log(`API Key exists: ${Boolean(API_KEY)}`);
console.log(`API Key length: ${API_KEY.length}`);
console.log(`First 4 chars: ${API_KEY.substring(0, 4)}...`);
console.log(`Last 4 chars: ...${API_KEY.substring(API_KEY.length - 4)}`);

// Create authorization header with correct key
const AUTH_HEADER = `Bearer ${API_KEY}`;
console.log(`Authorization header created (length: ${AUTH_HEADER.length})`);

// Axios instance for API requests with default settings but without content-type
// This allows us to set content-type per request as needed
const mediaApi = axios.create({
  baseURL: MEDIA_API_URL,
  headers: {
    // Don't set Authorization here - we'll add it explicitly to each request
  },
  responseType: "json",
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

export class MediaService {
  /**
   * Upload media file (primarily using the image server API)
   */
  static async uploadMedia(
    file: any,
    type: string = "document",
    fordownload = false
  ): Promise<{ url: string; path: string }> {
    try {
      console.log(
        `Uploading ${type} via API`,
        file
          ? `File exists: ${file.name || file.originalname || "unnamed"}`
          : "No file"
      );

      if (!file) {
        throw new Error("No file provided");
      }

      // Try uploading to the image server first (preferred method)
      try {
        // Handle express-fileupload file format
        if (file.tempFilePath && file.mv && typeof file.mv === "function") {
          return await this.uploadExpressFileToImageServer(
            file,
            type,
            fordownload
          );
        }

        // Handle multer file format
        else if (file.buffer) {
          const result = await this.uploadToImageServer(
            file,
            type,
            fordownload
          );
          console.log("Media API upload successful:", result);
          return result;
        }

        // Handle files with data property (another express-fileupload format)
        else if (file.data) {
          return await this.uploadDataBufferToImageServer(
            file,
            type,
            fordownload
          );
        }

        // Final fallback for other file types
        throw new Error("Unsupported file format");
      } catch (apiError) {
        console.warn("Image server upload failed:", apiError);

        // Return a placeholder result with generated values
        const timestamp = Date.now();
        const filename =
          file.name || file.originalname || `unnamed-${timestamp}`;
        return {
          url: `/api/placeholder/${type}s/${timestamp}-${filename}`,
          path: `${type}s/${timestamp}-${filename}`,
        };
      }
    } catch (error) {
      console.error("Error uploading media:", error);

      // Return a placeholder result with generated values
      const timestamp = Date.now();
      let filename = "unnamed";

      try {
        filename = file?.name || file?.originalname || `unnamed-${timestamp}`;
      } catch (e) {
        console.error("Error getting filename:", e);
      }

      return {
        url: `/api/placeholder/${type}s/${timestamp}-${filename}`,
        path: `${type}s/${timestamp}-${filename}`,
      };
    }
  }

  /**
   * Upload a file with data buffer (common express-fileupload format)
   */
  private static async uploadDataBufferToImageServer(
    file: any,
    type: string,
    fordownload: boolean = false
  ): Promise<{ url: string; path: string }> {
    console.log(
      `Processing express-fileupload file with data buffer: ${file.name}`
    );
    const endpoint = `/media/upload/${type}`;

    // Create FormData object
    const formData = new FormData();

    // Add file data from buffer
    formData.append("file", file.data, {
      filename: file.name,
      contentType: file.mimetype,
    });

    // Add additional fields
    formData.append("type", type);
    if (fordownload) {
      formData.append("fordownload", "true");
    }

    // Set headers explicitly with proper API key
    const headers = {
      ...formData.getHeaders(),
      Authorization: AUTH_HEADER,
    };

    console.log(
      "Request headers:",
      JSON.stringify({
        ...headers,
        Authorization: headers.Authorization ? "Bearer ***" : "missing",
      })
    );

    // Use mediaApi instance with explicit headers
    const response = await mediaApi.post(endpoint, formData, { headers });

    return {
      url:
        response.data.url ||
        `${IMAGE_SERVER_URL}/${type}/${response.data.filename || file.name}`,
      path:
        response.data.path || `${type}s/${response.data.filename || file.name}`,
    };
  }

  /**
   * Upload to image server API
   */
  private static async uploadToImageServer(
    file: any,
    type: string,
    fordownload: boolean = false
  ): Promise<{ url: string; path: string }> {
    // Determine which endpoint to use based on file type
    const endpoint = `/media/upload/${type}`;
    const imageEndpoint = `/upload/image`;

    // Special handling for image-specific buffers (direct buffer upload)
    if (type === "image" && file.buffer) {
      try {
        console.log(
          `Sending image buffer directly to image server (${file.buffer.length} bytes)`
        );

        // Set headers explicitly with proper API key for JSON request
        const headers = {
          "Content-Type": "application/json",
          Authorization: AUTH_HEADER,
        };

        console.log(
          "Image upload headers:",
          JSON.stringify({
            ...headers,
            Authorization: headers.Authorization ? "Bearer ***" : "missing",
          })
        );

        // For images, we can send buffer directly to the dedicated image endpoint
        // Use mediaApi instance with explicit headers
        const response = await mediaApi.post(
          imageEndpoint,
          {
            buffer: file.buffer.toString("base64"),
            filename: file.originalname || `file-${Date.now()}.jpg`,
            mimetype: file.mimetype || "image/jpeg",
          },
          { headers }
        );

        console.log("Direct buffer upload response:", response.data);
        return {
          url: `${IMAGE_SERVER_URL}/${response.data}`,
          path: response.data,
        };
      } catch (error) {
        console.error("Direct buffer upload failed:", error);
        // Don't just fall through - we need to ensure we return something or rethrow
      }
    }

    // Create FormData object for file upload
    const formData = new FormData();

    // Handle different file formats using FormData approach
    if (file.buffer) {
      try {
        // For Multer style files with buffer, create a temporary file
        const tempDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFileName = `tmp-${Date.now()}-${
          file.originalname || "file.bin"
        }`;
        const tempFilePath = path.join(tempDir, tempFileName);

        // Write buffer to temp file
        fs.writeFileSync(tempFilePath, file.buffer);

        // Add the file from temp location
        const fileStream = fs.createReadStream(tempFilePath);
        formData.append("file", fileStream, {
          filename: file.originalname || `file-${Date.now()}`,
          contentType: file.mimetype,
        });

        // Add cleanup function
        const cleanup = () => {
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
              console.log(`Cleaned up temp file: ${tempFilePath}`);
            }
          } catch (e) {
            console.error("Error cleaning up temp file:", e);
          }
        };

        // Add other form fields
        formData.append("type", type);
        if (fordownload) {
          formData.append("fordownload", "true");
        }

        console.log(
          `Sending file via FormData: ${file.originalname || "unnamed"}`
        );

        // Set headers explicitly with proper API key
        const headers = {
          ...formData.getHeaders(),
          Authorization: AUTH_HEADER,
        };

        console.log(
          "Upload headers:",
          JSON.stringify({
            ...headers,
            Authorization: headers.Authorization ? "Bearer ***" : "missing",
          })
        );

        // Use mediaApi instance with explicit headers
        const response = await mediaApi.post(endpoint, formData, { headers });

        // Clean up temp file
        cleanup();

        console.log("Upload response:", response.data);
        return {
          url:
            response.data.url ||
            `${IMAGE_SERVER_URL}/${type}/${
              response.data.filename || "unnamed"
            }`,
          path:
            response.data.path ||
            `${type}s/${response.data.filename || "unnamed"}`,
        };
      } catch (error) {
        console.error("Error uploading file with buffer:", error);
        throw error;
      }
    } else if (file.data) {
      // Express-fileupload style file with data buffer
      const tempFileName = `tmp-${Date.now()}-${file.name || "upload"}`;
      const tempFilePath = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(tempFilePath)) {
        fs.mkdirSync(tempFilePath, { recursive: true });
      }

      const fullTempPath = path.join(tempFilePath, tempFileName);

      // Write buffer to temp file
      fs.writeFileSync(fullTempPath, file.data);

      // Add file from the temp location
      formData.append("file", fs.createReadStream(fullTempPath), {
        filename: file.name || `file-${Date.now()}`,
      });

      // Add cleanup function
      const cleanup = () => {
        try {
          if (fs.existsSync(fullTempPath)) {
            fs.unlinkSync(fullTempPath);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up temp file:", cleanupError);
        }
      };

      try {
        // Add type information
        formData.append("type", type);
        if (fordownload) {
          formData.append("fordownload", "true");
        }

        // Set headers explicitly with proper API key
        const headers = {
          ...formData.getHeaders(),
          Authorization: AUTH_HEADER,
        };

        // Use mediaApi instance with explicit headers
        const response = await mediaApi.post(endpoint, formData, { headers });

        // Clean up temp file
        cleanup();

        // Return result
        return {
          url:
            response.data.url ||
            `${IMAGE_SERVER_URL}/${type}/${
              response.data.filename || "unnamed"
            }`,
          path:
            response.data.path ||
            `${type}s/${response.data.filename || "unnamed"}`,
        };
      } catch (error) {
        // Clean up temp file even if there's an error
        cleanup();
        throw error;
      }
    }

    // Add a fallback return for cases where none of the conditions are met
    // This ensures all code paths return a value, as required by TypeScript
    throw new Error(
      "Unsupported file format: File must have either 'buffer' or 'data' property"
    );
  }

  /**
   * Special handler for express-fileupload files with tempPath
   */
  private static async uploadExpressFileToImageServer(
    file: any,
    type: string,
    fordownload: boolean = false
  ): Promise<{ url: string; path: string }> {
    console.log(
      `Processing express-fileupload file with tempFilePath: ${file.name}, temp: ${file.tempFilePath}`
    );

    // Check if temp file exists
    if (!fs.existsSync(file.tempFilePath)) {
      throw new Error(`Temp file does not exist: ${file.tempFilePath}`);
    }

    // Create a direct form data upload from the temp file
    const formData = new FormData();
    const endpoint = `/media/upload/${type}`;

    // Create readable stream from temp file
    const fileStream = fs.createReadStream(file.tempFilePath);

    // Add file to form data
    formData.append("file", fileStream, {
      filename: file.name || `file-${Date.now()}`,
      contentType: file.mimetype,
    });

    // Add type information
    formData.append("type", type);
    if (fordownload) {
      formData.append("fordownload", "true");
    }

    try {
      // Set headers explicitly with proper API key
      const headers = {
        ...formData.getHeaders(),
        Authorization: AUTH_HEADER,
      };

      // Use mediaApi instance with explicit headers
      const response = await mediaApi.post(endpoint, formData, { headers });

      // Return URL and path
      const result = response.data;
      console.log("Upload response:", result);
      return {
        url: result.url || `${IMAGE_SERVER_URL}/${type}/${file.name}`,
        path: result.path || `${type}s/${file.name}`,
      };
    } catch (error) {
      console.error("Error uploading file to image server:", error);
      throw error;
    }
  }

  /**
   * Get a list of media files from the API
   */
  static async getMediaList(
    type: string = "all",
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const response = await mediaApi.get("/media", {
        headers: { Authorization: AUTH_HEADER },
        params: { type, page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching media list:", error);
      return { results: [], total: 0 };
    }
  }

  /**
   * Get file URL from the API
   */
  static getMediaUrl(filename: string, type: string = "document"): string {
    return `${IMAGE_SERVER_URL}/${type}/${encodeURIComponent(filename)}`;
  }

  /**
   * Delete media from the server
   */
  static async deleteMedia(
    filename: string,
    type: string = "document"
  ): Promise<boolean> {
    try {
      console.log(`Attempting to delete ${type} file: ${filename}`);

      // Use mediaApi instance with explicit headers
      const response = await mediaApi.delete(`/delete/${type}/${filename}`, {
        headers: { Authorization: AUTH_HEADER },
      });

      console.log("Delete response:", response.data);
      return true;
    } catch (error) {
      console.error("Error deleting media:", error);
      throw error;
    }
  }
}

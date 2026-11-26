import { Request, Response } from "express";
import { getRepository } from "../config/database";
import { Media, MediaType } from "../entities/media.entity";
import { v4 as uuidv4 } from "uuid";
import { MediaService } from "../services/media.service";

// Custom request interface with user property
interface CustomRequest extends Request {
  user?: any;
  mediaUrl?: string;
}

export class MediaController {
  /**
   * Get all media with pagination and filtering
   */
  static async getAllMedia(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const search = req.query.search as string;

      const mediaRepository = getRepository(Media);

      // Build query for organization's media
      let queryBuilder = mediaRepository
        .createQueryBuilder("media")
        .where("media.organizationId = :organizationId", { organizationId });

      // Apply filters if provided
      if (type && type !== "all") {
        queryBuilder = queryBuilder.andWhere("media.type = :type", { type });
      }

      if (search) {
        queryBuilder = queryBuilder.andWhere(
          "(media.name ILIKE :search OR " + "media.originalName ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and sorting
      const results = await queryBuilder
        .orderBy("media.createdAt", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        results,
        total,
        currentPage: page,
        limit,
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Error fetching media" });
    }
  }

  /**
   * Get media by ID
   */
  static async getMediaById(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const mediaRepository = getRepository(Media);
      const media = await mediaRepository.findOne({
        where: { id, organizationId },
      });

      if (!media) {
        res.status(404).json({ message: "Media not found" });
        return;
      }

      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Error fetching media" });
    }
  }

  /**
   * Upload media file
   */
  static async uploadMedia(req: CustomRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const userId = req.user?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Get the uploaded file URL from middleware
      const mediaUrl = req.mediaUrl;

      if (!mediaUrl) {
        res.status(400).json({ message: "No media file was uploaded" });
        return;
      }

      // Extract file type from request (image, video, document, etc.)
      let fileType = "document";
      if (req.files && Object.keys(req.files).length > 0) {
        const fileKey = Object.keys(req.files)[0];
        if (fileKey.includes("image")) fileType = "image";
        if (fileKey.includes("video")) fileType = "video";
        if (fileKey.includes("audio")) fileType = "audio";
      }

      // Get the file object
      const fileKey = Object.keys(req.files || {})[0];
      const file = fileKey ? (req.files as any)[fileKey] : null;

      if (!file) {
        res.status(400).json({ message: "No file found in the request" });
        return;
      }

      // Create media record in database
      const mediaRepository = getRepository(Media);
      const media = mediaRepository.create({
        id: uuidv4(),
        name: file.name || `${fileType}-${Date.now()}`,
        originalName:
          file.originalname || file.name || `${fileType}-${Date.now()}`,
        url: mediaUrl,
        path: mediaUrl.replace(/^.*\/\/[^\/]+/, ""), // Remove domain
        type: fileType as MediaType,
        mimeType: file.mimetype || "application/octet-stream",
        size: file.size || 0,
        organizationId,
        uploadedById: userId,
      });

      await mediaRepository.save(media);

      res.status(201).json({
        message: "Media uploaded successfully",
        media,
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Error uploading media" });
    }
  }

  /**
   * Bulk upload multiple media files
   */
  static async bulkUploadMedia(
    req: CustomRequest,
    res: Response
  ): Promise<void> {
    try {
      const organizationId = req.user?.organization?.id;
      const userId = req.user?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      // Check if any files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).json({ message: "No files were uploaded" });
        return;
      }

      const count = parseInt(req.body.count || "0");
      const type = req.body.type || "image";

      if (count <= 0) {
        res.status(400).json({ message: "Invalid file count" });
        return;
      }

      const mediaRepository = getRepository(Media);
      const uploadedMedia = [];

      // Process each file in the request
      for (let i = 0; i < count; i++) {
        const fileKey = `${type}-${i}`;
        const file = (req.files as any)[fileKey];

        if (!file) continue;

        try {
          // Upload to media server
          const uploadResult = await MediaService.uploadMedia(file, type);

          // Create media record in database
          const media = mediaRepository.create({
            id: uuidv4(),
            name: file.name || `${type}-${Date.now()}-${i}`,
            originalName:
              file.originalname || file.name || `${type}-${Date.now()}-${i}`,
            url: uploadResult.url,
            path: uploadResult.path,
            type: type as MediaType,
            mimeType: file.mimetype || "application/octet-stream",
            size: file.size || 0,
            organizationId,
            uploadedById: userId,
          });

          await mediaRepository.save(media);
          uploadedMedia.push(media);
        } catch (fileError) {
          console.error(`Error processing file ${fileKey}:`, fileError);
        }
      }

      res.status(201).json({
        message: `${uploadedMedia.length} files uploaded successfully`,
        media: uploadedMedia,
      });
    } catch (error) {
      console.error("Error bulk uploading media:", error);
      res.status(500).json({ message: "Error bulk uploading media" });
    }
  }

  /**
   * Delete media
   */
  static async deleteMedia(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.id;

      if (!organizationId) {
        res
          .status(403)
          .json({ message: "Organization not found for this user" });
        return;
      }

      const mediaRepository = getRepository(Media);

      // Find the media item
      const media = await mediaRepository.findOne({
        where: { id, organizationId },
      });

      if (!media) {
        res.status(404).json({ message: "Media not found" });
        return;
      }

      // Try to delete from the media server first
      try {
        // Get the filename from the URL or path
        const filename = media.path.split("/").pop();

        if (filename) {
          await MediaService.deleteMedia(filename, media.type);
          console.log(`Deleted media from server: ${filename}`);
        }
      } catch (serverDeleteError : any) {
        console.warn(
          `Could not delete media from server: ${serverDeleteError.message}`
        );
        // Continue with database deletion even if server delete fails
      }

      // Delete the media record from the database
      await mediaRepository.remove(media);

      res.json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ message: "Error deleting media" });
    }
  }
}

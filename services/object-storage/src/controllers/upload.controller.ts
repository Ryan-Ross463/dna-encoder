import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import File from '../models/File';
import { fileExists } from '../utils/storage';

/**
 * UPLOAD FILE CONTROLLER
 * Handles file upload and saves metadata to database
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Check if file was uploaded by multer
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please provide a file in the request body with field name "file"',
      });
      return;
    }

    // 2. Get authenticated user ID
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User authentication required',
      });
      return;
    }

    // 3. Extract file information from multer
    const uploadedFile = req.file;
    const fileId = uuidv4(); // Generate unique file ID

    // 4. Verify file was saved to disk
    const diskFileExists = await fileExists(uploadedFile.filename);
    if (!diskFileExists) {
      res.status(500).json({
        success: false,
        error: 'File storage failed',
        message: 'File was not saved to disk properly',
      });
      return;
    }

    // 5. Create file metadata document in MongoDB
    const fileDocument = await File.create({
      fileId,
      ownerUserId: userId,
      originalFileName: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
      storageLocation: uploadedFile.filename, // UUID-based filename on disk
      storageType: 'local',
      isEncoded: false,
      status: 'uploaded',
    });

    console.log(`[Upload] File uploaded: ${fileId} by user ${userId}`);

    // 6. Return success response with file metadata
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        fileId: fileDocument.fileId,
        originalFileName: fileDocument.originalFileName,
        fileSize: fileDocument.fileSize,
        mimeType: fileDocument.mimeType,
        status: fileDocument.status,
        isEncoded: fileDocument.isEncoded,
        createdAt: fileDocument.createdAt,
      },
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: 'An error occurred while uploading the file',
    });
  }
};

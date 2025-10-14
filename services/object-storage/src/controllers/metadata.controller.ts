import { Request, Response } from 'express';
import File from '../models/File';
import { fileExists } from '../utils/storage';

/**
 * GET FILE METADATA CONTROLLER
 * Retrieves detailed metadata for a specific file
 */
export const getFileMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Get file ID from request parameters
    const { fileId } = req.params;

    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'Missing file ID',
        message: 'Please provide a file ID in the URL',
      });
      return;
    }

    // 2. Find file metadata in database
    const fileDocument = await File.findOne({ fileId })
      .select('-_id -__v') // Exclude MongoDB internal fields
      .lean(); // Return plain JavaScript object

    if (!fileDocument) {
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'No file found with the provided ID',
      });
      return;
    }

    // 3. Check if file exists on disk
    const diskFileExists = await fileExists(fileDocument.storageLocation);

    // 4. Add disk status to metadata
    const metadata = {
      ...fileDocument,
      diskStatus: diskFileExists ? 'available' : 'missing',
    };

    console.log(`[Metadata] Retrieved metadata for file: ${fileId}`);

    // 5. Return success response with metadata
    res.status(200).json({
      success: true,
      message: 'File metadata retrieved successfully',
      data: metadata,
    });
  } catch (error) {
    console.error('[Metadata] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Metadata retrieval failed',
      message: 'An error occurred while retrieving file metadata',
    });
  }
};

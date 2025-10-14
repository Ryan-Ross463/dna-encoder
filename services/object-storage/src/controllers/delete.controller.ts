import { Request, Response } from 'express';
import File from '../models/File';
import { fileExists, deleteFile as deleteFileFromDisk } from '../utils/storage';

/**
 * DELETE FILE CONTROLLER
 * Deletes file from disk and removes metadata from database. 
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
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
    const fileDocument = await File.findOne({ fileId });

    if (!fileDocument) {
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'No file found with the provided ID',
      });
      return;
    }

    // 3. Delete file from disk
    const diskFileExists = await fileExists(fileDocument.storageLocation);
    if (diskFileExists) {
      await deleteFileFromDisk(fileDocument.storageLocation);
      console.log(`[Delete] File removed from disk: ${fileDocument.storageLocation}`);
    } else {
      console.warn(`[Delete] File not found on disk: ${fileDocument.storageLocation}`);
    }

    // 4. Delete file metadata from database
    await File.deleteOne({ fileId });

    console.log(`[Delete] File deleted: ${fileId}`);

    // 5. Return success response
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      fileId,
    });
  } catch (error) {
    console.error('[Delete] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Delete failed',
      message: 'An error occurred while deleting the file',
    });
  }
};

import { Request, Response } from 'express';
import File from '../models/File';
import { fileExists, createFileReadStream } from '../utils/storage';

/**
 * DOWNLOAD FILE CONTROLLER
 * Streams file content to client
 */
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
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

    // 3. Verify file exists on disk
    const diskFileExists = await fileExists(fileDocument.storageLocation);
    if (!diskFileExists) {
      res.status(404).json({
        success: false,
        error: 'File not found on disk',
        message: 'File metadata exists but file is missing from storage',
      });
      return;
    }

    // 4. Set response headers for file download
    res.setHeader('Content-Type', fileDocument.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileDocument.fileSize);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileDocument.originalFileName)}"`
    );

    console.log(`[Download] Streaming file: ${fileId}`);

    // 5. Stream file to client
    const fileStream = createFileReadStream(fileDocument.storageLocation);
    
    fileStream.on('error', (error) => {
      console.error('[Download] Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Download failed',
          message: 'An error occurred while streaming the file',
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('[Download] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Download failed',
        message: 'An error occurred while downloading the file',
      });
    }
  }
};

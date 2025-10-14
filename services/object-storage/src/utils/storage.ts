import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';

/**
 * Storage utility functions for file operations
 * Handles saving, deleting, and managing files on the local filesystem
 */

// Folder where files are stored.
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

//Creates the upload directory if it doesn't exist and calls when the services starts. 
export const ensureUploadDir = async (): Promise<void> => {
  try {
    await fs.access(UPLOAD_DIR);
    console.log('[Storage] Upload directory exists:', UPLOAD_DIR);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log('[Storage] Upload directory created:', UPLOAD_DIR);
  }
};

 //Builds the full filesystem path for a given filename. 
export const getFilePath = (fileName: string): string => {
  return path.join(UPLOAD_DIR, fileName);
};

 //Saves the the provided buffer to a file on disk
export const saveFile = async (buffer: Buffer, fileName: string): Promise<string> => {
  const filePath = getFilePath(fileName);
  
  try {
    await fs.writeFile(filePath, buffer);
    console.log('[Storage] File saved:', filePath);
    return filePath;
  } catch (error) {
    console.error('[Storage] Error saving file:', error);
    throw new Error('Failed to save file to disk');
  }
};

 //Save a file from a stream (useful for large files with multer/busboy)
export const saveFileFromStream = async (
  sourceStream: NodeJS.ReadableStream,
  fileName: string
): Promise<string> => {
  const filePath = getFilePath(fileName);

  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(filePath);

    sourceStream.pipe(writeStream);

    writeStream.on('finish', () => {
      console.log('[Storage] File saved from stream:', filePath);
      resolve(filePath);
    });

    writeStream.on('error', (error) => {
      console.error('[Storage] Error saving file from stream:', error);
      reject(new Error('Failed to save file to disk'));
    });
  });
};

 //Delete a file from disk
export const deleteFile = async (fileName: string): Promise<void> => {
  const filePath = getFilePath(fileName);

  try {
    await fs.unlink(filePath);
    console.log('[Storage] File deleted:', filePath);
  } catch (error: any) {
    // If file doesn't exist, log but don't throw (idempotent delete).
    if (error.code === 'ENOENT') {
      console.warn('[Storage] File not found (already deleted?):', filePath);
      return;
    }
    console.error('[Storage] Error deleting file:', error);
    throw new Error('Failed to delete file from disk');
  }
};

 //Check if a file exists on disk
export const fileExists = async (fileName: string): Promise<boolean> => {
  const filePath = getFilePath(fileName);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

 //Get file stats (size, creation date, etc.)
export const getFileStats = async (fileName: string) => {
  const filePath = getFilePath(fileName);

  try {
    return await fs.stat(filePath);
  } catch (error) {
    console.error('[Storage] Error getting file stats:', error);
    throw new Error('Failed to get file information');
  }
};

 //Create a read stream for a file, useful for efficient downloadiing or streaming
export const createFileReadStream = (fileName: string): NodeJS.ReadableStream => {
  const filePath = getFilePath(fileName);
  return createReadStream(filePath);
};

 //Get the size of a file in bytes
export const getFileSize = async (fileName: string): Promise<number> => {
  const stats = await getFileStats(fileName);
  return stats.size;
};

/**
 Looks at all files in the upload directory and deletes any that are not in the provided set of valid filenames in the database.
 This is a maintenance function that should be run periodically.
 */
export const cleanupOrphanedFiles = async (validFileNames: Set<string>): Promise<number> => {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    let deletedCount = 0;

    for (const file of files) {
      if (!validFileNames.has(file)) {
        await deleteFile(file);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[Storage] Cleaned up ${deletedCount} orphaned files`);
    }

    return deletedCount;
  } catch (error) {
    console.error('[Storage] Error during cleanup:', error);
    throw new Error('Failed to cleanup orphaned files');
  }
};

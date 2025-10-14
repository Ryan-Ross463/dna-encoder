import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Multer middleware configuration for file uploads
 * Handles multipart/form-data file uploads with validation
 */

// Storage location and filename configurations.
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB default
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * destination: Folder where files are stored.
 * filename:how the files are named
 * Files are stored with UUID-based names to prevent collisions
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Save to upload directory
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: {uuid}{original-extension}
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    const uniqueFileName = `${fileId}${extension}`;
    cb(null, uniqueFileName);
  },
});

//Validates the file type based on MIME type. This is a filter function that accepts or rejects files.
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed MIME types
  const allowedTypes = [
    // Text files
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    
    // Video
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    
    // JSON/XML
    'application/json',
    'application/xml',
    'text/xml',
    
    // Binary (for DNA encoded files)
    'application/octet-stream',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    // Accept file
    cb(null, true);
  } else {
    // Reject file
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
};

//Prevents upload of files that exceed size limit or fail file filter.
//Multer errors are automatically caught by the global error handler in error.middleware.ts
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Allow only 1 file per request.
  },
  fileFilter,
});

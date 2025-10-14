import { Router } from 'express';
import { authenticate, requireOwnership } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  uploadFile,
  downloadFile,
  deleteFile,
  listUserFiles,
  getFileMetadata,
} from '../controllers';

const router = Router();

/**
 * FILE ROUTES
 * All routes for file operations in the object storage service
 * Base path: /api/files
 */

router.post('/upload', authenticate, upload.single('file'), uploadFile);

router.get('/', authenticate, listUserFiles);

router.get('/:fileId', authenticate, requireOwnership, getFileMetadata);

router.get('/:fileId/download', authenticate, requireOwnership, downloadFile);

router.delete('/:fileId', authenticate, requireOwnership, deleteFile);

export default router;

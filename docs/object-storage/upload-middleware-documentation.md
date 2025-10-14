# Upload Middleware Documentation

## Overview

The `upload.middleware.ts` module configures Multer for handling multipart/form-data file uploads in the Object Storage service. It provides file storage, validation, size limits, and comprehensive error handling.

**Location:** `services/object-storage/src/middleware/upload.middleware.ts`

**Purpose:** Handle file uploads from users, validate file types and sizes, generate unique filenames, and provide error handling for upload failures.

---

## Dependencies

```typescript
import multer from 'multer';        // File upload handling
import path from 'path';            // Path manipulation
import { v4 as uuidv4 } from 'uuid'; // Unique filename generation
```

---

## Configuration

### Environment Variables

```properties
UPLOAD_DIR=./uploads              # Directory for storing uploaded files
MAX_FILE_SIZE=104857600           # Maximum file size in bytes (100MB)
```

### Constants

```typescript
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
```

---

## Core Components

### 1. Storage Configuration

**Purpose:** Defines where and how files are stored on disk.

```typescript
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    const uniqueFileName = `${fileId}${extension}`;
    cb(null, uniqueFileName);
  },
});
```

**How It Works:**

1. **`destination()`** - Determines the folder where files are saved
   - Always saves to `UPLOAD_DIR` (default: `./uploads`)
   - Called for each uploaded file

2. **`filename()`** - Generates unique filenames to prevent collisions
   - Format: `{UUID}{original-extension}`
   - Example: `a3f7b2c9-1234-5678-90ab-cdef12345678.pdf`
   - Preserves original file extension (`.pdf`, `.jpg`, `.txt`, etc.)

**Why UUIDs?**
- ✅ Guaranteed uniqueness (no filename collisions)
- ✅ Security (users can't guess file names)
- ✅ No special characters or path traversal risks

---

### 2. File Type Validation (File Filter)

**Purpose:** Security layer that validates file types before accepting uploads.

```typescript
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [ /* ... */ ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // Accept file
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`)); // Reject
  }
};
```

**Allowed File Types (30+ MIME types):**

| Category | MIME Types | Extensions |
|----------|------------|------------|
| **Text Files** | `text/plain`, `text/csv`, `text/html`, `text/css`, `text/javascript` | .txt, .csv, .html, .css, .js |
| **Documents** | `application/pdf`, `application/msword`, `.docx`, `.xlsx` | .pdf, .doc, .docx, .xls, .xlsx |
| **Images** | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` | .jpg, .png, .gif, .webp, .svg |
| **Archives** | `application/zip`, `application/x-rar-compressed`, `application/x-7z-compressed` | .zip, .rar, .7z |
| **Video** | `video/mp4`, `video/mpeg`, `video/quicktime` | .mp4, .mpeg, .mov |
| **Audio** | `audio/mpeg`, `audio/wav`, `audio/ogg` | .mp3, .wav, .ogg |
| **Data** | `application/json`, `application/xml`, `text/xml` | .json, .xml |
| **Binary** | `application/octet-stream` | .bin, .dat (DNA encoded files) |

**How to Add New Types:**

```typescript
const allowedTypes = [
  // ... existing types ...
  'application/vnd.rar',  // Add new type here
];
```

**Security Benefits:**
- ✅ Prevents executable uploads (.exe, .sh, .bat)
- ✅ Blocks potentially dangerous files
- ✅ Validates MIME type (not just extension)

**Note:** MIME type is determined by the browser/client, not the file extension. For maximum security, consider using a library like `file-type` to verify actual file contents.

---

### 3. Multer Instance (Main Export)

**Purpose:** Configured multer instance ready to use in routes.

```typescript
export const upload = multer({
  storage,         // Where and how to store files
  limits: {
    fileSize: MAX_FILE_SIZE,  // Max 100MB per file
    files: 1,                 // Max 1 file per request
  },
  fileFilter,      // File type validation
});
```

**Configuration Options:**

- **`storage`** - Disk storage configuration (see above)
- **`limits.fileSize`** - Maximum file size (100MB = 104,857,600 bytes)
- **`limits.files`** - Maximum number of files per request (1 file)
- **`fileFilter`** - File type validation function

**Available Methods:**

```typescript
upload.single('file')      // Single file with field name 'file'
upload.array('files', 10)  // Multiple files (max 10)
upload.fields([...])       // Multiple fields with different names
upload.none()              // No files, only text fields
```

**Usage in Routes:**

```typescript
import { upload, handleMulterError } from '../middleware';

// Single file upload
router.post('/upload', 
  upload.single('file'),      // ← Multer processes upload
  handleMulterError,          // ← Handle any multer errors
  uploadController            // ← Your controller handles success
);
```

---

### 4. Error Handler (handleMulterError)

**Purpose:** Provides user-friendly error messages for upload failures.

```typescript
export const handleMulterError = (
  error: any,
  _req: Express.Request,
  res: any,
  next: any
) => { /* ... */ }
```

**Handled Error Types:**

| Error Code | HTTP Status | Reason | Response |
|------------|-------------|--------|----------|
| `LIMIT_FILE_SIZE` | 413 | File exceeds 100MB limit | "Maximum file size is 100MB" |
| `LIMIT_FILE_COUNT` | 400 | Too many files uploaded | "Only one file can be uploaded at a time" |
| `LIMIT_UNEXPECTED_FILE` | 400 | Wrong field name used | "The file field name must be 'file'" |
| File Filter Rejection | 400 | Invalid file type | "File type not allowed: {mimetype}" |
| Other Multer Errors | 400 | Various upload errors | Error message from multer |

**Error Response Format:**

```json
{
  "success": false,
  "error": "File too large",
  "message": "Maximum file size is 100MB"
}
```

**Usage Pattern:**

```typescript
router.post('/upload',
  upload.single('file'),       // 1. Try to upload
  handleMulterError,           // 2. Catch and format errors
  (req, res) => {              // 3. Success handler
    // File uploaded successfully
    const file = req.file;
  }
);
```

**Important:** Must be placed AFTER the multer middleware and BEFORE your controller.

---

## Complete Usage Examples

### Example 1: Single File Upload (Most Common)

```typescript
import { Router } from 'express';
import { upload, handleMulterError } from '../middleware';
import { uploadFile } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/upload',
  authenticate,              // 1. Verify user
  upload.single('file'),     // 2. Process file upload
  handleMulterError,         // 3. Handle upload errors
  uploadFile                 // 4. Save metadata to DB
);
```

**Client Request (Postman/cURL):**

```bash
curl -X POST http://localhost:3002/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

**In Controller (`uploadFile`):**

```typescript
export const uploadFile = async (req: Request, res: Response) => {
  // File is already uploaded to disk by multer
  const uploadedFile = req.file;
  
  console.log(uploadedFile.filename);      // UUID-based name
  console.log(uploadedFile.originalname);  // User's original filename
  console.log(uploadedFile.size);          // File size in bytes
  console.log(uploadedFile.mimetype);      // MIME type
  console.log(uploadedFile.path);          // Full path on disk
  
  // Save metadata to MongoDB
  // ...
};
```

---

### Example 2: Multiple Files Upload

```typescript
router.post('/upload-multiple',
  authenticate,
  upload.array('files', 5),    // Max 5 files
  handleMulterError,
  uploadMultipleFiles
);
```

**Update Configuration:**

```typescript
// In upload.middleware.ts, change:
limits: {
  fileSize: MAX_FILE_SIZE,
  files: 5,  // Allow 5 files instead of 1
}
```

**Client Request:**

```bash
curl -X POST http://localhost:3002/api/files/upload-multiple \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@file1.pdf" \
  -F "files=@file2.jpg" \
  -F "files=@file3.txt"
```

**In Controller:**

```typescript
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  console.log(`${files.length} files uploaded`);
  
  files.forEach(file => {
    console.log(file.filename, file.size);
  });
};
```

---

### Example 3: Mixed Fields (Files + Text)

```typescript
router.post('/upload-with-metadata',
  authenticate,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  handleMulterError,
  uploadWithMetadata
);
```

**In Controller:**

```typescript
export const uploadWithMetadata = async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  const mainFile = files['file'][0];
  const thumbnail = files['thumbnail'][0];
  
  // Also access text fields
  const description = req.body.description;
  const tags = req.body.tags;
};
```

---

## File Object Structure

When multer successfully processes a file, it adds a `file` object to `req`:

```typescript
req.file = {
  fieldname: 'file',                      // Form field name
  originalname: 'document.pdf',           // User's filename
  encoding: '7bit',                       // File encoding
  mimetype: 'application/pdf',            // MIME type
  destination: './uploads',               // Storage directory
  filename: 'a3f7...678.pdf',            // UUID-based name
  path: './uploads/a3f7...678.pdf',      // Full path
  size: 1048576                          // Size in bytes (1MB)
}
```

---

## Error Handling Flow

```
User Uploads File
    ↓
Multer Checks File Size → Too Large? → handleMulterError → 413 Response
    ↓                                         ↑
Multer Checks File Type → Invalid? ──────────┘
    ↓                                         ↑
Multer Saves to Disk → Disk Error? ──────────┘
    ↓
Success → Controller
```

---

## Security Considerations

### 1. File Type Validation

✅ **Current:** Validates MIME type sent by client
⚠️ **Limitation:** MIME type can be spoofed

**Enhancement (Optional):**

```bash
npm install file-type
```

```typescript
import { fileTypeFromBuffer } from 'file-type';

// In controller, after upload
const buffer = await fs.readFile(req.file.path);
const fileType = await fileTypeFromBuffer(buffer);

if (fileType?.mime !== req.file.mimetype) {
  // MIME type mismatch - potential spoof
  await deleteFile(req.file.filename);
  return res.status(400).json({ error: 'File type mismatch' });
}
```

### 2. File Size Limits

✅ **Protected:** Max 100MB enforced by multer
✅ **Configurable:** Change via `MAX_FILE_SIZE` environment variable

### 3. Filename Security

✅ **Safe:** Uses UUIDs (no user input in filenames)
✅ **No Path Traversal:** Multer handles path safely

### 4. Upload Directory

⚠️ **Ensure Directory Exists:** Called via `ensureUploadDir()` in `index.ts`

```typescript
// In index.ts startup
await ensureUploadDir();
```

### 5. Virus Scanning (Future Enhancement)

For production, consider integrating antivirus scanning:

```typescript
import ClamScan from 'clamscan';

const clamscan = await new ClamScan().init();
const { isInfected } = await clamscan.isInfected(req.file.path);

if (isInfected) {
  await deleteFile(req.file.filename);
  return res.status(400).json({ error: 'File contains malware' });
}
```

---

## Configuration Guide

### Increase File Size Limit

**In `.env`:**

```properties
# Allow 500MB files
MAX_FILE_SIZE=524288000
```

### Allow More File Types

**In `upload.middleware.ts`:**

```typescript
const allowedTypes = [
  // ... existing types ...
  'application/x-yaml',      // YAML files
  'text/markdown',           // Markdown files
];
```

### Allow Multiple Files

**In `upload.middleware.ts`:**

```typescript
limits: {
  fileSize: MAX_FILE_SIZE,
  files: 10,  // Allow up to 10 files
}
```

### Change Upload Directory

**In `.env`:**

```properties
# Store on different drive
UPLOAD_DIR=D:/FileStorage/Uploads

# Or absolute path
UPLOAD_DIR=/var/data/uploads
```

---

## Testing

### Test File Upload

```bash
# Upload a file
curl -X POST http://localhost:3002/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
```

### Test File Too Large

```bash
# Try uploading 200MB file (should fail with 413)
curl -X POST http://localhost:3002/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@large-file.zip"
```

### Test Invalid File Type

```bash
# Try uploading .exe file (should fail with 400)
curl -X POST http://localhost:3002/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@program.exe"
```

### Test Wrong Field Name

```bash
# Use 'document' instead of 'file' (should fail with 400)
curl -X POST http://localhost:3002/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@test.pdf"
```

---

## Troubleshooting

### Issue: "LIMIT_UNEXPECTED_FILE"

**Cause:** Wrong field name in form-data

**Solution:** Ensure field name is `file`:
```javascript
// Correct
formData.append('file', fileBlob);

// Wrong
formData.append('document', fileBlob);
```

### Issue: "File too large"

**Cause:** File exceeds 100MB limit

**Solution:** Increase `MAX_FILE_SIZE` in `.env` or compress file

### Issue: "File type not allowed"

**Cause:** MIME type not in `allowedTypes` array

**Solution:** Add MIME type to `allowedTypes` or convert file format

### Issue: "ENOENT: no such file or directory"

**Cause:** Upload directory doesn't exist

**Solution:** Ensure `ensureUploadDir()` is called on startup

---

## Performance Considerations

### Memory Usage

Multer uses **disk storage** (not memory storage), which means:
- ✅ Files are streamed directly to disk
- ✅ No memory buildup for large files
- ✅ Can handle 100MB+ files efficiently

### Concurrent Uploads

- Each upload is independent
- Multiple users can upload simultaneously
- File I/O is asynchronous (non-blocking)

### Disk Space

Monitor disk space regularly:

```bash
# Check available space (Windows)
Get-PSDrive C

# Check available space (Linux)
df -h
```

---

## Related Documentation

- [Storage Utilities Documentation](./storage-utilities-documentation.md) - File system operations
- [File Model Documentation](./file-model-documentation.md) - MongoDB file metadata schema
- [Auth Middleware Documentation](../user-management/middleware-documentation.md) - Authentication patterns

---

## Summary

The upload middleware provides:

✅ **Secure File Uploads** - Type validation, size limits, unique filenames
✅ **Comprehensive Error Handling** - User-friendly error messages
✅ **Flexible Configuration** - Environment-based settings
✅ **Production Ready** - Disk storage, UUID-based names, security best practices

**Next Steps:**
1. Use in routes: `router.post('/upload', upload.single('file'), ...)`
2. Handle uploaded files in controllers
3. Save file metadata to MongoDB
4. Test upload scenarios

---

**Last Updated:** October 13, 2025  
**Version:** 1.0.0  
**Author:** DNA Encoder Development Team

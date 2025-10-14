# Storage Utilities Documentation

## Overview

The `storage.ts` utility module provides a comprehensive set of functions for managing file operations on the local filesystem. This module is the foundation of the Object Storage service, handling all physical file storage, retrieval, and management operations.

**Location:** `services/object-storage/src/utils/storage.ts`

**Purpose:** Abstract filesystem operations from business logic, providing a clean interface for file management across the Object Storage service.

---

## Configuration

### Environment Variables

The storage utilities use the following environment variable:

```properties
UPLOAD_DIR=./uploads
```

- **Default:** `./uploads` (relative to the object-storage service root)
- **Absolute Path Example:** `c:\Projects\DNA Encoder\services\object-storage\uploads`
- **Production:** Can be changed to any directory (e.g., `D:\FileStorage`, `/data/uploads`)

---

## Core Functions

### 1. `ensureUploadDir()`

**Purpose:** Ensures the upload directory exists, creating it if necessary.

**When to Call:** 
- Once during service startup (already called in `index.ts`)
- Before running tests that require file storage

**Signature:**
```typescript
export const ensureUploadDir = async (): Promise<void>
```

**Behavior:**
- Checks if `UPLOAD_DIR` exists
- Creates the directory (and parent directories) if it doesn't exist
- Logs the result to console

**Example:**
```typescript
await ensureUploadDir();
// Console: [Storage] Upload directory exists: ./uploads
// OR
// Console: [Storage] Upload directory created: ./uploads
```

**Error Handling:**
- Throws if unable to create directory (e.g., permission issues)

---

### 2. `getFilePath(fileName)`

**Purpose:** Constructs the full absolute path for a file in the upload directory.

**Signature:**
```typescript
export const getFilePath = (fileName: string): string
```

**Parameters:**
- `fileName` - The name of the file (should be unique, typically UUID-based)

**Returns:** Full absolute path to the file

**Example:**
```typescript
const filePath = getFilePath('abc123-document.pdf');
// Returns: 'c:\Projects\DNA Encoder\services\object-storage\uploads\abc123-document.pdf'
```

**Usage:**
- Internal helper used by other storage functions
- Can be used to construct paths for logging or debugging

---

### 3. `saveFile(buffer, fileName)`

**Purpose:** Save file data (as Buffer) to disk.

**Signature:**
```typescript
export const saveFile = async (buffer: Buffer, fileName: string): Promise<string>
```

**Parameters:**
- `buffer` - File data as Node.js Buffer
- `fileName` - Unique filename to save as (e.g., `{uuid}-{originalName}.ext`)

**Returns:** Promise resolving to the full file path where the file was saved

**Example:**
```typescript
const fileBuffer = Buffer.from('Hello, DNA Encoder!');
const savedPath = await saveFile(fileBuffer, 'test-file.txt');
// Console: [Storage] File saved: c:\Projects\...\uploads\test-file.txt
// Returns: 'c:\Projects\DNA Encoder\services\object-storage\uploads\test-file.txt'
```

**Error Handling:**
- Throws `Error('Failed to save file to disk')` if write operation fails
- Logs errors to console before throwing

**Use Cases:**
- Saving uploaded files from multer
- Creating test files
- Saving encoded/decoded data

---

### 4. `saveFileFromStream(sourceStream, fileName)`

**Purpose:** Save file data from a readable stream (efficient for large files).

**Signature:**
```typescript
export const saveFileFromStream = async (
  sourceStream: NodeJS.ReadableStream,
  fileName: string
): Promise<string>
```

**Parameters:**
- `sourceStream` - Readable stream of file data
- `fileName` - Unique filename to save as

**Returns:** Promise resolving to the full file path where the file was saved

**Example:**
```typescript
import { createReadStream } from 'fs';

const sourceStream = createReadStream('source-file.pdf');
const savedPath = await saveFileFromStream(sourceStream, 'destination.pdf');
// Console: [Storage] File saved from stream: c:\Projects\...\uploads\destination.pdf
```

**When to Use:**
- Large file uploads (more memory efficient than loading entire file into buffer)
- Copying files from one location to another
- Processing files in chunks

**Error Handling:**
- Rejects promise if stream encounters an error
- Throws `Error('Failed to save file to disk')` on stream errors

---

### 5. `deleteFile(fileName)`

**Purpose:** Delete a file from disk.

**Signature:**
```typescript
export const deleteFile = async (fileName: string): Promise<void>
```

**Parameters:**
- `fileName` - The name of the file to delete

**Returns:** Promise that resolves when file is deleted

**Example:**
```typescript
await deleteFile('old-file.pdf');
// Console: [Storage] File deleted: c:\Projects\...\uploads\old-file.pdf
```

**Idempotent Behavior:**
- If file doesn't exist (ENOENT error), logs warning but doesn't throw
- Safe to call multiple times on the same file

**Error Handling:**
- Logs warning if file not found (already deleted)
- Throws `Error('Failed to delete file from disk')` for other errors (e.g., permission denied)

**Use Cases:**
- User deletes a file
- Cleanup after failed operations
- Removing temporary files

---

## Helper Functions

### 6. `fileExists(fileName)`

**Purpose:** Check if a file exists on disk.

**Signature:**
```typescript
export const fileExists = async (fileName: string): Promise<boolean>
```

**Parameters:**
- `fileName` - The name of the file to check

**Returns:** `true` if file exists, `false` otherwise

**Example:**
```typescript
const exists = await fileExists('document.pdf');
if (exists) {
  console.log('File found!');
} else {
  console.log('File not found!');
}
```

**Use Cases:**
- Pre-flight checks before downloading
- Validation in controllers
- Detecting orphaned database records

---

### 7. `getFileStats(fileName)`

**Purpose:** Get file statistics (size, creation date, modification date, etc.).

**Signature:**
```typescript
export const getFileStats = async (fileName: string)
```

**Parameters:**
- `fileName` - The name of the file

**Returns:** Promise resolving to Node.js `fs.Stats` object

**Stats Object Properties:**
- `size` - File size in bytes
- `birthtime` - Creation date
- `mtime` - Last modification date
- `atime` - Last access date
- `isFile()` - Returns true if it's a file
- `isDirectory()` - Returns true if it's a directory

**Example:**
```typescript
const stats = await getFileStats('document.pdf');
console.log(`File size: ${stats.size} bytes`);
console.log(`Created: ${stats.birthtime}`);
console.log(`Modified: ${stats.mtime}`);
```

**Error Handling:**
- Throws `Error('Failed to get file information')` if file doesn't exist or can't be accessed

**Use Cases:**
- Verifying file integrity
- Auditing file access
- Comparing database fileSize with actual disk size

---

### 8. `getFileSize(fileName)`

**Purpose:** Get just the file size in bytes (convenience wrapper around `getFileStats`).

**Signature:**
```typescript
export const getFileSize = async (fileName: string): Promise<number>
```

**Parameters:**
- `fileName` - The name of the file

**Returns:** Promise resolving to file size in bytes

**Example:**
```typescript
const sizeInBytes = await getFileSize('document.pdf');
console.log(`File size: ${sizeInBytes} bytes`);

// Convert to human-readable
const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
console.log(`File size: ${sizeInMB} MB`);
```

**Use Cases:**
- Quick size checks
- Validation before operations
- Updating database fileSize field

---

### 9. `createFileReadStream(fileName)`

**Purpose:** Create a readable stream for a file (efficient for downloading/streaming).

**Signature:**
```typescript
export const createFileReadStream = (fileName: string): NodeJS.ReadableStream
```

**Parameters:**
- `fileName` - The name of the file to stream

**Returns:** Readable stream for the file

**Example:**
```typescript
// In a download controller
const stream = createFileReadStream('document.pdf');
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
stream.pipe(res);
```

**When to Use:**
- Downloading files to users (memory efficient)
- Streaming large files
- Processing file contents in chunks

**Error Handling:**
- Stream will emit 'error' event if file doesn't exist or can't be read
- Controller should handle stream errors

---

## Maintenance Functions

### 10. `cleanupOrphanedFiles(validFileNames)`

**Purpose:** Remove files from disk that don't have corresponding database records (orphaned files).

**Signature:**
```typescript
export const cleanupOrphanedFiles = async (
  validFileNames: Set<string>
): Promise<number>
```

**Parameters:**
- `validFileNames` - Set of filenames that should exist (queried from database)

**Returns:** Promise resolving to the number of files deleted

**Example:**
```typescript
import { File } from '../models/File';

// Get all valid filenames from database
const dbFiles = await File.find({}, 'storageLocation');
const validFileNames = new Set(
  dbFiles.map(f => f.storageLocation.split('/').pop())
);

// Clean up orphaned files
const deletedCount = await cleanupOrphanedFiles(validFileNames);
console.log(`Cleaned up ${deletedCount} orphaned files`);
```

**When to Run:**
- Scheduled maintenance job (e.g., daily cron)
- After bulk deletions
- Manual cleanup via admin endpoint

**Use Cases:**
- Files left behind after failed deletions
- Database records deleted without cleaning disk
- Recovery from errors

**Error Handling:**
- Throws `Error('Failed to cleanup orphaned files')` if unable to read directory or delete files

---

## Storage Location

### Development (Local)

**Path:** `c:\Projects\DNA Encoder\services\object-storage\uploads\`

**Characteristics:**
- Files stored on local filesystem
- Easy to inspect and debug
- Not suitable for production (Railway containers are ephemeral)

**Benefits:**
- No external dependencies
- No costs
- Fast development cycle
- Direct file access for testing

**Limitations:**
- Files lost when Railway container restarts
- Cannot scale horizontally (multiple instances can't share filesystem)
- No redundancy or backup

### Production (Future - Cloud)

When deploying to Railway, consider migrating to cloud storage:

**Options:**
1. **AWS S3** - Industry standard, highly reliable
2. **Cloudflare R2** - S3-compatible, no egress fees
3. **Backblaze B2** - Cost-effective alternative
4. **Railway Volumes** - Persistent disk (limited scalability)

**Migration Path:**
The `File` model already has `storageType` field (`'local'` or `'cloud'`), making future migration straightforward.

---

## File Naming Convention

### Recommended Pattern

```typescript
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Generate unique filename
const fileId = uuidv4(); // e.g., 'abc123-def456-...'
const extension = path.extname(originalFileName); // e.g., '.pdf'
const uniqueFileName = `${fileId}${extension}`; // e.g., 'abc123-def456-....pdf'

// Save to disk
await saveFile(fileBuffer, uniqueFileName);
```

**Why UUIDs?**
- Guaranteed uniqueness (no collisions)
- Security (users can't guess other file names)
- Database-friendly (use as fileId)

**Benefits:**
- No filename conflicts
- No path traversal vulnerabilities (no `/`, `\`, `..` in filename)
- Consistent format

---

## Security Considerations

### 1. Path Traversal Prevention

✅ **Safe:** All functions use `path.join(UPLOAD_DIR, fileName)` which prevents directory traversal

❌ **Dangerous:** Never construct paths with string concatenation:
```typescript
// DON'T DO THIS
const filePath = UPLOAD_DIR + '/' + fileName; // Vulnerable!
```

### 2. Filename Validation

**Best Practice:** Validate filenames before using storage functions:

```typescript
// In controller
if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
  throw new Error('Invalid filename');
}
```

### 3. File Size Limits

**Recommendation:** Always check file size before saving:

```typescript
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB

if (buffer.length > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

### 4. File Type Validation

**Recommendation:** Validate MIME types and extensions:

```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];

if (!allowedTypes.includes(mimeType)) {
  throw new Error('File type not allowed');
}
```

---

## Error Handling Patterns

### Example Controller Usage

```typescript
import { saveFile, deleteFile, fileExists } from '../utils/storage';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const uniqueFileName = `${uuidv4()}${path.extname(req.file.originalname)}`;

    // Save to disk
    const filePath = await saveFile(req.file.buffer, uniqueFileName);

    // Save metadata to database
    const fileDoc = await File.create({
      fileId: uuidv4(),
      ownerUserId: req.userId,
      originalFileName: req.file.originalname,
      storageLocation: uniqueFileName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({ success: true, file: fileDoc });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up on error (idempotent delete)
    if (uniqueFileName) {
      await deleteFile(uniqueFileName).catch(console.error);
    }

    res.status(500).json({ error: 'Failed to upload file' });
  }
};
```

---

## Performance Considerations

### Memory Usage

| Function | Memory Usage | Best For |
|----------|--------------|----------|
| `saveFile(buffer)` | High (entire file in memory) | Small files (<10MB) |
| `saveFileFromStream(stream)` | Low (chunks) | Large files (>10MB) |
| `createFileReadStream()` | Low (chunks) | File downloads |

### Recommendations

1. **Small Files (<10MB):** Use `saveFile()` with buffer
2. **Large Files (>10MB):** Use `saveFileFromStream()` with streams
3. **Downloads:** Always use `createFileReadStream()` for efficient streaming

---

## Testing

### Example Test Setup

```typescript
import { ensureUploadDir, saveFile, fileExists, deleteFile } from './storage';

describe('Storage Utilities', () => {
  beforeAll(async () => {
    await ensureUploadDir();
  });

  test('should save and retrieve file', async () => {
    const testBuffer = Buffer.from('Test content');
    const fileName = 'test-file.txt';

    // Save
    await saveFile(testBuffer, fileName);

    // Check exists
    const exists = await fileExists(fileName);
    expect(exists).toBe(true);

    // Cleanup
    await deleteFile(fileName);
  });
});
```

---

## Logging

All functions log their operations to console with the `[Storage]` prefix:

```
[Storage] Upload directory exists: ./uploads
[Storage] File saved: c:\Projects\...\uploads\abc123.pdf
[Storage] File deleted: c:\Projects\...\uploads\abc123.pdf
[Storage] Cleaned up 3 orphaned files
```

**Production:** Consider using a proper logging library (e.g., Winston, Pino) instead of `console.log`

---

## Future Enhancements

### Cloud Storage Integration

When moving to production, consider adding cloud storage support:

```typescript
// Future: storage-cloud.ts
export const saveFileToS3 = async (buffer: Buffer, fileName: string) => {
  // AWS S3 upload logic
};

// Future: storage.ts (abstraction)
export const saveFile = async (buffer: Buffer, fileName: string) => {
  if (process.env.STORAGE_TYPE === 'cloud') {
    return saveFileToS3(buffer, fileName);
  } else {
    return saveFileToLocal(buffer, fileName);
  }
};
```

### Compression

Add file compression for storage efficiency:

```typescript
import zlib from 'zlib';

export const saveCompressedFile = async (buffer: Buffer, fileName: string) => {
  const compressed = await promisify(zlib.gzip)(buffer);
  return saveFile(compressed, `${fileName}.gz`);
};
```

### Checksums

Add file integrity verification:

```typescript
import crypto from 'crypto';

export const getFileChecksum = (fileName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createFileReadStream(fileName);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};
```

---

## Related Documentation

- [File Model Documentation](./file-model-documentation.md) - MongoDB schema for file metadata
- [Database Connection Setup](../user-management/mongodb-connection-setup.md) - MongoDB connection patterns
- [Middleware Documentation](../user-management/middleware-documentation.md) - Authentication middleware

---

## Summary

The storage utilities provide a robust, secure, and efficient foundation for file management in the Object Storage service. By abstracting filesystem operations, they make it easy to:

- Save and retrieve files
- Manage file lifecycle
- Maintain storage integrity
- Prepare for future cloud migration

**Next Steps:**
1. Configure Multer middleware for file uploads (Task 5)
2. Build file controllers using these utilities (Tasks 7-11)
3. Test file operations (Tasks 18-20)

---

**Last Updated:** October 13, 2025  
**Version:** 1.0.0  
**Author:** DNA Encoder Development Team

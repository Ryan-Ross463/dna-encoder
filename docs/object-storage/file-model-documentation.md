# File Model Documentation
## DNA Encoder - Object Storage Service

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Model Purpose](#model-purpose)
3. [Schema Structure](#schema-structure)
4. [Field Descriptions](#field-descriptions)
5. [Instance Methods](#instance-methods)
6. [Static Methods](#static-methods)
7. [Indexes & Performance](#indexes--performance)
8. [Usage Examples](#usage-examples)
9. [File Lifecycle States](#file-lifecycle-states)
10. [Best Practices](#best-practices)

---

## Overview

The **File Model** is the core database schema for the Object Storage Service in the DNA Encoder application. It tracks uploaded files, their metadata, storage locations, and DNA encoding status throughout the encoding/decoding pipeline.

**Location:** `services/object-storage/src/models/File.ts`

**Database:** MongoDB collection named `files` in the `dna-encoder` database

**Purpose:** Store metadata and status information for all files uploaded by users, enabling file management and DNA encoding operations.

---

## Model Purpose

### What Does This Model Do?

The File model serves multiple critical functions:

1. **File Tracking:** Keeps a record of all uploaded files with their metadata
2. **Ownership Management:** Associates each file with its owner (user)
3. **Storage Location:** Tracks where files are physically stored (local disk or cloud)
4. **Encoding Pipeline:** Monitors the DNA encoding/decoding process status
5. **Data Integrity:** Stores DNA sequence data and encoding metadata
6. **Access Control:** Enables ownership verification for secure file operations

### Why Do We Need This?

Unlike storing just files on disk, this model provides:
- **User isolation:** Each user can only access their own files
- **Status tracking:** Know if a file is being encoded, already encoded, or has errors
- **Metadata storage:** Quick access to file info without reading the actual file
- **Encoding history:** Track which encoding method was used (Fountain, Reed-Solomon, HEDGES)
- **Sequence storage:** Store DNA quaternary sequences (A, T, C, G) for encoded files

---

## Schema Structure

### Core Architecture

```typescript
interface IFile {
  // Identification
  fileId: string (UUID)
  ownerUserId: string (references User.userId)
  
  // File Metadata
  originalFileName: string
  fileSize: number (bytes)
  mimeType: string
  
  // Storage Information
  storageLocation: string
  storageType: 'local' | 'cloud'
  
  // DNA Encoding Information
  isEncoded: boolean
  encodedSize?: number
  encodingMethod?: 'fountain' | 'reed-solomon' | 'hedges'
  sequenceData?: string
  
  // Status & Timestamps
  status: 'uploaded' | 'encoding' | 'encoded' | 'decoding' | 'decoded' | 'error'
  createdAt: Date
  updatedAt: Date
}
```

---

## Field Descriptions

### Identification Fields

#### `fileId` (String, Required, Unique)
- **Type:** UUID v4
- **Purpose:** Unique identifier for each file
- **Auto-generated:** Yes (using `uuid` package)
- **Indexed:** Yes (primary lookup field)
- **Example:** `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`

#### `ownerUserId` (String, Required, Indexed)
- **Type:** UUID v4 (references `User.userId`)
- **Purpose:** Links file to its owner
- **Validation:** Must be a valid user ID
- **Usage:** For ownership verification and user file queries
- **Example:** `"f7e8d9c0-b1a2-3456-7890-abcdef123456"`

---

### File Metadata Fields

#### `originalFileName` (String, Required)
- **Purpose:** Original name of the uploaded file
- **Max Length:** 255 characters
- **Validation:** Trimmed, cannot be empty
- **Example:** `"research_data.txt"`, `"genome_sequence.fasta"`

#### `fileSize` (Number, Required)
- **Purpose:** File size in bytes
- **Validation:** Must be >= 0
- **Usage:** Display to users, enforce upload limits
- **Example:** `1048576` (1 MB), `524288000` (500 MB)

#### `mimeType` (String, Required)
- **Purpose:** File content type
- **Usage:** Set proper Content-Type headers for downloads
- **Common Values:**
  - Text: `"text/plain"`, `"text/csv"`
  - Images: `"image/png"`, `"image/jpeg"`
  - Binary: `"application/octet-stream"`
  - Documents: `"application/pdf"`, `"application/json"`

---

### Storage Information Fields

#### `storageLocation` (String, Required)
- **Purpose:** Path to file or cloud URL
- **Local Example:** `"uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890/file.txt"`
- **Cloud Example:** `"https://s3.amazonaws.com/bucket/key"`
- **Usage:** Read/delete file from storage

#### `storageType` (Enum, Required)
- **Values:** `'local'` or `'cloud'`
- **Default:** `'local'`
- **Purpose:** Determine where to read/write file
- **Current Implementation:** Local filesystem only (cloud support planned)

---

### DNA Encoding Fields

#### `isEncoded` (Boolean, Required)
- **Default:** `false`
- **Purpose:** Quick check if file has been encoded to DNA
- **Indexed:** Yes (for filtering encoded files)
- **Usage:** Filter encoded vs non-encoded files

#### `encodedSize` (Number, Optional)
- **Purpose:** Size of DNA sequence data in bytes
- **Only Set:** After successful encoding
- **Validation:** Must be >= 0
- **Comparison:** Can compare with `fileSize` to see encoding overhead

#### `encodingMethod` (Enum, Optional)
- **Values:** `'fountain'`, `'reed-solomon'`, or `'hedges'`
- **Purpose:** Which error correction method was used
- **Set During:** Encoding process
- **Usage:** Codec service needs to know which decoder to use

**Encoding Methods Explained:**
- **Fountain Code:** Best for handling oligo dropouts (missing data)
- **Reed-Solomon:** Strong block-level error correction
- **HEDGES:** Specialized for insertions/deletions (indels)

#### `sequenceData` (String, Optional)
- **Purpose:** The actual DNA sequences (A, T, C, G patterns)
- **Excluded by Default:** Yes (can be very large, 1MB+ for big files)
- **Must Explicitly Select:** Use `.select('+sequenceData')` to retrieve
- **Example:** `"ATCGATCGATCGTAGCTAGCTA..."`
- **Storage:** MongoDB can handle up to 16MB per document

---

### Status & Lifecycle Fields

#### `status` (Enum, Required)
- **Default:** `'uploaded'`
- **Values:** 
  - `'uploaded'` - File uploaded, ready for encoding
  - `'encoding'` - Currently being encoded to DNA
  - `'encoded'` - Successfully encoded to DNA sequences
  - `'decoding'` - Converting DNA sequences back to file
  - `'decoded'` - Successfully decoded from DNA
  - `'error'` - Error occurred during encoding/decoding
- **Indexed:** Yes (for status-based queries)
- **Usage:** Track progress, show user current state

#### `createdAt` (Date, Auto-generated)
- **Purpose:** When file was uploaded
- **Managed By:** Mongoose (timestamps: true)
- **Usage:** Sort files by upload date, audit trails

#### `updatedAt` (Date, Auto-generated)
- **Purpose:** Last modification time
- **Managed By:** Mongoose (automatically updated on save)
- **Usage:** Track when status changed or encoding completed

---

## Instance Methods

These methods can be called on a specific file document.

### `markAsEncoding()`
```typescript
async markAsEncoding(): Promise<IFile>
```

**Purpose:** Update file status to 'encoding' when encoding starts

**When to Use:** Codec service calls this before starting encoding

**Example:**
```typescript
const file = await File.findOne({ fileId: 'some-uuid' });
await file.markAsEncoding();
console.log(file.status); // 'encoding'
```

---

### `markAsEncoded(method, sequenceData, encodedSize)`
```typescript
async markAsEncoded(
  method: string,
  sequenceData: string,
  encodedSize: number
): Promise<IFile>
```

**Purpose:** Save encoding results after successful encoding

**Parameters:**
- `method`: Which encoding method was used ('fountain', 'reed-solomon', 'hedges')
- `sequenceData`: The DNA sequences (A, T, C, G string)
- `encodedSize`: Size of the sequence data in bytes

**When to Use:** Codec service calls this after encoding completes

**Example:**
```typescript
const file = await File.findOne({ fileId: 'some-uuid' });
await file.markAsEncoded(
  'fountain',
  'ATCGATCGATCG...',
  2048576
);
console.log(file.isEncoded); // true
console.log(file.encodingMethod); // 'fountain'
```

---

### `markAsDecoding()`
```typescript
async markAsDecoding(): Promise<IFile>
```

**Purpose:** Update file status to 'decoding' when decoding starts

**When to Use:** Codec service calls this before decoding DNA sequences

**Example:**
```typescript
const file = await File.findOne({ fileId: 'some-uuid' });
await file.markAsDecoding();
console.log(file.status); // 'decoding'
```

---

### `markAsDecoded()`
```typescript
async markAsDecoded(): Promise<IFile>
```

**Purpose:** Update file status to 'decoded' after successful decoding

**When to Use:** Codec service calls this after decoding completes

**Example:**
```typescript
const file = await File.findOne({ fileId: 'some-uuid' });
await file.markAsDecoded();
console.log(file.status); // 'decoded'
```

---

### `markAsError()`
```typescript
async markAsError(): Promise<IFile>
```

**Purpose:** Update file status to 'error' if encoding/decoding fails

**When to Use:** Codec service calls this if an error occurs

**Example:**
```typescript
try {
  // Attempt encoding
  await encodeFile(file);
} catch (error) {
  await file.markAsError();
  console.log(file.status); // 'error'
}
```

---

## Static Methods

These methods are called on the File model itself (not on instances).

### `findByOwner(ownerUserId)`
```typescript
static findByOwner(ownerUserId: string): Promise<IFile[]>
```

**Purpose:** Get all files belonging to a specific user

**Returns:** Array of files, sorted by newest first

**Example:**
```typescript
const userId = 'f7e8d9c0-b1a2-3456-7890-abcdef123456';
const userFiles = await File.findByOwner(userId);
console.log(`User has ${userFiles.length} files`);
```

---

### `findByFileId(fileId)`
```typescript
static findByFileId(fileId: string): Promise<IFile | null>
```

**Purpose:** Find a specific file by its fileId

**Returns:** File document or null if not found

**Example:**
```typescript
const file = await File.findByFileId('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
if (file) {
  console.log(`Found: ${file.originalFileName}`);
}
```

---

### `findEncodedByOwner(ownerUserId)`
```typescript
static findEncodedByOwner(ownerUserId: string): Promise<IFile[]>
```

**Purpose:** Get only encoded files for a specific user

**Returns:** Array of files where `isEncoded === true`

**Example:**
```typescript
const encodedFiles = await File.findEncodedByOwner(userId);
console.log(`User has ${encodedFiles.length} encoded files`);
```

---

## Indexes & Performance

### Why Indexes Matter

Indexes make queries faster by creating lookup tables. Without indexes, MongoDB would scan every document.

### Configured Indexes

1. **`fileId` (Single Field)**
   - **Purpose:** Fast lookup by file ID
   - **Used By:** Download, delete, metadata queries
   - **Performance:** O(log n) instead of O(n)

2. **`ownerUserId` (Single Field)**
   - **Purpose:** Fast lookup of user's files
   - **Used By:** List user files, ownership verification
   
3. **`ownerUserId + createdAt` (Compound Index)**
   - **Purpose:** Get user's files sorted by date
   - **Used By:** List files endpoint (sorted)
   - **Benefit:** Sort is already done by index

4. **`status + createdAt` (Compound Index)**
   - **Purpose:** Filter by status with date sorting
   - **Used By:** Admin queries, status monitoring

5. **`isEncoded` (Single Field)**
   - **Purpose:** Filter encoded vs non-encoded files
   - **Used By:** Encoded files list

### Query Performance Examples

**Without Index:** (Slow)
```
Scan 1,000,000 documents → Find match → 500ms
```

**With Index:** (Fast)
```
Index lookup → Jump to document → 5ms
```

---

## Usage Examples

### Example 1: Upload File
```typescript
import { File } from '../models';

// Create new file record after upload
const newFile = new File({
  ownerUserId: req.user.userId,
  originalFileName: 'data.txt',
  fileSize: 1024,
  mimeType: 'text/plain',
  storageLocation: 'uploads/abc123/data.txt',
  storageType: 'local',
  status: 'uploaded'
});

await newFile.save();
console.log('File uploaded:', newFile.fileId);
```

---

### Example 2: List User's Files
```typescript
import { File } from '../models';

// Get all files for logged-in user
const userId = req.user.userId;
const files = await File.findByOwner(userId);

res.json({
  success: true,
  count: files.length,
  data: files
});
```

---

### Example 3: Download File
```typescript
import { File } from '../models';
import fs from 'fs/promises';

// Find file and verify ownership
const file = await File.findByFileId(req.params.fileId);

if (!file) {
  return res.status(404).json({ error: 'File not found' });
}

if (file.ownerUserId !== req.user.userId) {
  return res.status(403).json({ error: 'Access denied' });
}

// Stream file to response
res.setHeader('Content-Type', file.mimeType);
res.setHeader('Content-Disposition', `attachment; filename="${file.originalFileName}"`);
res.sendFile(file.storageLocation);
```

---

### Example 4: Encode File
```typescript
import { File } from '../models';

// Find file to encode
const file = await File.findByFileId(fileId);

// Mark as encoding
await file.markAsEncoding();

try {
  // Perform encoding (pseudocode)
  const sequences = await fountainEncode(file.storageLocation);
  const sequenceData = sequences.join('');
  
  // Save encoding results
  await file.markAsEncoded(
    'fountain',
    sequenceData,
    sequenceData.length
  );
  
  console.log('Encoding complete!');
} catch (error) {
  await file.markAsError();
  throw error;
}
```

---

### Example 5: Get Encoded Files Only
```typescript
import { File } from '../models';

// Get all encoded files for user
const encodedFiles = await File.findEncodedByOwner(req.user.userId);

res.json({
  success: true,
  count: encodedFiles.length,
  data: encodedFiles.map(f => ({
    fileId: f.fileId,
    fileName: f.originalFileName,
    encodingMethod: f.encodingMethod,
    originalSize: f.fileSize,
    encodedSize: f.encodedSize,
    encodedAt: f.updatedAt
  }))
});
```

---

### Example 6: Retrieve Sequence Data
```typescript
import { File } from '../models';

// Sequence data is NOT included by default
const file = await File.findOne({ fileId });
console.log(file.sequenceData); // undefined

// Must explicitly select it
const fileWithSequences = await File.findOne({ fileId }).select('+sequenceData');
console.log(fileWithSequences.sequenceData); // "ATCGATCG..."
```

---

## File Lifecycle States

### State Diagram

```
┌──────────┐
│ uploaded │ ← Initial state after file upload
└────┬─────┘
     │
     ▼ (User requests encoding)
┌──────────┐
│ encoding │ ← Codec service processing
└────┬─────┘
     │
     ├──► (Success)
     │    ┌─────────┐
     └───►│ encoded │ ← DNA sequences stored
          └────┬────┘
               │
               ▼ (User requests decoding)
          ┌──────────┐
          │ decoding │ ← Converting back
          └────┬─────┘
               │
               ├──► (Success)
               │    ┌─────────┐
               └───►│ decoded │ ← File recovered
                    └─────────┘

     (Any step can fail)
               │
               ▼
          ┌───────┐
          │ error │ ← Error occurred
          └───────┘
```

### State Transitions

| From State | To State | Trigger | Method |
|------------|----------|---------|--------|
| uploaded | encoding | User starts encode | `markAsEncoding()` |
| encoding | encoded | Encoding succeeds | `markAsEncoded()` |
| encoding | error | Encoding fails | `markAsError()` |
| encoded | decoding | User starts decode | `markAsDecoding()` |
| decoding | decoded | Decoding succeeds | `markAsDecoded()` |
| decoding | error | Decoding fails | `markAsError()` |

---

## Best Practices

### 1. Always Verify Ownership

```typescript
// ✅ GOOD
const file = await File.findByFileId(fileId);
if (file.ownerUserId !== req.user.userId) {
  return res.status(403).json({ error: 'Forbidden' });
}

// ❌ BAD - Anyone can access any file
const file = await File.findByFileId(fileId);
res.sendFile(file.storageLocation);
```

---

### 2. Use Instance Methods for Status Updates

```typescript
// ✅ GOOD - Uses built-in method
await file.markAsEncoded('fountain', sequences, size);

// ❌ BAD - Manual updates, error-prone
file.status = 'encoded';
file.isEncoded = true;
file.encodingMethod = 'fountain';
file.sequenceData = sequences;
file.encodedSize = size;
await file.save();
```

---

### 3. Don't Load Sequence Data Unless Needed

```typescript
// ✅ GOOD - Only get metadata
const file = await File.findByFileId(fileId);
res.json({ fileName: file.originalFileName, size: file.fileSize });

// ❌ BAD - Loads huge sequence data unnecessarily
const file = await File.findByFileId(fileId).select('+sequenceData');
res.json({ fileName: file.originalFileName }); // sequenceData not even used!
```

---

### 4. Handle Errors Gracefully

```typescript
// ✅ GOOD
try {
  await encodeFile(file);
  await file.markAsEncoded(...);
} catch (error) {
  await file.markAsError();
  logger.error('Encoding failed:', error);
  throw error;
}

// ❌ BAD - Status never updated
try {
  await encodeFile(file);
  await file.markAsEncoded(...);
} catch (error) {
  // File stuck in 'encoding' status forever!
  throw error;
}
```

---

### 5. Use Static Methods for Queries

```typescript
// ✅ GOOD - Uses static method
const files = await File.findByOwner(userId);

// ❌ BAD - Manual query (works but less readable)
const files = await File.find({ ownerUserId: userId }).sort({ createdAt: -1 });
```

---

### 6. Clean Up Storage When Deleting

```typescript
// ✅ GOOD - Delete both database and file
const file = await File.findByFileId(fileId);
await fs.unlink(file.storageLocation); // Delete from disk
await file.deleteOne(); // Delete from database

// ❌ BAD - File orphaned on disk
const file = await File.findByFileId(fileId);
await file.deleteOne(); // Disk space wasted!
```

---

## Summary

The **File Model** is essential for:
- ✅ Tracking uploaded files and their metadata
- ✅ Managing file ownership and access control
- ✅ Monitoring DNA encoding pipeline progress
- ✅ Storing DNA sequence data efficiently
- ✅ Enabling file operations (upload, download, delete)

**Key Takeaways:**
1. Every file has a unique `fileId` and belongs to a `ownerUserId`
2. Files progress through states: uploaded → encoding → encoded → decoding → decoded
3. Use instance methods (`markAsEncoding`, etc.) to update status
4. Use static methods (`findByOwner`, etc.) to query files
5. Sequence data is large - only load when needed
6. Always verify ownership before file operations

---

**Next Steps:**
- Review the Object Storage Service API documentation
- Understand how controllers use this model
- Learn about file upload middleware (multer)
- See authentication and authorization patterns

---

*Last Updated: October 13, 2025*  
*DNA Encoder Project - Object Storage Service*

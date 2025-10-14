# File Conversion Service

## Overview
Converts any file type to binary strings and back. Works with text, images, videos, PDFs, etc.

## Location
`services/codec-service/src/services/file-conversion.service.ts`

## Functions

### `fileToBinary(buffer: Buffer): string`
**Purpose**: Converts file buffer to binary string

**Process**:
1. Read file as Buffer (array of bytes)
2. Convert each byte to 8-bit binary string
3. Concatenate all binary strings

**Example**:
```typescript
const file = Buffer.from("Hi");
const binary = fileToBinary(file);
// Result: "0100100001101001"
// 'H' (72) → "01001000"
// 'i' (105) → "01101001"
```

---

### `binaryToFile(binary: string): Buffer`
**Purpose**: Converts binary string back to file buffer

**Process**:
1. Split binary string into 8-bit chunks
2. Convert each chunk to byte (0-255)
3. Create Buffer from bytes

**Example**:
```typescript
const binary = "0100100001101001";
const file = binaryToFile(binary);
// Result: Buffer containing "Hi"
// "01001000" → 72 ('H')
// "01101001" → 105 ('i')
```

**Validation**:
- Binary must contain only 0s and 1s
- Length must be multiple of 8 (1 byte = 8 bits)

---

## Complete Round-Trip Example

```typescript
// Original file
const originalFile = Buffer.from("Hello");

// Convert to binary
const binary = fileToBinary(originalFile);
// Result: "0100100001100101011011000110110001101111"
// (40 bits = 5 bytes × 8)

// Convert back to file
const recoveredFile = binaryToFile(binary);
// Result: Buffer("Hello")

console.log(originalFile.equals(recoveredFile)); // true ✅
```

## Full Pipeline: File → DNA

```typescript
// Step 1: File to Binary
const file = Buffer.from("DNA!");
const binary = fileToBinary(file);
// "01000100010011100100000100100001"

// Step 2: Binary to DNA
const dna = binaryToQuaternary(binary);
// "ATCGTTCA..." (4 bytes = 32 bits = 16 DNA bases)

// === DNA synthesis and storage ===

// Step 3: DNA to Binary
const recoveredBinary = quaternaryToBinary(dna);
// "01000100010011100100000100100001"

// Step 4: Binary to File
const recoveredFile = binaryToFile(recoveredBinary);
// Buffer("DNA!") - Perfect reconstruction!
```

## Supported File Types
✅ **Text files** (.txt, .json, .xml)  
✅ **Images** (.jpg, .png, .gif)  
✅ **Documents** (.pdf, .docx)  
✅ **Videos** (.mp4, .avi)  
✅ **Archives** (.zip, .tar)  
✅ **Any binary data**

## Data Size
- **1 byte** = 8 bits = 4 DNA bases
- **1 KB file** = 8,000 bits = 4,000 DNA bases
- **1 MB file** = 8 million bits = 4 million DNA bases

## Key Points
✅ Lossless conversion  
✅ Universal (works with any file type)  
✅ Byte-aligned (8 bits per byte)  
✅ Perfect reconstruction  

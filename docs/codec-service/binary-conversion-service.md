# Binary Conversion Service

## Overview
Converts between binary strings and DNA quaternary sequences (A, T, C, G). This is the core encoding/decoding mechanism for DNA storage.

## Location
`services/codec-service/src/services/binary-conversion.service.ts`

## Functions

### `binaryToQuaternary(binary: string): string`
**Purpose**: Encodes binary data into DNA sequence (ENCODING)

**Mapping**:
- `00` → `A`
- `01` → `T`
- `10` → `C`
- `11` → `G`

**Example**:
```typescript
const binary = "00011011";
const dna = binaryToQuaternary(binary);
// Result: "ATCG"
// 00 → A, 01 → T, 10 → C, 11 → G
```

**Validation**:
- Input must contain only 0s and 1s
- Length must be even (automatically pads with '0' if odd)

---

### `quaternaryToBinary(quaternary: string): string`
**Purpose**: Decodes DNA sequence back to binary (DECODING)

**Mapping**:
- `A` → `00`
- `T` → `01`
- `C` → `10`
- `G` → `11`

**Example**:
```typescript
const dna = "ATCG";
const binary = quaternaryToBinary(dna);
// Result: "00011011"
// A → 00, T → 01, C → 10, G → 11
```

**Validation**:
- Input must contain only A, T, C, G (case-insensitive)

---

## Complete Round-Trip Example

```typescript
// Original binary
const original = "11001001";

// Encode to DNA
const dna = binaryToQuaternary(original);
// Result: "GACT"

// Decode back to binary
const recovered = quaternaryToBinary(dna);
// Result: "11001001"

console.log(original === recovered); // true ✅
```

## Data Efficiency
- **1 DNA base** = 2 bits of data
- **4 DNA bases** = 1 byte (8 bits)
- **1,000 bases** = 250 bytes
- **1 million bases** = 250 KB

## Key Points
✅ Lossless encoding/decoding  
✅ 2 bits per DNA base  
✅ Automatic padding for odd-length binary  
✅ Case-insensitive DNA input  

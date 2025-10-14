# Sequence Analysis Service

## Overview
Analyzes DNA sequences for quality issues that affect synthesis and sequencing accuracy. Ensures sequences are manufacturable and readable.

## Location
`services/codec-service/src/services/sequence-analysis.service.ts`

## Functions

### `calculateGCContent(sequence: string): number`
**Purpose**: Calculates percentage of G and C bases

**Why It Matters**: G-C pairs have 3 hydrogen bonds (strong), A-T pairs have 2 bonds (weak). Optimal balance ensures stable, workable DNA.

**Optimal Range**: 40-60%

**Example**:
```typescript
calculateGCContent("ATCG");
// A=0, T=0, C=1, G=1 → 2/4 = 50% ✅

calculateGCContent("AAAA");
// A=4, T=0, C=0, G=0 → 0/4 = 0% ❌ Too low!

calculateGCContent("GGGG");
// A=0, T=0, C=0, G=4 → 4/4 = 100% ❌ Too high!
```

---

### `detectHomopolymers(sequence: string, maxLength: number = 4)`
**Purpose**: Finds consecutive repeating bases (e.g., "AAAA")

**Why It Matters**: Sequencing machines struggle to count long repeats accurately, causing read errors.

**Safe Threshold**: ≤ 4 consecutive bases

**Example**:
```typescript
detectHomopolymers("ATCGAAAA", 4);
// No detection (4 A's is at threshold, not > 4)

detectHomopolymers("ATCGAAAAAA", 4);
// Result: [{ base: 'A', length: 6, position: 4 }] ❌

detectHomopolymers("ATCGATCG", 4);
// Result: [] ✅ No problematic runs
```

**Return Value**:
```typescript
Array<{
  base: string;      // Which base repeats (A, T, C, or G)
  length: number;    // How many consecutive
  position: number;  // Where it starts (0-indexed)
}>
```

---

### `validateSequenceQuality(sequence: string)`
**Purpose**: Comprehensive quality check with warnings and recommendations

**Example - Good Sequence**:
```typescript
validateSequenceQuality("ATCGATCG");
// Result:
{
  isValid: true,
  gcContent: 50.0,
  homopolymers: [],
  warnings: [],
  recommendations: []
}
// ✅ Ready for synthesis!
```

**Example - Problematic Sequence**:
```typescript
validateSequenceQuality("AAAAAATTTT");
// Result:
{
  isValid: false,
  gcContent: 0.0,
  homopolymers: [
    { base: 'A', length: 6, position: 0 }
  ],
  warnings: [
    "Low GC content: 0.0% (optimal: 40-60%)",
    "Found 1 problematic homopolymer run(s)"
  ],
  recommendations: [
    "Consider using different error correction method to balance GC content",
    "Long homopolymer runs may cause sequencing errors"
  ]
}
// ❌ Not suitable for synthesis
```

---

## Quality Issues Explained

### **GC Content Problems**

| GC % | Issue | Impact |
|------|-------|--------|
| < 40% | Too low | DNA is "floppy", hard to synthesize |
| 40-60% | Optimal ✅ | Stable and workable |
| > 60% | Too high | DNA strands stick together, hard to read |

### **Homopolymer Problems**

```
Real DNA:     "AAAAAAA" (7 A's)
Machine reads: "AAAAAA"  (6 A's) ❌ Count error!

Real DNA:     "TTTT" (4 T's)
Machine reads: "TTTTT" (5 T's) ❌ Extra base!
```

**Safe lengths**: ≤ 4 bases  
**Dangerous**: > 4 bases

---

## Integration Example

```typescript
// After encoding file to DNA
const file = Buffer.from("Important Data");
const binary = fileToBinary(file);
const dna = binaryToQuaternary(binary);

// Check quality before synthesis
const quality = validateSequenceQuality(dna);

if (quality.isValid) {
  console.log("✅ Sequence ready for synthesis!");
  // Send to DNA synthesis lab
} else {
  console.log("⚠️ Quality issues detected:");
  console.log(quality.warnings);
  console.log("\nRecommendations:");
  console.log(quality.recommendations);
  // Apply error correction or re-encode
}
```

## Key Points
✅ Prevents synthesis failures  
✅ Ensures accurate sequencing  
✅ Detects problematic patterns  
✅ Provides actionable recommendations  

## Summary
This service acts as **quality control** for DNA sequences, catching issues before expensive synthesis and sequencing operations.

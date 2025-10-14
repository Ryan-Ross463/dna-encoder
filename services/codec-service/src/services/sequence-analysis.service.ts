/**
 * DNA QUALITY ANALYSIS SERVICE
 * Analyzes DNA sequences for synthesis and sequencing quality issues
 */

/**
 * CALCULATE GC CONTENT
 * Calculates the percentage of G and C bases in a DNA sequence
 * Important for DNA synthesis quality (optimal range: 40-60%)
 * calculateGCContent("ATCG") → 50.0
 * calculateGCContent("AAAA") → 0.0
 */
export function calculateGCContent(sequence: string): number {
  if (!sequence || sequence.length === 0) {
    return 0;
  }

  const upperSequence = sequence.toUpperCase();
  let gcCount = 0;

  for (const base of upperSequence) {
    if (base === 'G' || base === 'C') {
      gcCount++;
    }
  }

  const gcPercentage = (gcCount / sequence.length) * 100;
  return Math.round(gcPercentage * 100) / 100; // Round to 2 decimal places
}

/**
 * DETECT HOMOPOLYMER RUNS
 * Detects consecutive repeats of the same base (e.g., "AAAA")
 * Long homopolymer runs (>3-4 bases) can cause sequencing errors
 * detectHomopolymers("ATCGAAAA") → [{ base: 'A', length: 4, position: 4 }]
 */
export function detectHomopolymers(
  sequence: string,
  maxLength: number = 4
): Array<{ base: string; length: number; position: number }> {
  const upperSequence = sequence.toUpperCase();
  const homopolymers: Array<{ base: string; length: number; position: number }> = [];

  let currentBase = '';
  let currentLength = 0;
  let currentPosition = 0;

  for (let i = 0; i < upperSequence.length; i++) {
    const base = upperSequence[i];

    if (base === currentBase) {
      currentLength++;
    } else {
      // Check if previous run exceeded max length
      if (currentLength > maxLength) {
        homopolymers.push({
          base: currentBase,
          length: currentLength,
          position: currentPosition,
        });
      }

      // Start new run
      currentBase = base;
      currentLength = 1;
      currentPosition = i;
    }
  }

  // Check last run
  if (currentLength > maxLength) {
    homopolymers.push({
      base: currentBase,
      length: currentLength,
      position: currentPosition,
    });
  }

  return homopolymers;
}

/**
 * VALIDATE DNA SEQUENCE QUALITY
 * Performs comprehensive quality checks on DNA sequence
 */
export function validateSequenceQuality(sequence: string): {
  isValid: boolean;
  gcContent: number;
  homopolymers: Array<{ base: string; length: number; position: number }>;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Calculate GC content
  const gcContent = calculateGCContent(sequence);

  if (gcContent < 40) {
    warnings.push(`Low GC content: ${gcContent}% (optimal: 40-60%)`);
    recommendations.push('Consider using different error correction method to balance GC content');
  } else if (gcContent > 60) {
    warnings.push(`High GC content: ${gcContent}% (optimal: 40-60%)`);
    recommendations.push('High GC content may increase synthesis difficulty');
  }

  // Detect homopolymers
  const homopolymers = detectHomopolymers(sequence);

  if (homopolymers.length > 0) {
    warnings.push(`Found ${homopolymers.length} problematic homopolymer run(s)`);
    recommendations.push('Long homopolymer runs may cause sequencing errors');
  }

  const isValid = warnings.length === 0;

  return {
    isValid,
    gcContent,
    homopolymers,
    warnings,
    recommendations,
  };
}

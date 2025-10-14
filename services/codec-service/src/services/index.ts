/**
 * SERVICES INDEX
 * Central export point for all codec services
 */

// Binary ↔ Quaternary conversion
export {
  binaryToQuaternary,
  quaternaryToBinary,
} from './binary-conversion.service';

// File ↔ Binary conversion
export {
  fileToBinary,
  binaryToFile,
} from './file-conversion.service';

// DNA sequence analysis
export {
  calculateGCContent,
  detectHomopolymers,
  validateSequenceQuality,
} from './sequence-analysis.service';

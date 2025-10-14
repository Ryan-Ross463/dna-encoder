/**
 * BINARY-QUATERNARY CONVERSION SERVICE
 * Core binary ↔ DNA base conversion functions
 * 
 * Mapping Standard:
 * - 00 → A (Adenine)
 * - 01 → T (Thymine)
 * - 10 → C (Cytosine)
 * - 11 → G (Guanine)
 */

/**
 * BINARY TO QUATERNARY MAPPING
 * Converts binary string (0s and 1s) to DNA sequence (A, T, C, G)
 */
export function binaryToQuaternary(binary: string): string {
  // 1. Validate input
  if (!binary || typeof binary !== 'string') {
    throw new Error('Invalid input: binary must be a non-empty string');
  }

  if (!/^[01]+$/.test(binary)) {
    throw new Error('Invalid input: binary string must contain only 0s and 1s');
  }

  // 2. Ensure even length (pad with trailing 0 if odd)
  let paddedBinary = binary;
  if (binary.length % 2 !== 0) {
    paddedBinary = binary + '0';
    console.warn(`[Mapping] Binary length was odd (${binary.length}), padded with trailing 0`);
  }

  // 3. Convert binary pairs to DNA bases
  let dnaSequence = '';
  
  for (let i = 0; i < paddedBinary.length; i += 2) {
    const pair = paddedBinary.substring(i, i + 2);
    
    switch (pair) {
      case '00':
        dnaSequence += 'A';
        break;
      case '01':
        dnaSequence += 'T';
        break;
      case '10':
        dnaSequence += 'C';
        break;
      case '11':
        dnaSequence += 'G';
        break;
      default:
        throw new Error(`Invalid binary pair: ${pair} at position ${i}`);
    }
  }

  console.log(`[Mapping] Binary → Quaternary: ${binary.length} bits → ${dnaSequence.length} bases`);
  return dnaSequence;
}

/**
 * QUATERNARY TO BINARY MAPPING
 * Converts DNA sequence (A, T, C, G) back to binary string (0s and 1s)
 * 
 */
export function quaternaryToBinary(sequence: string): string {
  // 1. Validate input
  if (!sequence || typeof sequence !== 'string') {
    throw new Error('Invalid input: sequence must be a non-empty string');
  }

  const upperSequence = sequence.toUpperCase();

  if (!/^[ATCG]+$/.test(upperSequence)) {
    throw new Error('Invalid input: DNA sequence must contain only A, T, C, G characters');
  }

  // 2. Convert DNA bases to binary pairs
  let binaryString = '';

  for (let i = 0; i < upperSequence.length; i++) {
    const base = upperSequence[i];

    switch (base) {
      case 'A':
        binaryString += '00';
        break;
      case 'T':
        binaryString += '01';
        break;
      case 'C':
        binaryString += '10';
        break;
      case 'G':
        binaryString += '11';
        break;
      default:
        throw new Error(`Invalid DNA base: ${base} at position ${i}`);
    }
  }

  console.log(`[Mapping] Quaternary → Binary: ${sequence.length} bases → ${binaryString.length} bits`);
  return binaryString;
}

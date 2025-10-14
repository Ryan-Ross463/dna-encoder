/**
 * MAPPING SERVICE TESTS
 * Simple manual tests to verify binary ↔ quaternary conversion
 */

import {
  binaryToQuaternary,
  quaternaryToBinary,
  fileToBinary,
  binaryToFile,
  calculateGCContent,
  detectHomopolymers,
  validateSequenceQuality,
} from './index';

console.log('='.repeat(60));
console.log('MAPPING SERVICE TESTS');
console.log('='.repeat(60));

// Test 1: Basic Binary to Quaternary
console.log('\n[Test 1] Binary → Quaternary');
console.log('Input:  00011011');
console.log('Output:', binaryToQuaternary('00011011'));
console.log('Expected: ATCG');

// Test 2: Basic Quaternary to Binary
console.log('\n[Test 2] Quaternary → Binary');
console.log('Input:  ATCG');
console.log('Output:', quaternaryToBinary('ATCG'));
console.log('Expected: 00011011');

// Test 3: Round-trip conversion
console.log('\n[Test 3] Round-trip Test');
const originalBinary = '11001001';
const dnaSequence = binaryToQuaternary(originalBinary);
const reconstructedBinary = quaternaryToBinary(dnaSequence);
console.log('Original:     ', originalBinary);
console.log('DNA:          ', dnaSequence);
console.log('Reconstructed:', reconstructedBinary);
console.log('Match:', originalBinary === reconstructedBinary ? '✅' : '❌');

// Test 4: File to Binary and back
console.log('\n[Test 4] File ↔ Binary');
const testText = 'Hello';
const buffer = Buffer.from(testText);
const binary = fileToBinary(buffer);
const reconstructedBuffer = binaryToFile(binary);
const reconstructedText = reconstructedBuffer.toString();
console.log('Original:     ', testText);
console.log('Binary:       ', binary);
console.log('Reconstructed:', reconstructedText);
console.log('Match:', testText === reconstructedText ? '✅' : '❌');

// Test 5: Complete Pipeline (File → Binary → DNA → Binary → File)
console.log('\n[Test 5] Complete Pipeline');
const originalText = 'DNA!';
const originalBuffer = Buffer.from(originalText);
const step1Binary = fileToBinary(originalBuffer);
const step2DNA = binaryToQuaternary(step1Binary);
const step3Binary = quaternaryToBinary(step2DNA);
const step4Buffer = binaryToFile(step3Binary);
const finalText = step4Buffer.toString();
console.log('1. Original Text:', originalText);
console.log('2. Binary:       ', step1Binary);
console.log('3. DNA Sequence: ', step2DNA);
console.log('4. Binary:       ', step3Binary);
console.log('5. Final Text:   ', finalText);
console.log('Match:', originalText === finalText ? '✅' : '❌');

// Test 6: GC Content
console.log('\n[Test 6] GC Content Calculation');
console.log('ATCG     →', calculateGCContent('ATCG') + '%', '(Expected: 50%)');
console.log('AAAA     →', calculateGCContent('AAAA') + '%', '(Expected: 0%)');
console.log('GCGC     →', calculateGCContent('GCGC') + '%', '(Expected: 100%)');

// Test 7: Homopolymer Detection
console.log('\n[Test 7] Homopolymer Detection');
const testSeq = 'ATCGAAAAAATCG';
const homopolymers = detectHomopolymers(testSeq);
console.log('Sequence:', testSeq);
console.log('Homopolymers:', homopolymers);

// Test 8: Quality Validation
console.log('\n[Test 8] Sequence Quality Validation');
const qualityReport = validateSequenceQuality(testSeq);
console.log('GC Content:', qualityReport.gcContent + '%');
console.log('Warnings:', qualityReport.warnings);
console.log('Is Valid:', qualityReport.isValid ? '✅' : '❌');

console.log('\n' + '='.repeat(60));
console.log('ALL TESTS COMPLETED');
console.log('='.repeat(60) + '\n');

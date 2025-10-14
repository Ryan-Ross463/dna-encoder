/**
 * FILE CONVERSION SERVICE
 * Handles conversion between file buffers and binary strings
 */

/**
 * FILE TO BINARY CONVERSION
 * Converts a file buffer to binary string representation
 * const buffer = Buffer.from("Hello");
 * fileToBinary(buffer) → "0100100001100101011011000110110001101111"
 */
export function fileToBinary(buffer: Buffer): string {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Invalid input: must be a Buffer');
  }

  let binaryString = '';

  // Convert each byte to 8-bit binary string
  for (const byte of buffer) {
    const binaryByte = byte.toString(2).padStart(8, '0');
    binaryString += binaryByte;
  }

  console.log(`[File Conversion] File → Binary: ${buffer.length} bytes → ${binaryString.length} bits`);
  return binaryString;
}

/**
 * BINARY TO FILE CONVERSION
 * Converts binary string back to file buffer
 * binaryToFile("0100100001100101011011000110110001101111") → Buffer("Hello")
 */
export function binaryToFile(binary: string): Buffer {
  // Validate input
  if (!binary || typeof binary !== 'string') {
    throw new Error('Invalid input: binary must be a non-empty string');
  }

  if (!/^[01]+$/.test(binary)) {
    throw new Error('Invalid input: binary string must contain only 0s and 1s');
  }

  // Binary length must be multiple of 8 (1 byte = 8 bits)
  if (binary.length % 8 !== 0) {
    throw new Error(`Invalid binary length: ${binary.length} is not a multiple of 8`);
  }

  const bytes: number[] = [];

  // Convert every 8 bits to a byte
  for (let i = 0; i < binary.length; i += 8) {
    const byteBinary = binary.substring(i, i + 8);
    const byte = parseInt(byteBinary, 2);
    bytes.push(byte);
  }

  const buffer = Buffer.from(bytes);
  console.log(`[File Conversion] Binary → File: ${binary.length} bits → ${buffer.length} bytes`);
  return buffer;
}

import { Blob } from '@google/genai';

/**
 * Converts Float32Array audio data to Int16Array PCM data and wraps it in a Blob-like object
 * expected by the Gemini Live API.
 */
export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] range before scaling
    const s = Math.max(-1, Math.min(1, data[i]));
    // Scale to 16-bit integer range
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Custom encode function to avoid external dependencies
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

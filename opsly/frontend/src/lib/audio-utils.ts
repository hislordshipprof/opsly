/** Convert an ArrayBuffer of int16 PCM to a base64 string */
export function pcmToBase64(pcmBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(pcmBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert a base64 string to an ArrayBuffer of int16 PCM */
export function base64ToPcm(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

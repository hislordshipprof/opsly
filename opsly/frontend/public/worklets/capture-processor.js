/**
 * AudioWorklet processor for mic capture.
 * Buffers float32 samples, converts to int16 PCM, sends to main thread.
 * AudioContext should be created at 16kHz so no resampling is needed.
 */
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(0);
    // Send chunks of 2048 samples (~128ms at 16kHz) for smooth streaming
    this._chunkSize = 2048;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // mono channel

    // Append to buffer
    const newBuffer = new Float32Array(this._buffer.length + samples.length);
    newBuffer.set(this._buffer);
    newBuffer.set(samples, this._buffer.length);
    this._buffer = newBuffer;

    // When we have enough samples, send a chunk
    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.slice(0, this._chunkSize);
      this._buffer = this._buffer.slice(this._chunkSize);

      // Convert float32 [-1, 1] to int16 [-32768, 32767]
      const int16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      this.port.postMessage({ pcm: int16.buffer }, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor('capture-processor', CaptureProcessor);

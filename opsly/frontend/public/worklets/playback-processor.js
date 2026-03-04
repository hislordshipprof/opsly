/**
 * AudioWorklet processor for Gemini audio playback.
 * Receives int16 PCM chunks from main thread, converts to float32, outputs to speakers.
 * AudioContext should be created at 24kHz to match Gemini output rate.
 */
class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._queue = []; // queue of Float32Array chunks
    this._offset = 0; // position in current chunk
    this._playing = false;

    this.port.onmessage = (e) => {
      if (e.data.clear) {
        // Interruption — clear the playback queue
        this._queue = [];
        this._offset = 0;
        this._playing = false;
        this.port.postMessage({ state: 'cleared' });
        return;
      }

      if (e.data.pcm) {
        // Convert int16 ArrayBuffer to float32
        const int16 = new Int16Array(e.data.pcm);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 0x8000;
        }
        this._queue.push(float32);
        this._playing = true;
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const channel = output[0];

    if (!this._playing || this._queue.length === 0) {
      // Silence
      channel.fill(0);
      if (this._playing && this._queue.length === 0) {
        this._playing = false;
        this.port.postMessage({ state: 'ended' });
      }
      return true;
    }

    let written = 0;
    while (written < channel.length && this._queue.length > 0) {
      const chunk = this._queue[0];
      const remaining = chunk.length - this._offset;
      const needed = channel.length - written;
      const toCopy = Math.min(remaining, needed);

      channel.set(chunk.subarray(this._offset, this._offset + toCopy), written);
      written += toCopy;
      this._offset += toCopy;

      if (this._offset >= chunk.length) {
        this._queue.shift();
        this._offset = 0;
      }
    }

    // Fill remaining with silence
    if (written < channel.length) {
      channel.fill(0, written);
    }

    return true;
  }
}

registerProcessor('playback-processor', PlaybackProcessor);

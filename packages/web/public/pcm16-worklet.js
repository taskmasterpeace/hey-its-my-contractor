// AudioWorklet processor: resamples mic audio from the AudioContext's native
// sample rate (44.1k/48k, varies by browser) down to 16 kHz Int16 PCM, and
// emits it in ~100ms frames. This is the cross-browser replacement for the
// deprecated ScriptProcessorNode + `new AudioContext({ sampleRate: 16000 })`
// trick (which Safari ignores).
//
// AssemblyAI streaming requires audio chunks between 50ms and 1000ms, so we
// accumulate resampled samples into a fixed frame before posting (sending the
// raw ~2.7ms worklet blocks produces no transcript).
class PCM16Worklet extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const target = (options && options.processorOptions && options.processorOptions.targetSampleRate) || 16000;
    // `sampleRate` is a global in AudioWorkletGlobalScope = the context's rate.
    this._ratio = sampleRate / target;
    this._pos = 0; // fractional read position carried across blocks
    this._last = 0; // last sample of previous block (for boundary interpolation)
    this._frameSize = Math.round(target * 0.1); // 100ms worth of samples (1600 @ 16k)
    this._buf = new Int16Array(this._frameSize);
    this._fill = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;
    const ch = input[0]; // Float32Array, mono

    let pos = this._pos;
    while (pos < ch.length) {
      const i = Math.floor(pos);
      const frac = pos - i;
      const s0 = i === 0 ? this._last : ch[i - 1];
      const s1 = ch[i];
      const v = Math.max(-1, Math.min(1, s0 + (s1 - s0) * frac));
      this._buf[this._fill++] = v < 0 ? v * 0x8000 : v * 0x7fff;

      if (this._fill >= this._frameSize) {
        const out = this._buf.slice(0, this._fill);
        this.port.postMessage(out.buffer, [out.buffer]);
        this._fill = 0;
      }
      pos += this._ratio;
    }
    this._pos = pos - ch.length;
    this._last = ch[ch.length - 1];

    return true;
  }
}

registerProcessor("pcm16-worklet", PCM16Worklet);

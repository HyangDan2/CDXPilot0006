// Original 16-bar café loop: bright plucked melody, soft chords and bass.
// Generated locally; no downloads, external recordings or autoplay on page load.
export class Music {
  private context?: AudioContext;
  private source?: AudioBufferSourceNode;
  private gain?: GainNode;
  private buffer?: AudioBuffer;
  private analyser?: AnalyserNode;

  private offset = 0;
  private startedAt = 0;
  private starts = 0;

  private position() {
    const elapsed =
      this.source && this.context
        ? this.context.currentTime - this.startedAt
        : 0;
    return this.buffer ? (this.offset + elapsed) % this.buffer.duration : 0;
  }

  setPlaying(playing: boolean) {
    if (!playing) {
      if (this.source && this.context && this.gain) {
        this.offset = this.position();
        this.source.stop();
        this.source.disconnect();
        this.gain.disconnect();
        this.source = undefined;
      }
      return;
    }
    if (this.source) return;
    try {
      const ctx = (this.context ??= new AudioContext());
      void ctx.resume().catch(() => this.setPlaying(false));
      this.buffer ??= compose(ctx);
      this.analyser ??= ctx.createAnalyser();
      this.analyser.disconnect();
      this.analyser.connect(ctx.destination);
      const source = ctx.createBufferSource(),
        gain = ctx.createGain();
      source.buffer = this.buffer;
      source.loop = true;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.3);
      source.connect(gain).connect(this.analyser);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
      this.startedAt = ctx.currentTime;
      source.start(0, this.offset);
      this.starts++;
      this.source = source;
      this.gain = gain;
    } catch {
      this.source = undefined; /* Optional audio cannot interrupt play. */
    }
  }

  snapshot() {
    const samples = new Float32Array(this.analyser?.fftSize ?? 32);
    this.analyser?.getFloatTimeDomainData(samples);
    return {
      playing: !!this.source,
      position: this.position(),
      starts: this.starts,
      state: this.context?.state ?? "idle",
      rms: Math.sqrt(samples.reduce((n, x) => n + x * x, 0) / samples.length),
      duration: this.buffer?.duration ?? 0,
    };
  }
}

function compose(ctx: AudioContext) {
  const rate = 22050,
    beat = 60 / 104,
    duration = 64 * beat;
  const buffer = ctx.createBuffer(1, Math.round(duration * rate), rate);
  const data = buffer.getChannelData(0);
  const note = (
    midi: number,
    at: number,
    length: number,
    volume: number,
    bright = false,
  ) => {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    for (let i = 0; i < length * rate; i++) {
      const t = i / rate,
        phase = 2 * Math.PI * frequency * t;
      const envelope =
        Math.min(1, t / 0.008) *
        Math.exp(-t * (bright ? 5 : 3)) *
        Math.min(1, (length - t) / 0.06);
      const tone =
        Math.sin(phase) +
        (bright ? 0.24 * Math.sin(2 * phase) + 0.08 * Math.sin(3 * phase) : 0);
      data[(Math.round(at * rate) + i) % data.length] +=
        tone * envelope * volume;
    }
  };
  const chords = [
    [60, 64, 67, 71],
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [55, 59, 62, 69],
  ];
  const melody = [
    [76, 79, 81, 79, 76, 74, 72, 0],
    [76, 0, 72, 74, 76, 79, 76, 0],
    [77, 81, 79, 77, 76, 0, 72, 74],
    [74, 79, 78, 79, 74, 71, 72, 0],
    [79, 0, 76, 79, 84, 83, 81, 79],
    [76, 79, 81, 0, 79, 76, 72, 0],
    [77, 76, 74, 72, 69, 72, 76, 77],
    [74, 0, 71, 74, 79, 0, 76, 74],
    [76, 79, 84, 0, 83, 81, 79, 76],
    [81, 79, 76, 72, 76, 0, 74, 72],
    [77, 81, 84, 81, 79, 77, 76, 0],
    [74, 71, 74, 79, 81, 79, 74, 0],
    [76, 0, 79, 81, 79, 76, 74, 72],
    [72, 76, 79, 76, 72, 69, 72, 0],
    [77, 76, 74, 72, 76, 77, 79, 0],
    [74, 79, 71, 74, 72, 0, 0, 0],
  ];
  for (let bar = 0; bar < 16; bar++) {
    const chord = chords[bar % 4],
      start = bar * 4 * beat;
    for (const offset of [0, 2])
      note(chord[0] - 12, start + offset * beat, beat * 1.5, 0.065);
    for (const offset of [0.5, 1.5, 2.5, 3.5])
      chord.forEach((pitch, j) =>
        note(pitch, start + offset * beat + j * 0.018, 0.48, 0.018, true),
      );
    melody[bar].forEach((pitch, j) => {
      if (pitch) note(pitch, start + (j * beat) / 2, 0.5, 0.075, true);
    });
  }
  return buffer;
}

/**
 * Web Audio beeps for the workout timer. One shared AudioContext is unlocked from a
 * user gesture (required by mobile Safari) and kept alive with a near-silent loop.
 */

/** Peak gain for countdown ticks (0–1; higher = louder; may clip slightly at the peak). */
const COUNTDOWN_BEEP_PEAK = 0.96;
/** Peak gain per partial in the two-tone “go” beep. */
const GO_BEEP_PEAK = 0.94;

function getAudioContextCtor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

const sharedAudio: {
  ctx: AudioContext | null;
  silentSource: AudioBufferSourceNode | null;
} = { ctx: null, silentSource: null };

/** Call synchronously from pointer/touch handlers so mobile Safari unlocks audio. */
export function primeAudioFromUserGesture(): void {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return;
  try {
    if (!sharedAudio.ctx || sharedAudio.ctx.state === "closed") {
      sharedAudio.ctx = new Ctor();
      sharedAudio.silentSource = null;
    }
    void sharedAudio.ctx.resume();
  } catch {
    /* noop */
  }
}

export async function ensureAudioContext(): Promise<AudioContext | null> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  try {
    if (!sharedAudio.ctx || sharedAudio.ctx.state === "closed") {
      sharedAudio.ctx = new Ctor();
      sharedAudio.silentSource = null;
    }
    const { ctx } = sharedAudio;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Loud countdown ticks (3–2–1) and segment warnings. */
export function playCountdownTickBeep(): void {
  void ensureAudioContext().then((ctx) => {
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 920;
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.exponentialRampToValueAtTime(COUNTDOWN_BEEP_PEAK, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.17);
    } catch {
      /* no audio */
    }
  });
}

/** Short two-tone “go” — clearly different from the countdown ticks. */
export function playGoBeep(): void {
  void ensureAudioContext().then((ctx) => {
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const mk = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(GO_BEEP_PEAK, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.01);
      };
      mk(392, t0, 0.1);
      mk(523.25, t0 + 0.09, 0.14);
    } catch {
      /* no audio */
    }
  });
}

export function stopSilentKeepAlive(): void {
  if (sharedAudio.silentSource) {
    try {
      sharedAudio.silentSource.stop();
    } catch {
      /* noop */
    }
    sharedAudio.silentSource = null;
  }
}

/** Very quiet looping buffer on the shared context — helps mobile audio + timing. */
export function startSilentKeepAliveOnContext(ctx: AudioContext): void {
  stopSilentKeepAlive();
  try {
    const buffer = ctx.createBuffer(1, Math.max(2, ctx.sampleRate), ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    sharedAudio.silentSource = src;
  } catch {
    /* noop */
  }
}

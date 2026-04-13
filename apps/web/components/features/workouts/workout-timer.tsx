"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, StopCircle, Check, X, Plus } from "lucide-react";

export type TimerMode = "free" | "fortime" | "amrap" | "tabata" | "emom";

export type TimerResult = {
  mode: TimerMode;
  durationSeconds: number;
  label: string;
  roundsNote?: string;
};

type Round = {
  round: number;
  elapsed: number;
  split: number;
  /** seconds faster (+) or slower (-) than previous round split */
  diffVsPrevSec: number | null;
};

type TimerConfig = {
  timeCap?: number;
  amrapDuration?: number;
  tabataWork?: number;
  tabataRest?: number;
  tabataRounds?: number;
  emomInterval?: number;
  emomRounds?: number;
};

const COUNTDOWN_START = 10;
/** Beeps at 3, 2, 1 before the distinct “go” tone at 0. */
const BEEP_AT_SECONDS = new Set([3, 2, 1]);

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseMmSs(val: string): number {
  const parts = val.split(":").map(Number);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 1) return parts[0] ?? 0;
  return 0;
}

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
function primeAudioFromUserGesture(): void {
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

async function ensureAudioContext(): Promise<AudioContext | null> {
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
function playCountdownTickBeep(): void {
  void ensureAudioContext().then((ctx) => {
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 920;
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.exponentialRampToValueAtTime(0.42, t0 + 0.02);
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
function playGoBeep(): void {
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
        gain.gain.exponentialRampToValueAtTime(0.38, start + 0.015);
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

function stopSilentKeepAlive(): void {
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
function startSilentKeepAliveOnContext(ctx: AudioContext): void {
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

type Props = {
  mode?: TimerMode;
  initialConfig?: TimerConfig;
  onFinish?: (result: TimerResult) => void;
  onDiscard?: () => void;
  compact?: boolean;
};

export function WorkoutTimer({
  mode: initialMode = "free",
  initialConfig = {},
  onFinish,
  onDiscard,
  compact = false,
}: Props) {
  const [mode, setMode] = useState<TimerMode>(initialMode);

  const [timeCap, setTimeCap] = useState(initialConfig.timeCap ?? 0);
  const [timeCapInput, setTimeCapInput] = useState(
    initialConfig.timeCap ? formatTime(initialConfig.timeCap) : ""
  );
  const [amrapDuration, setAmrapDuration] = useState(initialConfig.amrapDuration ?? 1200);
  const [amrapInput, setAmrapInput] = useState(formatTime(initialConfig.amrapDuration ?? 1200));
  const [tabataWork, setTabataWork] = useState(initialConfig.tabataWork ?? 20);
  const [tabataRest, setTabataRest] = useState(initialConfig.tabataRest ?? 10);
  const [tabataRounds, setTabataRounds] = useState(initialConfig.tabataRounds ?? 8);
  const [emomInterval, setEmomInterval] = useState(initialConfig.emomInterval ?? 60);
  const [emomIntervalInput, setEmomIntervalInput] = useState(
    formatTime(initialConfig.emomInterval ?? 60)
  );
  const [emomRounds, setEmomRounds] = useState(initialConfig.emomRounds ?? 10);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tabataPhase, setTabataPhase] = useState<"work" | "rest">("work");
  const [tabataCurrentRound, setTabataCurrentRound] = useState(1);
  const [emomCurrentRound, setEmomCurrentRound] = useState(1);
  const [emomRoundElapsed, setEmomRoundElapsed] = useState(0);
  const [result, setResult] = useState<TimerResult | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);

  const [inCountdown, setInCountdown] = useState(false);
  const [countdownSec, setCountdownSec] = useState(COUNTDOWN_START);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedAtPauseRef = useRef<number>(0);
  const lastBeepCountdownRef = useRef<number | null>(null);
  /** Beeps at 3,2,1 seconds remaining within the current timed segment (AMRAP, cap, Tabata phase, EMOM interval). */
  const segmentBeepRef = useRef<{ phaseId: string; floored: number }>({
    phaseId: "",
    floored: -999,
  });

  const mainClockActive = running && !inCountdown;

  useEffect(() => {
    if (!running) {
      stopSilentKeepAlive();
      return;
    }
    let cancelled = false;
    void ensureAudioContext().then((ctx) => {
      if (!ctx || cancelled) return;
      startSilentKeepAliveOnContext(ctx);
    });
    return () => {
      cancelled = true;
      stopSilentKeepAlive();
    };
  }, [running]);

  const stop = useCallback(
    (reason: "finish" | "cap") => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setInCountdown(false);
      setFinished(true);
      const totalSeconds = Math.round(elapsed);
      let label = formatTime(totalSeconds);
      if (reason === "cap") label += " (time cap)";
      const supportsRoundsLocal = mode === "free" || mode === "fortime" || mode === "amrap";
      const lastMark =
        rounds.length > 0 ? rounds[rounds.length - 1]!.elapsed : 0;
      const tailRemainderSec = Math.max(0, Math.round(totalSeconds - lastMark));
      let roundsNote: string | undefined;
      if (supportsRoundsLocal && rounds.length > 0) {
        const lines = [
          "Round splits:",
          ...rounds.map((r) => `Round ${r.round}: ${formatTime(Math.round(r.split))}`),
        ];
        if (tailRemainderSec > 0) {
          lines.push(
            `Time after last split (e.g. final round if you stopped without a new mark): ${formatTime(tailRemainderSec)}`
          );
        }
        roundsNote = lines.join("\n");
      }
      const r: TimerResult = { mode, durationSeconds: totalSeconds, label, roundsNote };
      setResult(r);
    },
    [elapsed, mode, rounds]
  );

  useEffect(() => {
    if (!mainClockActive) return;
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const newElapsed = elapsedAtPauseRef.current + (now - startTimeRef.current) / 1000;
      setElapsed(newElapsed);

      const secs = Math.floor(newElapsed);

      if (mode === "fortime" && timeCap > 0 && secs >= timeCap) {
        stop("cap");
      } else if (mode === "amrap" && secs >= amrapDuration) {
        stop("finish");
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mainClockActive, mode, timeCap, amrapDuration, stop]);

  useEffect(() => {
    if (!mainClockActive || (mode !== "tabata" && mode !== "emom")) return;

    const secs = Math.floor(elapsed);

    if (mode === "tabata") {
      const phaseDuration = tabataPhase === "work" ? tabataWork : tabataRest;
      const totalTabataElapsed =
        (tabataCurrentRound - 1) * (tabataWork + tabataRest) + (tabataPhase === "rest" ? tabataWork : 0);
      const phaseElapsed = secs - totalTabataElapsed;
      if (phaseElapsed >= phaseDuration) {
        if (tabataPhase === "work") {
          setTabataPhase("rest");
        } else {
          const nextRound = tabataCurrentRound + 1;
          if (nextRound > tabataRounds) {
            stop("finish");
          } else {
            setTabataCurrentRound(nextRound);
            setTabataPhase("work");
          }
        }
      }
    }

    if (mode === "emom") {
      const roundElapsed = secs % emomInterval;
      const currentRound = Math.floor(secs / emomInterval) + 1;
      setEmomRoundElapsed(roundElapsed);
      if (currentRound !== emomCurrentRound) {
        if (currentRound > emomRounds) {
          stop("finish");
        } else {
          setEmomCurrentRound(currentRound);
        }
      }
    }
  }, [
    elapsed,
    mainClockActive,
    mode,
    tabataPhase,
    tabataWork,
    tabataRest,
    tabataRounds,
    tabataCurrentRound,
    emomInterval,
    emomRounds,
    emomCurrentRound,
    stop,
  ]);

  // Beeps during main clock: last 3 seconds of each timed segment (not the initial 10s get-ready).
  useEffect(() => {
    if (!mainClockActive || finished) return;

    let phaseId = "";
    let remainingSec = 0;

    if (mode === "amrap") {
      phaseId = `amrap-${amrapDuration}`;
      remainingSec = Math.max(0, amrapDuration - elapsed);
    } else if (mode === "fortime" && timeCap > 0) {
      phaseId = `cap-${timeCap}`;
      remainingSec = Math.max(0, timeCap - elapsed);
    } else if (mode === "tabata") {
      const phaseDuration = tabataPhase === "work" ? tabataWork : tabataRest;
      const totalTabataElapsed =
        (tabataCurrentRound - 1) * (tabataWork + tabataRest) + (tabataPhase === "rest" ? tabataWork : 0);
      const s = Math.floor(elapsed);
      remainingSec = Math.max(0, phaseDuration - (s - totalTabataElapsed));
      phaseId = `tab-${tabataCurrentRound}-${tabataPhase}-${tabataWork}-${tabataRest}`;
    } else if (mode === "emom") {
      const s = Math.floor(elapsed);
      const re = s % emomInterval;
      phaseId = `emom-${Math.floor(s / emomInterval)}-${emomInterval}`;
      remainingSec = Math.max(0, emomInterval - re);
    } else {
      return;
    }

    const floored = Math.floor(remainingSec + 1e-6);
    if (phaseId !== segmentBeepRef.current.phaseId) {
      segmentBeepRef.current = { phaseId, floored: -999 };
    }
    if (floored >= 1 && floored <= 3 && floored !== segmentBeepRef.current.floored) {
      segmentBeepRef.current.floored = floored;
      playCountdownTickBeep();
    }
  }, [
    mainClockActive,
    finished,
    mode,
    elapsed,
    amrapDuration,
    timeCap,
    tabataPhase,
    tabataCurrentRound,
    tabataWork,
    tabataRest,
    emomInterval,
  ]);

  useEffect(() => {
    if (!inCountdown) {
      lastBeepCountdownRef.current = null;
      return;
    }
    if (BEEP_AT_SECONDS.has(countdownSec) && lastBeepCountdownRef.current !== countdownSec) {
      lastBeepCountdownRef.current = countdownSec;
      playCountdownTickBeep();
    }
  }, [inCountdown, countdownSec]);

  useEffect(() => {
    if (!inCountdown) return;
    const id = setInterval(() => {
      setCountdownSec((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [inCountdown]);

  const countdownZeroHandledRef = useRef(false);
  useEffect(() => {
    if (!inCountdown) {
      countdownZeroHandledRef.current = false;
      return;
    }
    if (countdownSec !== 0) return;
    if (countdownZeroHandledRef.current) return;
    countdownZeroHandledRef.current = true;

    playGoBeep();

    const frozenElapsed = elapsed;
    setInCountdown(false);
    setCountdownSec(COUNTDOWN_START);
    startTimeRef.current = Date.now();
    elapsedAtPauseRef.current = frozenElapsed;
  }, [inCountdown, countdownSec, elapsed]);

  function beginMainClockFromHere() {
    startTimeRef.current = Date.now();
    elapsedAtPauseRef.current = elapsed;
    setRunning(true);
  }

  function startResume() {
    if (finished) return;
    if (running && !inCountdown) {
      return;
    }
    if (inCountdown) return;

    primeAudioFromUserGesture();

    if (!running && elapsed === 0) {
      setInCountdown(true);
      setCountdownSec(COUNTDOWN_START);
      setRunning(true);
      return;
    }

    if (!running && elapsed > 0) {
      beginMainClockFromHere();
    }
  }

  function pause() {
    if (inCountdown) {
      setInCountdown(false);
      setCountdownSec(COUNTDOWN_START);
      setRunning(false);
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedAtPauseRef.current = elapsed;
    setRunning(false);
  }

  function recordRound() {
    setRounds((prev) => {
      const lastElapsed = prev.length > 0 ? prev[prev.length - 1].elapsed : 0;
      const split = elapsed - lastElapsed;
      const prevSplit = prev.length > 0 ? prev[prev.length - 1].split : null;
      const diffVsPrevSec =
        prevSplit != null ? Math.round(prevSplit - split) : null;
      return [
        ...prev,
        {
          round: prev.length + 1,
          elapsed,
          split,
          diffVsPrevSec,
        },
      ];
    });
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setInCountdown(false);
    setCountdownSec(COUNTDOWN_START);
    setFinished(false);
    setElapsed(0);
    setResult(null);
    setRounds([]);
    elapsedAtPauseRef.current = 0;
    setTabataPhase("work");
    setTabataCurrentRound(1);
    setEmomCurrentRound(1);
    setEmomRoundElapsed(0);
    segmentBeepRef.current = { phaseId: "", floored: -999 };
  }

  function handleFinish() {
    if (result && onFinish) onFinish(result);
  }

  const supportsRounds = mode === "free" || mode === "fortime" || mode === "amrap";

  const secs = Math.floor(elapsed);
  const countdownTarget =
    mode === "amrap" ? amrapDuration : mode === "fortime" && timeCap > 0 ? timeCap : 0;
  const display = countdownTarget > 0 ? Math.max(0, countdownTarget - secs) : secs;
  const isCountdown = countdownTarget > 0;

  let tabataPhaseRemaining = 0;
  if (mode === "tabata") {
    const phaseDuration = tabataPhase === "work" ? tabataWork : tabataRest;
    const totalTabataElapsed =
      (tabataCurrentRound - 1) * (tabataWork + tabataRest) + (tabataPhase === "rest" ? tabataWork : 0);
    tabataPhaseRemaining = Math.max(0, phaseDuration - (secs - totalTabataElapsed));
  }

  const emomPhaseRemaining = Math.max(0, emomInterval - emomRoundElapsed);

  const modeLabels: Record<TimerMode, string> = {
    free: "Free Timer",
    fortime: "For Time",
    amrap: "AMRAP",
    tabata: "Tabata",
    emom: "EMOM",
  };

  return (
    <div className={`rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-6"} space-y-4`}>
      {!running && !finished && (
        <div className="flex flex-wrap gap-2">
          {(["free", "fortime", "amrap", "tabata", "emom"] as TimerMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                reset();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                mode === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      )}

      {!running && !finished && (
        <>
          {mode === "fortime" && (
            <div className="flex items-center gap-3 text-sm">
              <label className="text-muted-foreground shrink-0">Time cap (mm:ss):</label>
              <input
                type="text"
                value={timeCapInput}
                onChange={(e) => setTimeCapInput(e.target.value)}
                onBlur={() => setTimeCap(parseMmSs(timeCapInput))}
                placeholder="none"
                className="w-24 px-2 py-1 border border-border rounded bg-background text-foreground text-center"
              />
              <span className="text-muted-foreground text-xs">leave blank for no cap</span>
            </div>
          )}

          {mode === "amrap" && (
            <div className="flex items-center gap-3 text-sm">
              <label className="text-muted-foreground shrink-0">Duration (mm:ss):</label>
              <input
                type="text"
                value={amrapInput}
                onChange={(e) => setAmrapInput(e.target.value)}
                onBlur={() => setAmrapDuration(parseMmSs(amrapInput))}
                className="w-24 px-2 py-1 border border-border rounded bg-background text-foreground text-center"
              />
            </div>
          )}

          {mode === "tabata" && (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Work (sec)</label>
                <input
                  type="number"
                  value={tabataWork}
                  onChange={(e) => setTabataWork(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-center"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rest (sec)</label>
                <input
                  type="number"
                  value={tabataRest}
                  onChange={(e) => setTabataRest(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-center"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rounds</label>
                <input
                  type="number"
                  value={tabataRounds}
                  onChange={(e) => setTabataRounds(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-center"
                  min={1}
                />
              </div>
            </div>
          )}

          {mode === "emom" && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Interval (mm:ss) — any length
                </label>
                <input
                  type="text"
                  value={emomIntervalInput}
                  onChange={(e) => setEmomIntervalInput(e.target.value)}
                  onBlur={() => {
                    const v = parseMmSs(emomIntervalInput);
                    setEmomInterval(Math.max(1, v));
                  }}
                  className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rounds</label>
                <input
                  type="number"
                  value={emomRounds}
                  onChange={(e) => setEmomRounds(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-center"
                  min={1}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="text-center py-4">
        {inCountdown && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-500">Get ready</p>
            <div className="font-mono font-bold text-6xl text-amber-500">{countdownSec}</div>
          </div>
        )}

        {!inCountdown && mode === "tabata" && running && (
          <div className="mb-2 space-y-1">
            <div
              className={`text-sm font-bold uppercase tracking-widest ${
                tabataPhase === "work" ? "text-green-500" : "text-blue-500"
              }`}
            >
              {tabataPhase === "work" ? "WORK" : "REST"}
            </div>
            <div className="text-muted-foreground text-xs">
              Round {tabataCurrentRound} / {tabataRounds}
            </div>
          </div>
        )}

        {!inCountdown && mode === "emom" && running && (
          <div className="mb-2 space-y-1">
            <div className="text-sm font-bold uppercase tracking-widest text-orange-500">
              INTERVAL {emomCurrentRound}
            </div>
            <div className="text-muted-foreground text-xs">
              of {emomRounds} · {formatTime(emomPhaseRemaining)} left this interval
            </div>
          </div>
        )}

        {!inCountdown && (
          <div
            className={`font-mono font-bold tracking-tight ${
              compact ? "text-5xl" : "text-7xl md:text-8xl"
            } ${
              finished
                ? "text-green-500"
                : mode === "tabata"
                  ? tabataPhase === "work"
                    ? "text-green-400"
                    : "text-blue-400"
                  : isCountdown && display <= 10 && running
                    ? "text-red-500"
                    : "text-foreground"
            }`}
          >
            {mode === "tabata" && running
              ? formatTime(tabataPhaseRemaining)
              : formatTime(display)}
          </div>
        )}

        {!inCountdown && mode === "tabata" && running && (
          <div className="mt-1 text-muted-foreground text-xs">Total: {formatTime(secs)}</div>
        )}

        {finished && result && (
          <div className="mt-2 space-y-2 text-sm text-green-600 dark:text-green-400 font-semibold">
            <div>{result.label}</div>
            {result.roundsNote && (
              <pre className="text-left text-xs font-medium text-muted-foreground whitespace-pre-wrap font-sans max-w-md mx-auto">
                {result.roundsNote}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {!finished ? (
          <>
            {running ? (
              <button
                type="button"
                onClick={pause}
                className="p-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                aria-label={inCountdown ? "Cancel countdown" : "Pause"}
              >
                <Pause className="w-6 h-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startResume}
                className="p-4 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
                aria-label="Start"
              >
                <Play className="w-6 h-6 ml-0.5" />
              </button>
            )}
            {running && !inCountdown && supportsRounds && (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={recordRound}
                  className="p-3 rounded-full border border-border hover:bg-accent text-muted-foreground transition-colors"
                  aria-label="Round Counter"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <span className="text-xs text-muted-foreground">Round Counter</span>
              </div>
            )}
            {(running || elapsed > 0) && !inCountdown && (
              <button
                type="button"
                onClick={() => stop("finish")}
                className="p-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                aria-label="Stop and record"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="p-3 rounded-full border border-border hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex gap-3 flex-wrap justify-center">
              {onFinish && (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Use this time
                </button>
              )}
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-accent text-muted-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              {onDiscard && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-accent text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                  Discard
                </button>
              )}
            </div>
            {!onFinish && (
              <p className="text-xs text-muted-foreground">Timer stopped — reset to go again</p>
            )}
          </div>
        )}
      </div>

      <div className="text-center">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {modeLabels[mode]}
          {mode === "fortime" && timeCap > 0 && ` · Cap: ${formatTime(timeCap)}`}
          {mode === "amrap" && ` · ${formatTime(amrapDuration)}`}
          {mode === "tabata" && ` · ${tabataWork}s/${tabataRest}s × ${tabataRounds}`}
          {mode === "emom" && ` · ${formatTime(emomInterval)} × ${emomRounds}`}
        </span>
      </div>

      {rounds.length > 0 && (
        <div className="border-t border-border pt-3">
          <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs text-muted-foreground uppercase tracking-wide mb-2 px-1 items-end">
            <span>Round</span>
            <span className="text-right">Split</span>
            <span className="text-right">{mode === "amrap" ? "Remaining" : "Total"}</span>
            <span className="text-right">Diff</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...rounds].reverse().map((r) => (
              <div
                key={r.round}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 text-sm px-1 py-0.5 items-center"
              >
                <span className="text-muted-foreground font-medium">Round {r.round}</span>
                <span className="font-mono font-semibold text-right tabular-nums">
                  {formatTime(Math.round(r.split))}
                </span>
                <span className="font-mono text-xs text-muted-foreground text-right tabular-nums">
                  {mode === "amrap"
                    ? formatTime(Math.max(0, amrapDuration - Math.round(r.elapsed)))
                    : formatTime(Math.round(r.elapsed))}
                </span>
                <span
                  className={`text-xs font-semibold text-right tabular-nums ${
                    r.diffVsPrevSec == null
                      ? "text-muted-foreground"
                      : r.diffVsPrevSec > 0
                        ? "text-green-600 dark:text-green-400"
                        : r.diffVsPrevSec < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                  }`}
                >
                  {r.diffVsPrevSec == null
                    ? "—"
                    : r.diffVsPrevSec > 0
                      ? `+${r.diffVsPrevSec}s`
                      : r.diffVsPrevSec < 0
                        ? `${r.diffVsPrevSec}s`
                        : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

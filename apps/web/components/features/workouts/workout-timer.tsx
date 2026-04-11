"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, StopCircle, Settings2, Check, X } from "lucide-react";

export type TimerMode = "free" | "fortime" | "amrap" | "tabata" | "emom";

export type TimerResult = {
  mode: TimerMode;
  durationSeconds: number; // actual elapsed time
  label: string; // human-readable result (e.g. "10:44", "8 rounds", etc.)
};

type TimerConfig = {
  // For Time
  timeCap?: number; // seconds, 0 = no cap
  // AMRAP
  amrapDuration?: number; // seconds
  // Tabata
  tabataWork?: number; // seconds (default 20)
  tabataRest?: number; // seconds (default 10)
  tabataRounds?: number; // total rounds (default 8)
  // EMOM
  emomInterval?: number; // seconds per minute (default 60)
  emomRounds?: number; // number of rounds
};

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
  const [showConfig, setShowConfig] = useState(false);

  // Config state
  const [timeCap, setTimeCap] = useState(initialConfig.timeCap ?? 0);
  const [timeCapInput, setTimeCapInput] = useState(
    initialConfig.timeCap ? formatTime(initialConfig.timeCap) : ""
  );
  const [amrapDuration, setAmrapDuration] = useState(
    initialConfig.amrapDuration ?? 1200
  );
  const [amrapInput, setAmrapInput] = useState(
    formatTime(initialConfig.amrapDuration ?? 1200)
  );
  const [tabataWork, setTabataWork] = useState(initialConfig.tabataWork ?? 20);
  const [tabataRest, setTabataRest] = useState(initialConfig.tabataRest ?? 10);
  const [tabataRounds, setTabataRounds] = useState(initialConfig.tabataRounds ?? 8);
  const [emomInterval, setEmomInterval] = useState(initialConfig.emomInterval ?? 60);
  const [emomIntervalInput, setEmomIntervalInput] = useState(
    formatTime(initialConfig.emomInterval ?? 60)
  );
  const [emomRounds, setEmomRounds] = useState(initialConfig.emomRounds ?? 10);

  // Timer state
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0); // total elapsed seconds
  const [tabataPhase, setTabataPhase] = useState<"work" | "rest">("work");
  const [tabataCurrentRound, setTabataCurrentRound] = useState(1);
  const [tabataPhaseElapsed, setTabataPhaseElapsed] = useState(0);
  const [emomCurrentRound, setEmomCurrentRound] = useState(1);
  const [emomRoundElapsed, setEmomRoundElapsed] = useState(0);
  const [result, setResult] = useState<TimerResult | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedAtPauseRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Prevent the screen from sleeping while the timer is running
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {
        // Wake lock unavailable (battery saver, unsupported browser, etc.)
      }
    };

    // Re-acquire after returning from background (iOS releases lock on hide)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [running]);

  const stop = useCallback(
    (reason: "finish" | "cap") => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setFinished(true);
      const totalSeconds = Math.round(elapsed);
      let label = formatTime(totalSeconds);
      if (reason === "cap") label += " (time cap)";
      const r: TimerResult = { mode, durationSeconds: totalSeconds, label };
      setResult(r);
    },
    [elapsed, mode]
  );

  // Timer tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const newElapsed = elapsedAtPauseRef.current + (now - startTimeRef.current) / 1000;
      setElapsed(newElapsed);

      const secs = Math.floor(newElapsed);

      // Tabata tracking
      if (mode === "tabata") {
        const phaseDuration = tabataPhase === "work" ? tabataWork : tabataRest;
        setTabataPhaseElapsed((prev) => {
          const next = prev + (1 / 10);
          return next;
        });
      }

      // Check termination conditions
      if (mode === "fortime" && timeCap > 0 && secs >= timeCap) {
        stop("cap");
      } else if (mode === "amrap" && secs >= amrapDuration) {
        stop("finish");
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, timeCap, amrapDuration, tabataPhase, tabataWork, tabataRest, stop]);

  // Tabata / EMOM phase advancement
  useEffect(() => {
    if (!running || (mode !== "tabata" && mode !== "emom")) return;

    const secs = Math.floor(elapsed);

    if (mode === "tabata") {
      const phaseDuration = tabataPhase === "work" ? tabataWork : tabataRest;
      const totalTabataElapsed = (tabataCurrentRound - 1) * (tabataWork + tabataRest) + (tabataPhase === "rest" ? tabataWork : 0);
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
  }, [elapsed, running, mode, tabataPhase, tabataWork, tabataRest, tabataRounds, tabataCurrentRound, emomInterval, emomRounds, emomCurrentRound, stop]);

  function startResume() {
    startTimeRef.current = Date.now();
    elapsedAtPauseRef.current = elapsed;
    setRunning(true);
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedAtPauseRef.current = elapsed;
    setRunning(false);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setElapsed(0);
    setResult(null);
    elapsedAtPauseRef.current = 0;
    setTabataPhase("work");
    setTabataCurrentRound(1);
    setTabataPhaseElapsed(0);
    setEmomCurrentRound(1);
    setEmomRoundElapsed(0);
  }

  function handleFinish() {
    if (result && onFinish) onFinish(result);
  }

  // Compute countdown for countup/countdown modes
  const secs = Math.floor(elapsed);
  const countdownTarget =
    mode === "amrap" ? amrapDuration : mode === "fortime" && timeCap > 0 ? timeCap : 0;
  const display = countdownTarget > 0 ? Math.max(0, countdownTarget - secs) : secs;
  const isCountdown = countdownTarget > 0;

  // Tabata display
  let tabataPhaseRemaining = 0;
  if (mode === "tabata") {
    const phaseDuration = tabataPhase === "work" ? tabataWork : tabataRest;
    const totalTabataElapsed = (tabataCurrentRound - 1) * (tabataWork + tabataRest) + (tabataPhase === "rest" ? tabataWork : 0);
    tabataPhaseRemaining = Math.max(0, phaseDuration - (secs - totalTabataElapsed));
  }

  // EMOM display
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
      {/* Mode selector */}
      {!running && !finished && (
        <div className="flex flex-wrap gap-2">
          {(["free", "fortime", "amrap", "tabata", "emom"] as TimerMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); reset(); }}
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

      {/* Configuration */}
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
                <label className="block text-xs text-muted-foreground mb-1">Interval (mm:ss)</label>
                <input
                  type="text"
                  value={emomIntervalInput}
                  onChange={(e) => setEmomIntervalInput(e.target.value)}
                  onBlur={() => setEmomInterval(parseMmSs(emomIntervalInput))}
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

      {/* Main clock display */}
      <div className="text-center py-4">
        {mode === "tabata" && running && (
          <div className="mb-2 space-y-1">
            <div className={`text-sm font-bold uppercase tracking-widest ${tabataPhase === "work" ? "text-green-500" : "text-blue-500"}`}>
              {tabataPhase === "work" ? "WORK" : "REST"}
            </div>
            <div className="text-muted-foreground text-xs">
              Round {tabataCurrentRound} / {tabataRounds}
            </div>
          </div>
        )}

        {mode === "emom" && running && (
          <div className="mb-2 space-y-1">
            <div className="text-sm font-bold uppercase tracking-widest text-orange-500">
              MINUTE {emomCurrentRound}
            </div>
            <div className="text-muted-foreground text-xs">
              of {emomRounds} · {formatTime(emomPhaseRemaining)} left this round
            </div>
          </div>
        )}

        <div
          className={`font-mono font-bold tracking-tight ${
            compact ? "text-5xl" : "text-7xl md:text-8xl"
          } ${
            finished ? "text-green-500" :
            mode === "tabata"
              ? tabataPhase === "work" ? "text-green-400" : "text-blue-400"
              : isCountdown && display <= 10 && running
              ? "text-red-500"
              : "text-foreground"
          }`}
        >
          {mode === "tabata" && running
            ? formatTime(tabataPhaseRemaining)
            : formatTime(display)}
        </div>

        {mode === "tabata" && running && (
          <div className="mt-1 text-muted-foreground text-xs">
            Total: {formatTime(secs)}
          </div>
        )}

        {finished && result && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-semibold">
            {result.label}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!finished ? (
          <>
            {running ? (
              <button
                type="button"
                onClick={pause}
                className="p-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                aria-label="Pause"
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
            {(running || elapsed > 0) && (
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
            <div className="flex gap-3">
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

      {/* Mode label */}
      <div className="text-center">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {modeLabels[mode]}
          {mode === "fortime" && timeCap > 0 && ` · Cap: ${formatTime(timeCap)}`}
          {mode === "amrap" && ` · ${formatTime(amrapDuration)}`}
          {mode === "tabata" && ` · ${tabataWork}s/${tabataRest}s × ${tabataRounds}`}
          {mode === "emom" && ` · ${formatTime(emomInterval)} × ${emomRounds}`}
        </span>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";

type GreetingCtx = { firstName: string; streak: number };

function buildGreetingPool({ firstName, streak }: GreetingCtx): { headline: string; sub: string }[] {
  const s = streak;
  const streakLine =
    s > 30
      ? `${s} days — that is a serious streak.`
      : s > 14
        ? `${s} days straight. You are stacking proof.`
        : s > 7
          ? `${s} days on the board. Keep the rhythm.`
          : s > 0
            ? `${s}-day streak. One session today extends it.`
            : "Log a session today to start a streak.";

  return [
    { headline: `Welcome back, ${firstName}`, sub: streakLine },
    { headline: `Hey ${firstName}`, sub: "Train first, optimize later." },
    { headline: `Good to see you, ${firstName}`, sub: "Small reps today, big graph over time." },
    { headline: `Ready when you are, ${firstName}`, sub: "Pick a workout and make it count." },
    { headline: `Let's go, ${firstName}`, sub: "Consistency beats perfect weeks." },
    { headline: `You showed up, ${firstName}`, sub: "That is already the hard part." },
    { headline: `Gym Journal is open, ${firstName}`, sub: "Your last session is not your ceiling." },
    { headline: `Another day to improve, ${firstName}`, sub: "Log the work so future-you remembers." },
    { headline: `Time under tension, ${firstName}`, sub: "Same bar, new story." },
    { headline: `Momentum, ${firstName}`, sub: streak > 0 ? `Streak fuel: ${streak} day${s === 1 ? "" : "s"}.` : "Start small, stack wins." },
    { headline: `Athlete mode: on`, sub: `${firstName}, what is the plan today?` },
    { headline: `Training brain activated`, sub: `Hey ${firstName} — warm up, then send it.` },
    { headline: `New opening, clean slate`, sub: `${firstName}, leave the excuses off the log.` },
    { headline: `Hello, ${firstName}`, sub: "Progress loves a paper trail." },
    { headline: `Back at it`, sub: `${firstName}, your numbers are waiting.` },
    { headline: `Main character energy`, sub: `${firstName}, this is your training arc.` },
    { headline: `Feet on the floor, ${firstName}`, sub: "One session at a time." },
    { headline: `Clock is ticking — in a good way`, sub: `${firstName}, start when you are ready.` },
    { headline: `Stronger than yesterday`, sub: `Keep building, ${firstName}.` },
    { headline: `Discipline > motivation`, sub: `${firstName}, show up anyway.` },
    { headline: `Your gym, your rules`, sub: `${firstName}, log what actually happened.` },
    { headline: `No hero reps required`, sub: `${firstName}, honest work wins.` },
    { headline: `Breathe, brace, begin`, sub: `Good day to train, ${firstName}.` },
    { headline: `The bar is loaded`, sub: `${firstName}, figuratively (and maybe literally).` },
    { headline: `PRs are earned in the margins`, sub: `${firstName}, chase the boring reps too.` },
    { headline: `Warm-up mindset`, sub: `${firstName}, ease in, then commit.` },
    { headline: `Posture check`, sub: `${firstName}, shoulders back — then train.` },
    { headline: `Hydrate, then dominate`, sub: `Friendly reminder, ${firstName}.` },
    { headline: `You vs. yesterday`, sub: `${firstName}, tiny edges compound.` },
    { headline: `Training is the treat`, sub: `${firstName}, recovery is the secret sauce.` },
    { headline: `Show your work`, sub: `${firstName}, the logbook never lies.` },
    { headline: `No zero days`, sub: streak > 0 ? `${streak} days deep — nice.` : `${firstName}, even a short session counts.` },
    { headline: `Garage gym, globo, or garage globo`, sub: `${firstName}, it all counts here.` },
    { headline: `Metcon Monday? Maybe.`, sub: `${firstName}, you choose the flavor.` },
    { headline: `Heavy, light, or skill`, sub: `${firstName}, pick a lane and own it.` },
    { headline: `Mobility counts`, sub: `${firstName}, supple athletes last longer.` },
    { headline: `Track the boring stuff`, sub: `${firstName}, sleep and steps matter too.` },
    { headline: `Heart rate up, excuses down`, sub: `You got this, ${firstName}.` },
    { headline: `One more rep culture`, sub: `${firstName}, safety first — then intensity.` },
    { headline: `RX or scaled — both are valid`, sub: `${firstName}, integrity beats ego.` },
    { headline: `Timer starts when you say go`, sub: `${firstName}, we are ready when you are.` },
    { headline: `Data-driven athlete`, sub: `${firstName}, charts love consistency.` },
    { headline: `Welcome to the grind`, sub: `${firstName}, enjoy the process.` },
    { headline: `Fresh session energy`, sub: `${firstName}, name it, do it, log it.` },
    { headline: `Be your own coach`, sub: `${firstName}, notes today = clarity tomorrow.` },
    { headline: `Sweat equity`, sub: `${firstName}, pay yourself first with training.` },
    { headline: `You are the experiment`, sub: `${firstName}, iterate weekly.` },
    { headline: `Leg day survives opinions`, sub: `${firstName}, train what you need.` },
    { headline: `Upper body needs love too`, sub: `${firstName}, balance keeps joints happy.` },
    { headline: `Core is not optional`, sub: `${firstName}, bracing is free strength.` },
    { headline: `Cardio is a mood`, sub: `${firstName}, engines need maintenance.` },
    { headline: `Lift something`, sub: `${firstName}, gravity is undefeated — use it.` },
    { headline: `Journal > memory`, sub: `${firstName}, write the numbers down.` },
    { headline: `Your dashboard, your story`, sub: `${firstName}, keep adding chapters.` },
  ];
}

export function DashboardGreeting({ firstName, streak }: GreetingCtx) {
  const picked = useRef<{ headline: string; sub: string } | null>(null);
  if (picked.current === null) {
    const pool = buildGreetingPool({ firstName, streak });
    picked.current = pool[Math.floor(Math.random() * pool.length)]!;
  }
  const g = picked.current;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{g.headline}</h1>
      <p className="text-muted-foreground mt-1">{g.sub}</p>
    </div>
  );
}

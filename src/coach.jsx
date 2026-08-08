import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Line, BarChart, Bar, ComposedChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend, Cell,
} from "recharts";

/* ============================================================================
   1. COACH CONFIG
   ==========================================================================*/

/* ---- WORKOUT LIBRARY ------------------------------------------------------
   The classes you can choose from. Fully editable in the app (Workouts screen)
   without touching this file — this is only the starting list.

   intensity / recoveryCost are 1–5 estimates, shoulderLoad is low|medium|high.
   They are rough working figures for the coaching engine, not medical values.
--------------------------------------------------------------------------- */
/* What she might add on after a class. The id is what gets stored and must
   never change; the label is what she reads and can. */
const EXTRA_TAGS = [
  { id: "strength",      label: "strength" },
  { id: "mobility",      label: "stretching and mobility" },
  { id: "shoulder work", label: "shoulder work" },
  { id: "cardio",        label: "cardio" },
];

const SEED_LIBRARY = [
  { id: "pilates", body: { legs: 1, back: 2, chest: 0, shoulders: 1, arms: 0, core: 3, heart: 1 },    name: "Pilates class",         goal: "core",        intensity: 4, recoveryCost: 3, shoulderLoad: "medium", durations: [45, 60],     equipment: "Mat, studio",           cue: "Move from the centre. Let her push the pace.", home: false , resistance: "Whatever the class calls for", structure: "Instructor-led. Fill this in with how the class actually runs and I'll take it into account.", felt: ""},
  { addon: true, id: "shoulder", body: { legs: 0, back: 1, chest: 0, shoulders: 3, arms: 1, core: 0, heart: 0 },   name: "Shoulder session",      goal: "mobility",    intensity: 2, recoveryCost: 1, shoulderLoad: "low",    durations: [10, 15, 20], equipment: "Band, light dumbbells", cue: "Range first. If it pinches, shorten the range, don't push through.", home: false },
  { id: "bodypump", body: { legs: 3, back: 2, chest: 2, shoulders: 2, arms: 2, core: 2, heart: 2 }, home: true,   name: "LES MILLS BODYPUMP",    goal: "strength",    intensity: 4, recoveryCost: 4, shoulderLoad: "high",   durations: [30, 45, 55], equipment: "Barbell, plates, step",  cue: "Lighter weight, cleaner form — the reps do the work." , resistance: "Squats 7.5–10 kg · Chest 5 kg · Back 10–15 kg · Triceps 2.5–5 kg · Biceps 5 kg · Lunges 5 kg · Shoulders 2.5–5 kg (total bar weight)", structure: "About 55 min, ten tracks: warm-up, squats, chest, back, triceps, biceps, lunges, shoulders, core, cool-down. High reps, light-to-moderate load.", felt: ""},
  { id: "bodycombat", body: { legs: 2, back: 1, chest: 1, shoulders: 2, arms: 2, core: 2, heart: 3 }, name: "LES MILLS BODYCOMBAT",  goal: "cardio",      intensity: 5, recoveryCost: 4, shoulderLoad: "medium", durations: [30, 45, 55], equipment: "None",                   cue: "Full extension on every strike, then pull it back." , resistance: "No weights — bodyweight only", structure: "Ten tracks of martial-arts-inspired cardio: upper body, lower body, combinations, power training, conditioning. Intervals of high effort with short recoveries.", felt: ""},
  { id: "bodybalance", body: { legs: 2, back: 1, chest: 0, shoulders: 1, arms: 0, core: 2, heart: 1 },name: "LES MILLS BODYBALANCE", goal: "mobility", intensity: 2, recoveryCost: 1, shoulderLoad: "low",    durations: [30, 45, 55], equipment: "Mat",                    cue: "Breathe all the way through every hold." , resistance: "Mat only, optional block", structure: "Ten tracks blending yoga, tai chi and Pilates: sun salutations, standing strength, balance, hip and hamstring openers, core, relaxation.", felt: ""},
  { id: "lmpilates", body: { legs: 1, back: 2, chest: 0, shoulders: 1, arms: 0, core: 3, heart: 1 },  name: "LES MILLS Pilates",     goal: "core",        intensity: 3, recoveryCost: 2, shoulderLoad: "low",    durations: [30, 45],     equipment: "Mat",                    cue: "Move from the centre, not the limbs." , resistance: "Mat, optional small ball or light band", structure: "Mat Pilates built around controlled, low-load repetition. Core sequencing, spinal articulation, glutes, mobility.", felt: ""},
  { id: "lmcore", body: { legs: 1, back: 2, chest: 0, shoulders: 1, arms: 1, core: 3, heart: 1 },     name: "LES MILLS Core",        goal: "core",        intensity: 4, recoveryCost: 3, shoulderLoad: "medium", durations: [30],         equipment: "Mat, band, plate",       cue: "Brace before you move, not after." , resistance: "Resistance band and a light plate (2.5–5 kg)", structure: "About 30 min of progressive core work: standing, on the mat, band-resisted, and a recovery finish.", felt: ""},
  { id: "strength", body: { legs: 3, back: 3, chest: 2, shoulders: 2, arms: 2, core: 2, heart: 1 }, home: true,   name: "Strength Development",  goal: "strength",    intensity: 4, recoveryCost: 4, shoulderLoad: "high",   durations: [45, 60, 75], equipment: "Barbell, rack, bench",   cue: "Leave one rep in reserve on every set." },
  { id: "functional", body: { legs: 3, back: 2, chest: 2, shoulders: 2, arms: 2, core: 3, heart: 3 }, home: true, name: "Functional Circuit", goal: "strength", intensity: 4, recoveryCost: 4, shoulderLoad: "medium", durations: [25, 35, 45], equipment: "Dumbbells, kettlebell, mat — whatever is there", cue: "Move well before you move fast. The clock is not the point.", resistance: "Dumbbells 4–8 kg · Kettlebell 8–12 kg. Scale down before you scale the round count.", structure: "Circuit training: 4–6 movements covering push, pull, squat, hinge and carry, repeated for rounds with short rests. Whole body in one session.", felt: "" },
  { id: "wod", body: { legs: 3, back: 3, chest: 2, shoulders: 3, arms: 2, core: 3, heart: 3 }, home: true, name: "CrossFit-style WOD", goal: "strength", intensity: 5, recoveryCost: 5, shoulderLoad: "high", durations: [20, 30, 40], equipment: "Mixed — barbell, kettlebell, box, rower", cue: "Pick the scaled version. Intensity is earned, not assumed.", resistance: "Scale every movement. Overhead work only when the shoulder is green.", structure: "A workout of the day: mixed movements against time or rounds. Intentionally hard, intentionally short. The highest-cost session in the library.", felt: "" },
  { id: "bodyweight", body: { legs: 2, back: 2, chest: 2, shoulders: 2, arms: 2, core: 3, heart: 2 }, home: false, name: "Bodyweight Circuit", goal: "strength", intensity: 3, recoveryCost: 3, shoulderLoad: "medium", durations: [20, 30, 40], equipment: "None — floor and a wall", cue: "Slow the lowering phase. That is where the work is.", resistance: "Squats, lunges, push-ups (incline if needed), rows on a table edge, planks, glute bridges.", structure: "Circuit of bodyweight movements, whole body, no kit. Built for the beach house or anywhere without equipment.", felt: "" },
  { id: "calisthen", body: { legs: 2, back: 2, chest: 2, shoulders: 2, arms: 2, core: 3, heart: 1 },  name: "Beginner Calisthenics", goal: "strength",    intensity: 3, recoveryCost: 3, shoulderLoad: "medium", durations: [20, 30, 45], equipment: "Bodyweight, bar",        cue: "Own the slow half of every rep." },
  { addon: true, id: "stretch", body: { legs: 1, back: 1, chest: 0, shoulders: 1, arms: 0, core: 0, heart: 0 },    name: "Full-Body Stretching",  goal: "mobility", intensity: 1, recoveryCost: 1, shoulderLoad: "low",    durations: [15, 20, 30], equipment: "Mat",                    cue: "Hold each one longer than feels necessary." },
  { addon: true, id: "mobility", body: { legs: 1, back: 1, chest: 0, shoulders: 2, arms: 0, core: 1, heart: 0 },   name: "Mobility",              goal: "mobility",    intensity: 2, recoveryCost: 1, shoulderLoad: "low",    durations: [10, 15, 20, 30], equipment: "Mat, band",          cue: "Find the end of the range, then breathe there." },
  { addon: true, id: "cable", body: { legs: 2, back: 3, chest: 2, shoulders: 2, arms: 2, core: 1, heart: 1 }, home: true, name: "Cable Tower Strength",goal: "strength",    intensity: 3, recoveryCost: 3, shoulderLoad: "medium", durations: [30, 45, 60], equipment: "Cable machine",          cue: "Control the return — don't let it snap back." },
  { id: "multigym", body: { legs: 3, back: 3, chest: 2, shoulders: 2, arms: 2, core: 1, heart: 1 }, home: true,   name: "Multi-Gym Strength",    goal: "strength",    intensity: 3, recoveryCost: 3, shoulderLoad: "medium", durations: [30, 45, 60], equipment: "Multi-gym station",      cue: "Full range beats heavy load." },
  { addon: true, id: "dumbbell", body: { legs: 2, back: 2, chest: 2, shoulders: 2, arms: 3, core: 1, heart: 1 }, home: true,   name: "Dumbbell Strength",     goal: "strength",    intensity: 3, recoveryCost: 3, shoulderLoad: "high",   durations: [30, 45, 60], equipment: "Dumbbells, bench",       cue: "Match left to right, rep for rep." },
  { addon: true, id: "bands", body: { legs: 2, back: 2, chest: 1, shoulders: 2, arms: 2, core: 1, heart: 1 },      name: "Resistance Band Strength", goal: "strength", intensity: 2, recoveryCost: 2, shoulderLoad: "low",    durations: [15, 20, 30], equipment: "Resistance bands",       cue: "Keep tension on the band the whole set." },
  { id: "treadmill", body: { legs: 2, back: 0, chest: 0, shoulders: 0, arms: 0, core: 1, heart: 3 }, home: true,  name: "Treadmill Walking",     goal: "cardio",      intensity: 2, recoveryCost: 1, shoulderLoad: "low",    durations: [20, 30, 45, 60], equipment: "Treadmill",          cue: "Add incline before you add speed." },
  { id: "elliptical", body: { legs: 2, back: 1, chest: 0, shoulders: 1, arms: 1, core: 1, heart: 3 }, home: true, name: "Elliptical Training",   goal: "cardio",      intensity: 3, recoveryCost: 2, shoulderLoad: "low",    durations: [20, 30, 45], equipment: "Elliptical",             cue: "Push and pull evenly — don't just ride it." },
  { id: "yoga", body: { legs: 2, back: 2, chest: 1, shoulders: 2, arms: 1, core: 2, heart: 1 },       name: "Yoga",                  goal: "mobility",    intensity: 2, recoveryCost: 2, shoulderLoad: "medium", durations: [30, 45, 60], equipment: "Mat, blocks",           cue: "Stay in the pose long enough for it to change. Come out of anything that pinches the shoulder.", home: true, resistance: "Bodyweight, blocks under the hands when the shoulder needs the height", structure: "Breath work, sun salutations, standing sequence, balance poses, floor work on hips and hamstrings, savasana.", felt: "" },
  { addon: true, id: "swimming", body: { legs: 2, back: 3, chest: 2, shoulders: 3, arms: 2, core: 2, heart: 3 },   name: "Swimming",              goal: "cardio",      intensity: 4, recoveryCost: 3, shoulderLoad: "high",   durations: [20, 30, 45], equipment: "Pool",                   cue: "Long strokes, fewer of them." },
  { addon: true, id: "recwalk", body: { legs: 1, back: 0, chest: 0, shoulders: 0, arms: 0, core: 0, heart: 1 },    name: "Recovery Walk",         goal: "recovery",    intensity: 1, recoveryCost: 1, shoulderLoad: "low",    durations: [15, 20, 30, 45], equipment: "None",               cue: "Easy enough to hold a conversation the whole way." },
];


/* ---- TUNABLE NUMBERS ------------------------------------------------------
   The knobs behind the calculations, editable in the app so a threshold can
   change without touching code.
--------------------------------------------------------------------------- */
const FORMULA_DEFAULTS = {
  /* recovery bands, read against her own baseline rather than WHOOP's scale */
  bandGreen: 3, bandSteady: -10, bandEasy: -20,

  /* weekly health score weights — renormalised, so they needn't total 100 */
  wCompletion: 40, wRecovery: 20, wSleep: 15, wStrength: 10, wMobility: 10, wBalance: 5,

  /* how far back consistency looks. A window, never a streak. */
  consistencyWindow: 28,

  /* ---- the numbers that actually decide what the coach says ----------------
     These governed the coaching from inside the engine, where she could never
     reach them. They live here now so a threshold can be argued with and
     changed from Settings, without touching code. */

  /* Load balance. Acute:chronic ratio — the corridor the evidence supports. */
  acwrLow: 0.8,        /* below this: doing less than she is built for      */
  acwrHigh: 1.3,       /* above this: pushing                               */
  acwrSpike: 1.5,      /* above this: a spike, which is where injury lives  */

  /* Sets per region per week. 6-10 is what governs holding muscle at 51. */
  setTarget: 6,

  /* Share of the week's work a region needs before it counts as covered. */
  coverMin: 0.07,      /* 7% of total load          */
  coverStrong: 0.14,   /* 14% reads as a real share */

  /* Measurement error floors. Change is only called real above these; below
     them the word is "holding", never "declining". Percentages. */
  mdcLoad: 5,          /* weight x reps    */
  mdcTime: 10,         /* timed holds      */
  mdcReps: 15,         /* rep counts       */
  mdcBalance: 20,      /* balance tests    */

  /* Left-right gap worth naming, as a percentage. Two different tests, two
     different bars: a mobility range test tolerates more side-to-side spread
     than a strength measure does before it means anything. */
  asymmetryPct: 15,   /* mobility battery */
  bilateralPct: 10,   /* strength battery - a 10% gap is worth closing */
};
const formulas = (settings) => ({ ...FORMULA_DEFAULTS, ...(settings?.formulas || {}) });



/* ---- STARTING ASSESSMENT FIELDS ------------------------------------------
   These are only the seed. Everything below is editable inside the app:
   rename, change units, reorder, add, delete. Ids never change once created,
   so renaming an exercise keeps its history intact.
   type: 'number' | 'scale' | 'note'   better: 'up' | 'down' | null
--------------------------------------------------------------------------- */
/* Every region the training touches. The app used to watch one shoulder and
   nothing else; this is what lets it account for the whole body instead. */
const REGIONS = [
  { id: "legs",      label: "Legs",      note: "Squats, lunges, walking, cycling. The biggest muscles you own and the first to go with age." },
  { id: "back",      label: "Back",      note: "Rows, pulls, swimming. Posture, and the counterweight to everything you press." },
  { id: "chest",     label: "Chest",     note: "Presses and push-ups." },
  { id: "shoulders", label: "Shoulders", note: "Overhead and lateral work. The region you have been protecting." },
  { id: "arms",      label: "Arms",      note: "Biceps, triceps, grip. Grip strength alone predicts a surprising amount." },
  { id: "core",      label: "Core",      note: "Trunk and deep stabilisers. What lets everything else transmit force." },
  { id: "heart",     label: "Heart",     note: "Aerobic work. The system your resting heart rate has already been reporting on." },
];
const CAPS = ["lower", "push", "pull", "core", "cardio", "mobility", "balance"];

/* Default share of work per region, by what a class is for. Used only when a
   class carries no body map of its own — which is every class she adds until
   she edits it. 0-3 per region, same scale the seed library uses. */
const BODY_BY_GOAL = {
  strength: { legs: 2, back: 2, chest: 2, shoulders: 2, arms: 2, core: 2, heart: 1 },
  core:     { legs: 1, back: 2, chest: 0, shoulders: 1, arms: 0, core: 3, heart: 1 },
  mobility: { legs: 2, back: 2, chest: 1, shoulders: 2, arms: 1, core: 2, heart: 0 },
  cardio:   { legs: 2, back: 1, chest: 0, shoulders: 0, arms: 0, core: 1, heart: 3 },
  recovery: { legs: 1, back: 1, chest: 0, shoulders: 0, arms: 0, core: 1, heart: 1 },
};


/* ============================================================================
   THE ENGINE
   Everything here answers one of two questions: what should today look like,
   and should anything get harder this week. Recovery decides the day.
   The weekly battery decides the direction. Recovery always outranks
   progression — a good plan on a bad body is still a bad session.
========================================================================== */

/* --- recovery prescription -------------------------------------------------
   The bands sit relative to her own baseline rather than WHOOP's scale. A
   score of 55 means something different for every body, and thresholds she can
   never reach would just be a brake with a percentage sign on it. The baseline
   is the median of the last thirty days, so as her recovery genuinely improves
   the bar rises with it — no need to touch anything.
------------------------------------------------------------------------- */
const BAND_OFFSETS = [
  { over: +3,  key: "green",  label: "Progress",         line: "Above your normal. If a variable is due to move, today is the day to move it." },
  { over: -10, key: "steady", label: "Train as planned", line: "This is your normal. Do the session you intended — don't add to it." },
  { over: -20, key: "easy",   label: "Ease off",         line: "Below your normal. Take about a fifth off — shorter, or the same with less load." },
  { over: -99, key: "rest",   label: "Recovery only",    line: "Well below your normal. Mobility, stretching or a walk. Movement yes, training no." },
];

const recoveryBaseline = (morning, t) => {
  const vals = [];
  for (let i = 1; i <= 30; i++) {
    const v = Number(morning?.[addDays(t, -i)]?.recovery);
    if (!isNaN(v) && v > 0) vals.push(v);
  }
  if (vals.length < 5) return null;
  vals.sort((a, b) => a - b);
  return Math.round(vals[Math.floor(vals.length / 2)]);
};

const recoveryBand = (v, baseline, F = FORMULA_DEFAULTS) => {
  if (v === null || v === "" || isNaN(Number(v))) return null;
  const base = baseline || 55;
  const offs = [F.bandGreen, F.bandSteady, F.bandEasy, -999];
  const i = offs.findIndex((o) => Number(v) >= base + o);
  const band = BAND_OFFSETS[i < 0 ? 3 : i];
  return { ...band, base, threshold: base + offs[i < 0 ? 3 : i] };
};

/* --- confidence: how she rates herself decides how ambitious to be --------- */
const confidenceRule = (c) => {
  if (c === null || isNaN(c)) return null;
  if (c >= 8) return { key: "up",   line: "Confidence is high. Good week to move a variable." };
  if (c >= 6) return { key: "hold", line: "Confidence is steady. Keep things where they are." };
  return { key: "down", line: "Confidence is low. Simplify — fewer variables, cleaner sessions." };
};

/* --- trend: weekly averages only. Never compare one day to another. -------- */
const trendOf = (series) => {
  const v = series.filter((x) => !isNaN(x) && x !== null);
  if (v.length < 2) return { key: "new", label: "Not enough weeks yet" };
  const half = Math.max(1, Math.floor(v.length / 2));
  const older = v.slice(0, half), recent = v.slice(-half);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const delta = avg(recent) - avg(older);
  const scale = Math.abs(avg(older)) || 1;
  if (delta / scale > 0.03) return { key: "up", label: "Improving" };
  if (delta / scale < -0.03) return { key: "down", label: "Needs attention" };
  return { key: "flat", label: "Maintained" };
};

/* --- weekly health score --------------------------------------------------
   Weights only count when the data behind them exists, then renormalise.
   A score built on a third of the inputs is not a score, so we say so.
------------------------------------------------------------------------- */
const HEALTH_WEIGHTS = { completion: 40, recovery: 20, sleep: 15, strength: 10, mobility: 10, balance: 5 };

/* Nothing above is fixed. These are the starting values; Settings → Formulas
   edits them and the engine reads the edited ones from that point on. */

const healthScore = (parts, weights = HEALTH_WEIGHTS) => {
  let got = 0, weight = 0;
  Object.entries(weights).forEach(([k, w]) => {
    const v = parts[k];
    if (v === null || v === undefined || isNaN(v)) return;
    got += Math.max(0, Math.min(1, v)) * w;
    weight += w;
  });
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (!weight) return null;
  return { score: Math.round((got / weight) * 100), coverage: weight / total, partial: weight / total < 0.6 };
};

/* --- season: winter is for holding on, not for personal bests ------------- */
const seasonOf = (t) => {
  const m = parse(t).getMonth();
  return (m === 11 || m === 0 || m === 1)
    ? { key: "maintain", name: "Maintenance season",
        line: "December through February. The goal is holding the line, not adding to it. Target drops by one and progression pauses. Staying level through winter is the win." }
    : { key: "normal", name: "", line: "" };
};

/* --- the weekly verdict: five signals in, one direction out ---------------- */
const weeklyVerdict = ({ hitTarget, comfortOk, recoveryOk, confidence, quality }) => {
  const signals = [hitTarget, comfortOk, recoveryOk, confidence, quality].filter((x) => x !== null);
  if (signals.length < 3) return { key: "unknown", label: "Not enough to call it", line: "Fill in the weekly battery and I can tell you what to move." };
  const bad = signals.filter((x) => x === false).length;
  const good = signals.filter((x) => x === true).length;
  if (bad === 0 && good === signals.length) return { key: "advance", label: "Move one variable up", line: "Everything pointed the right way. Pick one thing — duration, load or complexity — and move only that." };
  if (bad >= 2) return { key: "reduce", label: "Pull back a step", line: "More than one signal is off. Drop back to last week's settings and let the body catch up." };
  return { key: "hold", label: "Hold here another week", line: "Mixed signals. Repeat this week as it was. Repeating is not standing still." };
};

/* --- the shoulder rule ----------------------------------------------------
   Load is the ceiling, not volume. Anything overhead moves half a kilo a week
   at most, and stops moving entirely when comfort drops.
------------------------------------------------------------------------- */
const SHOULDER_SENSITIVE = ["press", "raise", "updown"];
const KG_STEP_SHOULDER = 0.5;


/* --- themes the coach writes itself ---------------------------------------
   A theme is the one sentence that explains why this block looks the way it
   does. It comes from the phase, the season and how far into the block we are
   — never from being asked. Anything typed in Workouts overrides it.
------------------------------------------------------------------------- */
const WEEK_THEMES = {
  restoration: [
    "Show up daily. Nothing else matters this week.",
    "Range before load. Move fully, weigh lightly.",
    "Shoulder every day — small doses beat big sessions.",
    "Breathe through the long holds. Endurance is built in seconds.",
  ],
  familiarise: [
    "Learn the room. One piece of equipment at a time.",
  ],
  building: [
    "Groove the movements. Clean form, light load.",
    "Add minutes before you add kilos.",
    "One variable moves this week. Only one.",
    "Test week. The battery decides what happens next.",
  ],
};

const MONTH_THEMES = {
  restoration: "Restoration — Pilates and mobility carry the block, the shoulder gets rebuilt quietly underneath.",
  familiarise: "Arrival — the home gym becomes somewhere you know your way around.",
  building:    "Building — strength added onto a base that already moves well.",
};

const quarterTheme = (t) => {
  const m = parse(t).getMonth();
  if (m >= 2 && m <= 4) return "Build again. Winter held, now add to it.";
  if (m >= 5 && m <= 7) return "Rebuild the base. Mobility, consistency, a shoulder that stops setting the ceiling.";
  if (m >= 8 && m <= 10) return "Put the gym to work. Strength on top of the base.";
  return "Hold through winter. Level in March is a win, not a plateau.";
};

const autoThemes = (t, pos, phaseKey, seasonKey) => {
  const pool = WEEK_THEMES[phaseKey] || WEEK_THEMES.building;
  const week = seasonKey === "maintain"
    ? ["Turning up is the whole job this week.",
       "Same sessions, same weights. Repetition is the point.",
       "Move on the days you least feel like it.",
       "Nothing needs to get harder. Turning up is the win."][(pos.week - 1) % 4]
    : pool[(pos.week - 1) % pool.length];
  return {
    week,
    month: seasonKey === "maintain" ? "Maintenance — hold the line through the dark months." : MONTH_THEMES[phaseKey],
    quarter: quarterTheme(t),
  };
};


/* ============================================================================
   THE DAILY NOTE
   One line a day, never repeated. Not about training, and never conditional on
   it — these have to land just as well on a day she does nothing. No mention of
   age, body, injury or anything to recover from. Just good words.
========================================================================== */
const NOTES = [
  "You are exactly where your own effort has brought you.",
  "There is a quiet power in people who keep their promises to themselves.",
  "Today is yours. Do something with it that only you would think of.",
  "You are allowed to take up space, ask for more, and expect good things.",
  "Strength looks like calm. You have plenty of both.",
  "Some people wait to feel ready. You are not one of them.",
  "The way you carry yourself changes the room. It always has.",
  "You've never needed permission. You still don't.",
  "There is nothing ordinary about the way you go after things.",
  "Whatever today asks of you, you already have the answer.",
  "You are not a work in progress. You are a person in motion.",
  "Grace is not the absence of effort. It's what effort looks like when it's practised.",
  "Trust the version of you that made the decision. She knew what she was doing.",
  "You get to decide what today means. That's an enormous amount of power.",
  "The best thing about you is not visible in any mirror.",
  "You are the kind of person things work out for, because you make them.",
  "Softness and steel are not opposites. You've always been both.",
  "Do it your way. Your way has an excellent track record.",
  "You have never once been boring.",
  "Confidence isn't loud. Sometimes it's just someone who doesn't argue with herself.",
  "You are more interesting than anything worrying you today.",
  "There's a lightness available to you today. Take it.",
  "You don't have to earn a good day. Have one anyway.",
  "Everything you've built, you built. Nobody handed it to you.",
  "Beauty is a way of moving through the world, and you move well.",
  "The people who love you are right about you.",
  "You are not required to be impressive today. You already are.",
  "Ease is not laziness. Let some things be easy.",
  "You have excellent taste, especially in how you spend your time.",
  "There is a kind of woman who simply decides. You're her.",
  "Nothing about you needs fixing today.",
  "Joy counts as an achievement. Collect some.",
  "Your standards are not too high. They're yours.",
  "You are allowed to be delighted by small things.",
  "Whatever you choose today will be the right choice, because you chose it.",
  "Elegance is doing the thing without making a production of it.",
  "You are somebody's favourite person. Probably several people's.",
  "The world is more interesting because you're paying attention to it.",
  "You don't owe anyone an explanation for taking care of yourself.",
  "Be generous with yourself today. You'd do it for anyone else.",
  "You are not behind. There is no race.",
  "Some days you lead. Some days you rest. Both are you.",
  "Your presence is the thing people remember, not your performance.",
  "You have survived every single one of your hardest days.",
  "There is more ahead of you than behind you. That's just arithmetic.",
  "You are allowed to want more and be grateful at the same time.",
  "The most attractive thing in the world is someone who's fully occupied living.",
  "You've earned the right to be exactly as you are.",
  "There's no one else with your particular way of seeing things.",
  "Today doesn't need to be productive to be good.",
  "You are your own best company.",
  "The confidence you're waiting for is already in you, just quieter than you'd like.",
  "You are not too much. You never were.",
  "Wear the good thing. Use the good thing. Today qualifies.",
  "Being kind to yourself is not the same as letting yourself off.",
  "You have made yourself into someone worth knowing.",
  "Your instincts are good. Follow them.",
  "There's a strength in you that doesn't announce itself.",
  "You are allowed to change your mind about anything.",
  "Whatever you're becoming, it suits you.",
  "You bring something to a room that can't be replaced.",
  "Rest is a decision, not a surrender.",
  "You are not late for anything.",
  "Do the thing that will make today feel like yours.",
  "You've always been resourceful. That doesn't expire.",
  "Some of the best things about you took years to build. They're not going anywhere.",
  "You are not obliged to be anyone's idea of anything.",
  "There is real pleasure available today. Go and find some.",
  "Your body is not a project. It's where you live.",
  "You've done difficult things quietly and never asked for credit.",
  "Be extravagant with something today, even if it's just your attention.",
  "You are more capable than the situation requires.",
  "The way you keep going is not stubbornness. It's character.",
  "You are allowed to enjoy this.",
  "Nothing you need today is out of reach.",
  "You have good judgement. Use it and stop second-guessing.",
  "You are not defined by the hardest thing you're carrying.",
  "There's an unhurried confidence to you when you let yourself have it.",
  "Say the thing. Ask for the thing. You're usually right.",
  "The best part of your life is not a fixed point in the past.",
  "You are worth the effort you put into yourself.",
  "Curiosity suits you. Follow something today just because.",
  "You don't need to be at your best to be enough.",
  "There is nothing you have to prove before you're allowed to feel good.",
  "You are allowed to be proud without being modest about it.",
  "The world responds to people who expect good things. Expect them.",
  "You've been underestimated before. It never lasts.",
  "Whatever you decide today, decide it like it's yours to decide.",
  "You are permitted a completely ordinary, contented day.",
  "The best decisions you've made were the ones you made for yourself.",
  "You have a talent for beginning again. Not everyone does.",
  "There's something in you that doesn't quit, and it's never let you down.",
  "You are not responsible for how everyone else feels today.",
  "Take the compliment. All of them, actually.",
  "You are living a life that took real work to build.",
  "Nothing about today has to be difficult to count.",
  "The way you show up matters more than how well you do it.",
  "You are the constant in your own life. That's not a small thing.",
  "Let today be simple. You've done complicated enough.",
  "You are already someone you would have admired.",
  "There is time. There is more than enough time.",
];

const noteFor = (t, used) => {
  const remaining = NOTES.map((_, i) => i).filter((i) => !used.includes(i));
  const pool = remaining.length ? remaining : NOTES.map((_, i) => i);
  const seed = parse(t).getTime() / 86400000;
  return pool[Math.floor(seed * 2654435761 % pool.length)];
};


/* ============================================================================
   SAMPLE DATA
   Ten weeks of plausible history so every calculation, chart and verdict has
   something real to chew on. Generated, not hard-coded: it builds off today's
   date and the current field definitions, so it stays valid if you edit them.
   One tap to load, one tap to clear.
========================================================================== */
const buildSample = (fields, library) => {
  const t = today();
  const logs = {}, morning = {}, weekly = {}, monthly = {}, journal = [];
  const classes = library.filter((w) => !w.home);
  const pick = (i) => classes[i % classes.length] || library[0];

  /* 70 days back: two on, one off, with a few honest misses */
  for (let i = 69; i >= 0; i--) {
    const d = addDays(t, -i);
    const cycle = (69 - i) % 3;
    const rec = Math.round(48 + 12 * Math.sin(i / 4) + (i % 5) - 2);
    /* resting heart rate drifts down and HRV up across the three months, so
       the autonomic and adaptation metrics have something real to read */
    const age = (69 - i) / 69;
    morning[d] = {
      recovery: String(Math.max(28, Math.min(78, rec))),
      rhr: String(Math.round(67 - age * 4 + (i % 4) - 1.5)),
      hrv: String(Math.round(21 + age * 6 + (i % 5) - 2)),
      strain: (7 + (i % 7) * 0.9).toFixed(1),
      asleep: String(Math.round(505 + (i % 9) * 12 - 40)),
      bedAt: String((1395 + (i % 5) * 11) % 1440),      /* ~23:15, drifting */
      wakeAt: String(475 + (i % 7) * 9),                /* ~07:55, drifting */
      shoulderAM: String(Math.min(5, 3 + Math.round(age * 2) + (i % 13 === 0 ? -1 : 0))),
    };

    if (cycle === 2) { logs[d] = { rest: true, completed: false, sleep: (7.8 + (i % 5) * 0.35).toFixed(1) }; continue; }
    if (i % 17 === 3) continue;                       /* a missed day here and there */

    const w = pick(i);
    logs[d] = {
      completed: true, type: w.name, minutes: String(w.durations[0] || 45),
      /* effort and sets — without these, load, balance, coverage and the
         weekly-sets metric all stay blank and the demo shows nothing */
      rpe: String(Math.max(3, Math.min(9, Math.round(4 + (w.intensity || 3) * 0.7 + (i % 3) - 1)))),
      sets: w.goal === "strength" ? String(10 + (i % 3) * 2)
        : w.goal === "core" ? String(6 + (i % 2) * 2)
        : w.goal === "cardio" ? "0" : String(4 + (i % 2) * 2),
      energyAfter: String(3 + (i % 3)), shoulder: String(i % 11 === 0 ? 3 : 4 + (i % 2)),
      sleep: (7.6 + (i % 6) * 0.32).toFixed(1),
      whoopRecovery: morning[d].recovery,
      whoopStrain: (7 + (i % 7) * 0.8).toFixed(1),
      sessionNote: i % 9 === 0 ? "Felt strong through the whole thing." : "",
      extraSessions: i % 6 === 0
        ? [{ id: newId(), type: "Full-Body Stretching", minutes: "20", rpe: "3", sets: "0",
             note: i % 12 === 0 ? "Hamstrings still tighter on the left." : "" }]
        : [],
    };
  }

  /* weekly battery: ten weeks of gentle, uneven improvement */
  const wf = fields.weekly.filter((f) => f.type !== "note");
  for (let wk = 9; wk >= 0; wk--) {
    const key = weekStart(addDays(t, -wk * 7));
    /* real progress is uneven: two flat weeks, one dip, one jump */
    const shape = [0, 0.06, 0.10, 0.10, 0.04, 0.16, 0.24, 0.26, 0.25, 0.34];
    const growth = shape[9 - wk];
    const wobble = 0;
    const entry = {};
    wf.forEach((f) => {
      const g = growth + wobble;
      if (f.type === "scale") { entry[f.id] = String(Math.max(1, Math.min(f.max || 5, Math.round((f.max || 5) * (0.6 + 0.35 * g))))); return; }
      if (f.type === "rung") { entry[f.id] = String(1 + Math.floor(g * ((f.rungs?.length || 1) - 1))); entry[f.id + "__rung"] = Math.floor(g * ((f.rungs?.length || 1) - 1)); return; }
      if (f.type === "time") { const secs = Math.round(430 - 70 * g); entry[f.id] = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`; return; }
      if (f.type === "weightreps") {
        entry[f.id + "__w"] = (4 + Math.round(g * 8 * 2) / 2).toFixed(1);
        if (f.bilateral) { entry[f.id + "__L"] = String(8 + Math.round(g * 4)); entry[f.id + "__R"] = String(8 + Math.round(g * 4)); }
        entry[f.id] = String(8 + Math.round(g * 4));
        return;
      }
      if (f.id === "weight") { entry[f.id] = (68 - g * 1.6).toFixed(1); return; }
      const base = f.unit === "sec" ? 30 : 10;
      entry[f.id] = String(Math.round(base * (1 + 0.7 * g)));
      if (f.bilateral) { entry[f.id + "__L"] = entry[f.id]; entry[f.id + "__R"] = String(Math.round(Number(entry[f.id]) * 0.92)); }
      if (f.rungs?.length > 1) entry[f.id + "__rung"] = Math.floor(g * (f.rungs.length - 1));
    });
    entry.win = wk % 3 === 0 ? "Held the plank longer than I thought I could." : "";
    entry.challenge = wk % 4 === 0 ? "Shoulder complained on the overhead work." : "";
    weekly[key] = entry;
  }

  /* monthly benchmark: body composition, three months */
  for (let m = 2; m >= 0; m--) {
    const key = monthKey(addDays(t, -m * 30));
    monthly[key] = { muscle: (33 + (2 - m) * 0.5).toFixed(1), fat: (31 - (2 - m) * 0.7).toFixed(1) };
  }

  journal.push({ id: newId(), date: addDays(t, -21), text: "Starting to feel like this is just what I do now, rather than something I'm making myself do." });
  journal.push({ id: newId(), date: addDays(t, -7), text: "Noticed I reached for something on a high shelf without thinking about my shoulder first. That hasn't happened in a long time." });

  return { logs, morning, weekly, monthly, journal, sample: true };
};


/* ============================================================================
   THE PRESCRIPTION
   The coach picks the class. Not a menu, not a filter — one named decision
   with the reasoning attached, because deciding is the job you hired it for.
   You can always overrule it, and overruling is one tap.
========================================================================== */
/* ---------------------------------------------------------------------------
   THE PROGRAMME
   Designed one month at a time, never further. Only the live block exists;
   the next is drawn up at the end of this one from the evidence this one
   produced. Every day has a block; every block resolves to an actual class
   from the library. Mobility, flexibility and balance are one thing here,
   because splitting them produced three thin categories instead of one solid
   one. Swimming and walking are add-ons and never appear as the day's work.
--------------------------------------------------------------------------- */

/* Kinds of day. `ids` names the seed classes that suit each kind; `goals` is
   what actually makes it extensible — any class carrying one of these goals
   qualifies, including one she adds herself years from now. Without `goals` a
   new class could never be prescribed, because its id would be in no list. */
const BLOCKS = {
  pilates:  { label: "Pilates",            color: "#127E82", ids: ["pilates", "lmpilates"], goals: ["core"],
              why: "Control and position before load. This is the base everything later sits on." },
  core:     { label: "Core",               color: "#127E82", ids: ["lmcore", "lmpilates"], goals: ["core"],
              why: "The trunk is what lets your arms and legs actually transmit force." },
  strength: { label: "Strength",           color: "#9B2D52", ids: ["bodypump", "strength", "multigym", "calisthen", "functional", "wod", "bodyweight"], goals: ["strength"],
              why: "Load against the clock. At 51 this is the one that decides how the next decade goes." },
  move:     { label: "Mobility & balance", color: "#D4638A", ids: ["bodybalance", "yoga"], goals: ["mobility"],
              why: "Range, balance and flexibility together — the qualities that quietly disappear if nobody schedules them." },
  cardio:   { label: "Cardio",             color: "#D4638A", ids: ["bodycombat", "treadmill", "elliptical", "functional"], goals: ["cardio"],
              why: "The heart is a muscle too, and it answers to training the same way the rest of you does." },
  rest:     { label: "Rest",               color: "#8A7885", ids: [], goals: [],
              why: "Adaptation happens now, not during the session. This day is doing work." },
};

/* Sunday-first, because her week runs Sunday to Saturday. This is the seed
   only — the live programme is stored in data.program and is fully editable:
   any day of any phase can be changed, phases can be lengthened or shortened,
   and the start date can move. */
/* ============================================================================
   HOW OFTEN SHE TRAINS — HER RHYTHM, NOT THE APP'S
   ---------------------------------------------------------------------------
   This used to be two disagreeing systems: the programme laid session kinds
   out across the seven weekdays, while her actual schedule ran a rotating
   two-on-one-off cycle. A rotating pattern can never stay in phase with a
   fixed weekday pattern, so her deliberate rest days were counted as missed
   sessions — permanently, on a flawless record.

   One rhythm now, and it is hers. Adding a new way of training is a new entry
   in this list and nothing else: give it an id, a label, the question the
   coach asks, and a `trains` function. Nothing below this list knows or cares
   which mode is in use.

   `trains(date, ctx)` answers one question — should she be training on this
   day? ctx carries { schedule, logs, dayName, addDays, weekStart, done }.
--------------------------------------------------------------------------- */
const SCHEDULE_MODES = [
  {
    id: "cycle",
    label: "A rolling cycle",
    blurb: "So many days on, so many off — it rolls with you rather than with the calendar.",
    ask: "How many days on, and how many off?",
    summary: (sc) => `${Number(sc.on) || 2} on, ${Number(sc.off) || 1} off`,
    /* Anchored to what she actually did, not to a date: train a day late and
       the cycle simply moves with her. */
    trains: (d, ctx) => {
      const on = Number(ctx.schedule.on) || 2, off = Number(ctx.schedule.off) || 1;
      let run = 0;
      for (let i = 1; i <= on; i++) { if (ctx.done(ctx.addDays(d, -i))) run++; else break; }
      if (run < on) return true;
      let rested = 0;
      for (let i = 1; i <= off; i++) { if (!ctx.done(ctx.addDays(d, -i))) rested++; else break; }
      return rested >= off;
    },
  },
  {
    id: "days",
    label: "Chosen days of the week",
    blurb: "The same days each week. Good when life is arranged around a fixed schedule.",
    ask: "Which days of the week do you want to train?",
    summary: (sc) => (sc.days || []).join(", ") || "no days chosen yet",
    trains: (d, ctx) => (ctx.schedule.days || []).includes(ctx.dayName(d)),
  },
  {
    id: "count",
    label: "A number of times a week",
    blurb: "You decide which days. Nothing counts as missed until the week runs out — the most forgiving of the three.",
    ask: "How many times a week do you want to train?",
    summary: (sc) => `${Number(sc.perWeek) || 4} times a week, your choice of days`,
    /* Every day is available until the week's number is met. */
    trains: (d, ctx) => {
      const target = Number(ctx.schedule.perWeek) || 4;
      const ws = ctx.weekStart(d);
      let doneThisWeek = 0;
      for (let i = 0; i < 7; i++) {
        const day = ctx.addDays(ws, i);
        if (day >= d) break;
        if (ctx.done(day)) doneThisWeek++;
      }
      return doneThisWeek < target;
    },
    /* A day is only missed once the week is over and the number was not met. */
    weeklyShortfall: true,
  },
];
const scheduleMode = (sc) => SCHEDULE_MODES.find((m) => m.id === (sc?.mode)) || SCHEDULE_MODES[0];

/* Her rhythm, read from settings, tolerating anything written before this
   existed. Nothing is hard-coded here: an absent setting falls back to what
   the old fields said, and only then to a sensible default. */
const scheduleOf = (settings) => {
  const sc = settings?.schedule;
  if (sc && sc.mode) return sc;
  /* legacy shape */
  if (settings?.scheduleMode === "days")
    return { mode: "days", days: settings.preferredDays || [] };
  return { mode: "cycle", on: Number(settings?.cycleOn) || 2, off: Number(settings?.cycleOff) || 1 };
};
const scheduleSummary = (sc) => scheduleMode(sc).summary(sc || {});

/* Has she told the coach her rhythm, or is this still the default? */
const scheduleSet = (settings) => !!settings?.schedule?.mode;

/* How many sessions a week her rhythm implies. There must be exactly one
   answer to this: a separate "weekly target" field that disagreed with the
   rhythm would have the app measuring her against a number she never chose.
   Once she has set a rhythm, the rhythm is the number. */
const weeklyTargetOf = (settings) => {
  const sc = scheduleOf(settings);
  if (scheduleSet(settings)) {
    if (sc.mode === "count") return Math.max(1, Number(sc.perWeek) || 4);
    if (sc.mode === "days") return Math.max(1, (sc.days || []).length || 4);
    if (sc.mode === "cycle") {
      const on = Number(sc.on) || 2, off = Number(sc.off) || 1;
      return Math.max(1, Math.round((7 * on) / (on + off)));
    }
  }
  return Number(settings?.weeklyTarget) || 4;
};

const SEED_PROGRAM = {
  start: "2026-08-05",
  /* One block at a time. Only the live block is committed; the next is
     designed at the end of this one, from the evidence this one produced.
     Nobody knows where she'll be in four weeks, so nothing pretends to. */
  phases: [
    { id: "restore", name: "Restoration", weeks: 4, status: "live", calibrate: true,
      line: "Mostly Pilates, nothing heavy, and the shoulder rehabilitated to the point where it stops being a constraint. Your job this month is to log everything — the coach has nothing to design from yet.",
      basis: ["Starting point. Away from the home gym, limited equipment, coming back from a sedentary stretch."],
      /* The order the kinds come round in, on the days she trains. Rest is not
         in here — her rhythm decides the rest days, not the programme. */
      sequence: ["pilates", "move", "core", "pilates", "cardio"],
      week: ["pilates", "move", "rest", "pilates", "rest", "core", "cardio"] },
  ],
};

/* ---------------------------------------------------------------------------
   HOW THE NEXT BLOCK GETS DESIGNED
   Written down so the reasoning is inspectable rather than a black box. At
   the end of each block the coach reads the month that just happened and
   applies these in order. The first rule that fires sets the shape; the rest
   adjust the detail. She can override any of it.
--------------------------------------------------------------------------- */
const DESIGN_RULES = [
  { id: "autonomic", test: "resting heart rate up 3+ bpm on the month, or HRV down 10%+",
    does: "Deload. Drop one training day, replace a strength day with mobility.",
    why: "A body that isn't recovering doesn't adapt to more work — it accumulates it." },
  { id: "shoulder", test: "next-morning shoulder worse across the block",
    does: "Hold strength days at the same count, freeze overhead progression.",
    why: "The 24-hour response is the load signal. Ignoring it is how a niggle becomes a season." },
  { id: "adherence", test: "consistency under 60%",
    does: "Reduce to the number of days actually being hit, and make them the ones she likes.",
    why: "A plan she doesn't do is worth less than a smaller plan she does." },
  { id: "spike", test: "load climbing faster than 10% a week",
    does: "Hold the shape, hold the volume, let the base catch up.",
    why: "Injuries come from sudden training, not hard training." },
  { id: "sets", test: "any region under six working sets a week",
    does: "Convert the weakest-served day to the block that feeds it.",
    why: "Six to ten sets per muscle per week is the dose that holds muscle past menopause." },
  { id: "ready", test: "consistency 80%+, load steady, shoulder stable, nothing declining",
    does: "Progress. Add a strength day, or lengthen the existing ones.",
    why: "This is the only condition under which adding work is a good idea." },
  { id: "why", test: "she has given reasons for missed days, and one reason accounts for most of them",
    does: "Change the thing that reason names — the day, the length, the class — rather than the amount of training.",
    why: "Knowing she missed is not enough to coach her. Missing because she was exhausted and missing because she was unmotivated need opposite responses, and the app used to be unable to tell them apart." },
  { id: "prefers", test: "what she reliably swaps out of, and what she reaches for instead",
    does: "Move the avoided class off its day and put what she actually chooses in its place.",
    why: "Revealed preference beats anything said once. A class she quietly never does is a hole in the block, however good it looks on paper." },
  { id: "brakes", test: "twelve weeks of conditions naming what reliably costs her a session",
    does: "Build the block around the conditions that work and defuse the ones that don't.",
    why: "This was computed for months and read by nothing. The whole point of watching what precedes a session is to stop it being a surprise." },
  { id: "profile", test: "anything the coach has come to believe about her at BELIEVED confidence",
    does: "Order the block by it — never restrict by it. A class she disliked still appears; it stops being first.",
    why: "One comment must never become a permanent rule, and a preference confirmed three times should not have to be said a fourth." },
  { id: "goals", test: "she has stated something she wants to be able to do, or a mobility test is short or asymmetric",
    does: "Bias the block toward the regions that goal needs, and set the daily ten minutes to its drills.",
    why: "A capability she chose is more durable motivation than any number the app produces — and it is the part of this that answers to her rather than to the data." },
  { id: "season", test: "December to February",
    does: "Maintain. Same shape, no progression, lower expectations on purpose.",
    why: "Getting through the low months still training is the win." },
  { id: "place", test: "away from the home gym",
    does: "Only blocks that need no equipment — Pilates, mobility, core, walking cardio.",
    why: "A plan that needs a barbell she can't reach is a plan she'll miss." },
];

/* Phases carry a length rather than fixed week numbers, so stretching month
   one by a fortnight doesn't require renumbering everything after it. */
/* Phases carry a length rather than fixed week numbers, so stretching month
   one by a fortnight doesn't require renumbering everything after it. */
const phaseRanges = (program) => {
  let at = 0;
  return (program?.phases || []).map((ph, i) => {
    const from = at; at += Math.max(1, Number(ph.weeks) || 1);
    return { ...ph, month: i + 1, from, to: at - 1 };
  });
};
const programWeekOf = (date, program) => {
  const d = Math.floor((parse(date) - parse(program?.start || SEED_PROGRAM.start)) / 86400000);
  if (d < 0) return null;
  return Math.floor(d / 7);
};
const phaseForWeek = (wk, program) => {
  if (wk === null) return null;
  const rs = phaseRanges(program);
  return rs.find((p) => wk >= p.from && wk <= p.to) || rs[rs.length - 1] || null;
};
/* WHAT KIND OF SESSION TODAY IS.

   A block used to lay its seven kinds across the seven weekdays, which only
   works if she trains on fixed weekdays. On a rolling cycle the two drift
   apart immediately and her rest days start reading as misses.

   So the block carries a SEQUENCE, and the sequence advances on each day she
   trains — whatever the calendar says. Skip a day and the next kind simply
   waits for her. `trains` is her rhythm, passed in; without it we fall back to
   the old weekday map so blocks written before this still read correctly. */
const blockFor = (date, program, trains) => {
  const wk = programWeekOf(date, program);
  const ph = phaseForWeek(wk, program);
  if (!ph) return null;

  const seq = (ph.sequence && ph.sequence.length) ? ph.sequence : null;
  if (!seq || typeof trains !== "function") {
    const legacyId = (ph.week && ph.week[parse(date).getDay()]) || (seq ? seq[0] : "rest");
    return { id: legacyId, week: wk, phase: ph, ...BLOCKS[legacyId] };
  }

  if (!trains(date)) return { id: "rest", week: wk, phase: ph, ...BLOCKS.rest };

  /* how many training days this block has reached, counting this one */
  const from = phaseStartDate(ph, program);
  let n = 0;
  for (let d = from; d <= date; d = addDays(d, 1)) if (trains(d)) n++;
  const id = seq[(Math.max(1, n) - 1) % seq.length] || "rest";
  return { id, week: wk, phase: ph, ...BLOCKS[id] };
};

/* The calendar date a block began, so the sequence has somewhere to count from. */
const phaseStartDate = (ph, program) =>
  addDays(program?.start || SEED_PROGRAM.start, 7 * (ph.from || 0));

/* ---------------------------------------------------------------------------
   BODY WORK
   Osteopathy, physiotherapy, massage, movement work, lymphatic drainage.
   She books these herself — the coach never prescribes them. But they change
   what the next session should be, so it has to know they happened.

   `after` is the only field the engine acts on:
     easy    tissue is reactive for a day or two — don't load it heavily
     support recovery-enhancing — a harder day afterwards is well tolerated
     guided  someone else is directing the loading; defer to them
   Extensible: add a type here and it appears in the app with no other change.
--------------------------------------------------------------------------- */
const THERAPIES = [
  { id: "osteo", label: "Osteopathy", after: "easy", days: 2,
    why: "Manipulation leaves tissue reactive for a day or two. Loading hard into that is how a good session becomes a sore week." },
  { id: "physio", label: "Physiotherapy", after: "guided", days: 1,
    why: "Someone qualified is directing the loading. Their plan outranks mine — I'll work around it." },
  { id: "deep", label: "Deep tissue massage", after: "easy", days: 2,
    why: "Deep work is a load in its own right. The soreness afterwards is real and worth respecting." },
  { id: "massage", label: "Relaxation massage", after: "support", days: 1,
    why: "Parasympathetic work. It tends to show up as a better recovery score the next morning." },
  { id: "lymph", label: "Lymphatic drainage", after: "support", days: 1,
    why: "Helps clear the residue of hard training. Pairs well with a heavier day after." },
  { id: "kinetic", label: "Kinetic movement", after: "support", days: 1,
    why: "Movement quality work. It makes the next session better rather than costing anything." },
];
const therapyById = (id) => THERAPIES.find((x) => x.id === id) || null;

/* ---------------------------------------------------------------------------
   MOBILITY & FLEXIBILITY
   The weekly battery measures strength. This measures whether the body still
   goes where it should. Each test is a real protocol with a real score, and
   each one names the drills that move it — so a low score produces something
   to do rather than something to feel bad about.

   `side: true` means it's measured left and right, because an asymmetry you
   can't see is one you can't close.
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   THE RECORD
   Everything she tells the coach that isn't a number: a tight back, a bad
   mood, a question about her knee, a cramp after a class. Stored forever,
   tagged so it can be found again, and read before the coach answers.

   The point is not the storing. It is that the third time her right back
   tightens, the coach can say when the other two were, what she tried, what
   worked, and what she had done in the days before each one.
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   WHAT SHE SAYS, OVER TIME
   Every piece of free text she has ever entered — chats, the record, session
   notes, the journal, daily notes — carries a date. So the things she says
   can be counted the same way sessions are, and asked the same questions:
   does this happen more in winter? more at weekends? more than it used to?

   These are patterns in her own words, which is where the answers to "why do
   I lose momentum" actually live. No calculation from WHOOP will find them.
--------------------------------------------------------------------------- */
const VOICE_TAGS = [
  { id: "reluctance", label: "not wanting to", words: ["don't want", "dont want", "can't face", "cant face", "not feeling it", "no motivation", "unmotivated", "skip", "couldn't be bothered", "couldnt be bothered", "lazy", "procrastin", "putting it off", "dreading"] },
  { id: "low", label: "low mood", words: ["low", "down", "sad", "depressed", "miserable", "flat", "empty", "hopeless", "crying", "tearful", "bleak"] },
  { id: "stress", label: "stress", words: ["stress", "anxious", "anxiety", "overwhelmed", "pressure", "panic", "worried", "too much on"] },
  { id: "tired", label: "tiredness", words: ["exhausted", "tired", "drained", "wiped", "no energy", "shattered", "knackered", "heavy"] },
  { id: "pain", label: "pain or tightness", words: ["pain", "hurt", "sore", "ache", "tight", "cramp", "stiff", "twinge", "niggle", "spasm"] },
  { id: "strong", label: "feeling strong", words: ["strong", "good", "great", "easy", "smooth", "powerful", "capable", "energised", "energized", "buzzing", "proud"] },
  { id: "keen", label: "wanting more", words: ["want to", "looking forward", "excited", "can't wait", "cant wait", "keen", "ready for", "more of"] },
];
const SEASONS = [
  { id: "winter", label: "December to February", months: [11, 0, 1] },
  { id: "spring", label: "March to May", months: [2, 3, 4] },
  { id: "summer", label: "June to August", months: [5, 6, 7] },
  { id: "autumn", label: "September to November", months: [8, 9, 10] },
];
const tagText = (text) => {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return [];
  return VOICE_TAGS.filter((g) => g.words.some((w) => t.includes(w))).map((g) => g.id);
};

const ISSUE_KINDS = [
  { id: "pain", label: "Pain", words: ["pain", "hurt", "sore", "ache", "aching", "painful", "sharp", "twinge", "pinch"] },
  { id: "tight", label: "Tightness", words: ["tight", "cramp", "cramped", "stiff", "seized", "locked", "knot", "spasm", "tense"] },
  { id: "weak", label: "Weakness", words: ["weak", "gave way", "unstable", "wobbly", "can't hold", "collapsed", "giving"] },
  { id: "energy", label: "Energy", words: ["tired", "exhausted", "flat", "drained", "wiped", "heavy", "no energy", "fatigue"] },
  { id: "mood", label: "Mood", words: ["mood", "low", "down", "sad", "anxious", "stressed", "frustrated", "unmotivated", "can't face"] },
  { id: "sleep", label: "Sleep", words: ["sleep", "insomnia", "awake", "restless", "couldn't sleep", "woke"] },
  { id: "question", label: "Question", words: ["how do i", "should i", "what about", "can i", "why does", "is it ok", "what should"] },
];
const ISSUE_REGIONS = [
  { id: "shoulders", words: ["shoulder", "rotator", "delt", "collarbone"] },
  { id: "back", words: ["back", "lat", "spine", "lumbar", "trap", "scapula", "shoulder blade"] },
  { id: "legs", words: ["leg", "knee", "hamstring", "quad", "calf", "ankle", "hip", "glute", "thigh", "foot", "shin"] },
  { id: "core", words: ["core", "abs", "stomach", "oblique", "pelvic", "psoas"] },
  { id: "arms", words: ["arm", "elbow", "wrist", "bicep", "tricep", "forearm", "hand"] },
  { id: "chest", words: ["chest", "pec", "sternum", "rib"] },
  { id: "heart", words: ["heart", "breath", "breathing", "winded", "chest tight", "palpitation"] },
];
const SIDE_WORDS = [
  { id: "right", words: ["right", "r side", "right-hand"] },
  { id: "left", words: ["left", "l side", "left-hand"] },
];
/* Tagging is a convenience for finding things again, never a filter — the
   coach reads the whole record, not just the matching tag. */
const tagIssue = (text) => {
  const t = (text || "").toLowerCase();
  const hit = (list) => list.filter((g) => g.words.some((w) => t.includes(w))).map((g) => g.id);
  const kinds = hit(ISSUE_KINDS);
  const regions = hit(ISSUE_REGIONS);
  const sides = hit(SIDE_WORDS);
  return {
    kinds: kinds.length ? kinds : ["other"],
    regions,
    side: sides[0] || null,
  };
};
/* Two entries are "the same thing again" if they share a region and a kind,
   and a side when one was given. */
const sameIssue = (a, b) => {
  if (!a || !b) return false;
  const regionMatch = a.regions?.length && b.regions?.length
    ? a.regions.some((r) => b.regions.includes(r)) : false;
  const kindMatch = a.kinds?.some((k) => b.kinds?.includes(k));
  const sideOk = !a.side || !b.side || a.side === b.side;
  return regionMatch && kindMatch && sideOk;
};

/* SEED ONLY. Like the strength battery, the mobility battery is hers: she can
   rename a test, change its unit, add one, delete one, change whether it is
   measured on both sides. What ships here is a starting point, not the app's
   opinion of what should be measured. Ids never change once created, so
   renaming a test keeps every reading it has ever had (rule 12, rule 13). */
const SEED_MOBILITY = [
  { id: "sitrise", label: "Sit-to-rise", unit: "/10", better: "higher", max: 10,
    how: "Sit down cross-legged on the floor and stand back up. Start with 10 points: lose one for each hand, forearm, knee or side of leg you use for support, on the way down and on the way up. Half a point for wobbling.",
    why: "This is the single most-studied whole-body functional test there is — hip mobility, ankle range, single-leg strength and trunk control in one movement. It is also exactly the thing that quietly disappears in your fifties if nobody measures it.",
    needs: ["legs", "core"], drills: ["deepsquat", "hipopen", "ankle", "getup"] },

  { id: "fold", label: "Forward fold", unit: "cm", better: "lower", side: false,
    how: "Stand, feet together, knees straight but not locked, and fold forward. Measure the gap from fingertips to floor in centimetres. Palms flat is 0; fingertips touching is about 0 too — go by fingertips.",
    why: "Posterior chain length: hamstrings, calves and lower back together. It is the one most people notice first, and the one that responds fastest to consistent work.",
    needs: ["legs", "back"], drills: ["hamstring", "calf", "catcow"] },

  { id: "wallreach", label: "Overhead reach", unit: "cm", better: "lower", side: true,
    how: "Stand with your back flat to a wall, lower back pressed in. Raise both arms overhead, thumbs to the wall, elbows straight. Measure the gap from wrist to wall on each side.",
    why: "Shoulder flexion and thoracic extension. Directly relevant to your right shoulder, and the asymmetry between sides is the number that matters more than either one alone.",
    needs: ["shoulders", "back"], drills: ["thoracic", "shoulderpass", "latstretch"] },

  { id: "scratch", label: "Behind-the-back reach", unit: "cm", better: "lower", side: true,
    how: "One hand over the shoulder and down your back, the other up from below. Measure the gap between fingertips. Score each side by which hand is on top.",
    why: "Shoulder internal and external rotation combined. The classic test for the shoulder capsule, and the one that tends to reveal a restriction before it starts to hurt.",
    needs: ["shoulders", "arms"], drills: ["shoulderpass", "sleeper", "doorway"] },

  { id: "kneewall", label: "Ankle to wall", unit: "cm", better: "higher", side: true,
    how: "Kneel with one foot flat, toes a measured distance from a wall. Drive the knee forward to touch the wall without the heel lifting. The furthest distance that still works is the score.",
    why: "Ankle dorsiflexion. Under-measured and quietly decisive — it limits squat depth, it limits how you rise from the floor, and it is one of the first things to shorten from sitting.",
    needs: ["legs"], drills: ["ankle", "calf", "deepsquat"] },

  { id: "rotate", label: "Seated rotation", unit: "/10", better: "higher", max: 10, side: true,
    how: "Sit tall on a chair, arms crossed on your chest, and turn as far as you can each way without your hips moving. Score how far you get out of ten, judged against a full ninety degrees.",
    why: "Thoracic rotation. It protects the lower back and the shoulder by letting the mid-back do the work they otherwise take on.",
    needs: ["back", "core"], drills: ["thoracic", "catcow", "openbook"] },

  { id: "hipopen", label: "Cross-legged sit", unit: "/10", better: "higher", max: 10,
    how: "Sit cross-legged on the floor, back unsupported. Score out of ten: can you sit tall without rounding, and for how long is it comfortable?",
    why: "Hip external rotation and adductor length. This is the position the sit-to-rise starts from, so it usually has to improve first.",
    needs: ["legs", "core"], drills: ["hipopen", "pigeon", "deepsquat"] },
];

/* Ten minutes of work, chosen by what the tests say is short. Never a whole
   session — these are add-ons after whatever she already did. */
/* SEED ONLY — same deal. Add a drill, delete one, rewrite how it is done. */
const SEED_DRILLS = [
  { id: "deepsquat", label: "Deep squat hold", mins: 2, how: "Sink into the lowest squat you can hold, heels down, elbows inside knees gently pushing them out. Hold and breathe. Hold a doorframe if you need to.", targets: "hips, ankles, adductors" },
  { id: "hipopen", label: "90/90 hip switches", mins: 3, how: "Sit with one leg bent in front at ninety degrees and one behind at ninety. Sit tall, lean gently over the front shin, then switch sides without using your hands if you can.", targets: "hip rotation both directions" },
  { id: "pigeon", label: "Pigeon or figure-four", mins: 3, how: "One shin across in front, back leg long — or lying on your back, ankle over the opposite knee, pulling the thigh in. Breathe rather than push.", targets: "glutes, deep hip rotators" },
  { id: "ankle", label: "Knee-to-wall rocking", mins: 2, how: "Foot flat, toes a few centimetres from a wall, drive the knee forward over the toes without the heel lifting. Rock in and out slowly. Both sides, even if only one is tight.", targets: "ankle dorsiflexion" },
  { id: "calf", label: "Calf stretch, both knees", mins: 2, how: "Straight back knee first, then the same position with the knee bent — the two hit different muscles and most people only ever do the first.", targets: "gastrocnemius and soleus" },
  { id: "hamstring", label: "Hamstring, one leg at a time", mins: 3, how: "One heel on a low step, hinge from the hip with a long spine rather than rounding to reach. The stretch should sit in the belly of the muscle, not behind the knee.", targets: "hamstrings without loading the lower back" },
  { id: "catcow", label: "Cat–cow and segmental rolls", mins: 2, how: "On all fours, move the spine one vertebra at a time in both directions. Slow enough that you can feel where it stops moving.", targets: "spinal segmentation" },
  { id: "thoracic", label: "Thoracic extension over a roller", mins: 2, how: "Roller across the mid-back, hands behind the head, extend back over it in three or four positions rather than one.", targets: "mid-back extension" },
  { id: "openbook", label: "Open book", mins: 3, how: "Lie on your side, knees bent and stacked, arms together in front. Open the top arm across and follow it with your eyes, keeping the knees down.", targets: "thoracic rotation" },
  { id: "shoulderpass", label: "Band or towel pass-through", mins: 2, how: "Wide grip on a band or towel, take it from in front of you to behind and back. Narrow the grip only when the wide one is easy. Never force the end range.", targets: "shoulder flexion and rotation" },
  { id: "sleeper", label: "Sleeper stretch", mins: 2, how: "On your side, arm out at ninety, gently rotate the forearm toward the floor with the other hand. Very light — this one is easy to overdo.", targets: "shoulder internal rotation" },
  { id: "doorway", label: "Doorway chest opener", mins: 2, how: "Forearm on a doorframe, step through gently. Three heights: low, mid, high — they reach different fibres.", targets: "chest and front shoulder" },
  { id: "latstretch", label: "Lat hang or child's pose reach", mins: 2, how: "Kneeling, hands forward on the floor, sink the chest and walk the hands to one side to bias one lat at a time.", targets: "lats, which limit overhead reach more than shoulders do" },
  { id: "getup", label: "Floor sit-and-rise practice", mins: 3, how: "Practise the movement itself, slowly, using as little support as you need — and notice which point you need it. That point is the thing to work on.", targets: "the whole pattern, and it improves with practice alone" },
];
const drillById = (id, list) => (list && list.length ? list : SEED_DRILLS).find((d) => d.id === id) || null;
const mobTestById = (id, list) => (list && list.length ? list : SEED_MOBILITY).find((m) => m.id === id) || null;
/* ============================================================================
   THE LADDER
   ---------------------------------------------------------------------------
   Rule 4 as amended, and rule 32. The coach does not accept a no and close the
   conversation. "That's fine, see you tomorrow" is not an available ending,
   because the app exists to get her moving and a coach that agrees with every
   not-today moves the one-year number in the wrong direction.

   So there is always a smaller door, and the coach walks DOWN rather than
   making one offer and dropping it. The question is never whether she trains.
   It is what is the smallest thing that would still count today.

   A list, so a rung can be added, reworded or removed without touching
   anything that walks it (rule 13).

   `load` marks a rung that puts force through the body. When a physical signal
   is present — the shoulder talking, recovery genuinely low, pain in the
   record, illness flags up — those rungs are skipped and the ladder continues
   with what is left. Sore is not the same as can't-face-it, and rest
   prescribed for a reason is not a day given away.

   Every rung returns null when it cannot be offered today, and the walk simply
   steps past it. The last rung needs no equipment, no time and no decision, so
   the ladder can never run out.
========================================================================== */
const LADDER = [
  { id: "full", load: true, kind: "trained",
    make: (c) => (c.prescribed ? {
      label: c.prescribed.name,
      mins: c.prescribed.minutes,
      line: "What the day was always going to be.",
    } : null) },

  { id: "short", load: true, kind: "trained",
    make: (c) => {
      if (!c.prescribed) return null;
      const ds = c.prescribed.durations || [];
      const mins = ds.length ? Math.min(...ds) : Math.max(15, Math.round((c.prescribed.minutes || 45) / 2));
      if (mins >= (c.prescribed.minutes || 45)) return null;
      return { label: `${c.prescribed.name}, the short version`, mins,
        line: "Same class, less of it. Starting is the part that matters." };
    } },

  { id: "easiest", load: true, kind: "trained",
    make: (c) => (c.easiest && (!c.prescribed || c.easiest.name !== c.prescribed.name) ? {
      label: c.easiest.name,
      mins: (c.easiest.durations || [30])[0],
      line: "The gentlest thing you own. It still counts as a session.",
    } : null) },

  { id: "drills", load: false, kind: "moved",
    make: (c) => (c.drills && c.drills.list && c.drills.list.length ? {
      label: `${c.drills.mins} minutes of your drills`,
      mins: c.drills.mins,
      line: `${c.drills.list.map((d) => d.label).join(", ")}. Chosen from your own mobility scores.`,
    } : null) },

  { id: "walk", load: false, kind: "moved",
    make: () => ({ label: "A walk", mins: 20,
      line: "Outside, no pace, no plan. It counts as a day you moved." }) },

  { id: "floor", load: false, kind: "moved",
    make: () => ({ label: "Five minutes on the floor", mins: 5,
      line: "Cat-cow, hips, whatever is stiff. Put a timer on and stop when it goes." }) },

  { id: "stand", load: false, kind: "moved",
    make: () => ({ label: "Stand up and reach overhead, twice", mins: 1,
      line: "Genuinely. On the days that is all there is, that is the rung." }) },
];

/* What is actually available today, hardest first.
   ctx: { prescribed, easiest, drills, physical } */
const ladderFor = (ctx) => LADDER
  .filter((r) => !(ctx.physical && r.load))
  .map((r) => { const m = r.make(ctx); return m ? { id: r.id, kind: r.kind, load: r.load, ...m } : null; })
  .filter(Boolean);

/* The next door down from whatever was just declined. Persistence lives in the
   offering, never in the asking: one rung at a time, and never back up. */

/* ============================================================================
   THE MONTHLY DEEP READ
   ---------------------------------------------------------------------------
   The one moment where the coach stops reacting and starts designing. Rule 8
   says the review reads everything; this is the version that actually can,
   because a model can read sentences and a rule cannot.

   THE RULES ARE THE FLOOR, THE MODEL IS THE CEILING. The thirteen design rules
   already produce a defensible block from evidence, offline, every time. That
   never stops being true. The model gets the same evidence PLUS everything the
   rules structurally cannot touch — the texture of what she actually wrote —
   and may refine, reorder or overrule, with its reasoning shown beside theirs.

   And NOTHING it returns becomes her month until it has been checked. A block
   is seven days of kinds that exist. A goal she stated cannot silently vanish.
   A constraint in the record cannot be contradicted. A profile entry without
   dated evidence is not a belief, it is an assertion, and it is dropped. If
   validation fails, the rule-based block stands and the app says so — it never
   quietly serves her something unverified (rules 20, 23).
========================================================================== */

/* What the model is allowed to return. Kept as data so the prompt and the
   validator can never drift apart. */
const REVIEW_SHAPE = {
  name: "a short name for the block, four words at most",
  line: "one or two sentences to her, in the second person, saying what this month is for",
  week: "exactly 7 entries, each one of: pilates, core, strength, move, cardio, rest",
  reasoning: "3 to 6 short paragraphs: what you read, what changed, what you decided and why",
  interpretation: "what her numbers actually did this month, in plain language, naming what is real and what is noise",
  profile: "0 to 6 entries, each { claim, kind, evidence: [{ date, quote }] } — only things you can point at",
  keptGoals: "the ids of every open goal you have kept in view",
};

const REVIEW_KINDS = ["pilates", "core", "strength", "move", "cardio", "rest"];

/* THE GUARD. Everything below decides whether a returned month is allowed to
   become her month. Deliberately strict and deliberately dumb — it checks
   shape and consistency, never quality. */
const validateReview = (parsed, ctx) => {
  const errors = [];
  const ok = (c, msg) => { if (!c) errors.push(msg); return c; };
  if (!parsed || typeof parsed !== "object") return { ok: false, errors: ["nothing readable came back"] };

  ok(typeof parsed.name === "string" && parsed.name.trim().length > 0 && parsed.name.length <= 40,
    "the block has no usable name");
  ok(typeof parsed.line === "string" && parsed.line.trim().length > 10,
    "the block has no line explaining what it is for");
  ok(Array.isArray(parsed.week) && parsed.week.length === 7,
    `a week has to be 7 days, got ${Array.isArray(parsed.week) ? parsed.week.length : "none"}`);
  if (Array.isArray(parsed.week)) {
    const bad = parsed.week.filter((d) => !REVIEW_KINDS.includes(d));
    ok(bad.length === 0, `${bad.join(", ")} ${bad.length === 1 ? "is not a kind of day" : "are not kinds of day"}`);
    ok(parsed.week.some((d) => d !== "rest"), "a month of nothing but rest is not a block");
  }
  ok(typeof parsed.reasoning === "string" && parsed.reasoning.trim().length > 40,
    "it did not show its reasoning");

  /* Rule 9: her stated goals outrank the numbers, so they cannot quietly
     disappear from a month designed for her. */
  const open = (ctx.openGoals || []).map((g) => g.id);
  if (open.length) {
    const kept = Array.isArray(parsed.keptGoals) ? parsed.keptGoals : [];
    const dropped = open.filter((id) => !kept.includes(id));
    ok(dropped.length === 0, `it lost sight of ${dropped.length} goal${dropped.length === 1 ? "" : "s"} you set`);
  }

  /* Rule 19 and the shoulder: a physical constraint cannot be designed over. */
  if (ctx.shoulderFrozen && Array.isArray(parsed.week))
    ok(parsed.week.filter((d) => d === "strength").length <= (ctx.currentStrengthDays ?? 7),
      "it added strength days while your shoulder is the thing talking");

  /* A belief without dated evidence is an assertion. Dropped, not stored. */
  const claims = Array.isArray(parsed.profile) ? parsed.profile : [];
  const usable = claims.filter((p) =>
    p && typeof p.claim === "string" && p.claim.trim().length > 5
    && Array.isArray(p.evidence) && p.evidence.length > 0
    && p.evidence.every((e) => e && typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date)));
  const rejected = claims.length - usable.length;

  return {
    ok: errors.length === 0,
    errors,
    rejectedClaims: rejected,
    block: errors.length ? null : {
      name: parsed.name.trim(), line: parsed.line.trim(), week: parsed.week,
      reasoning: parsed.reasoning.trim(),
      interpretation: typeof parsed.interpretation === "string" ? parsed.interpretation.trim() : "",
    },
    profile: usable.map((p) => ({
      id: "m" + Math.random().toString(36).slice(2, 9),
      claim: p.claim.trim(),
      kind: ["preference", "barrier", "motivator", "response", "limit", "routine"].includes(p.kind) ? p.kind : "response",
      evidence: p.evidence.map((e) => ({ date: e.date, source: "said", quote: String(e.quote || "").slice(0, 200) })),
      status: "active", hers: false, fromReview: true,
    })),
  };
};
const smallerDoor = (rungs, declinedId) => {
  if (!declinedId) return rungs[0] || null;
  const i = rungs.findIndex((r) => r.id === declinedId);
  return i === -1 ? (rungs[0] || null) : (rungs[i + 1] || null);
};
/* ============================================================================
   WHY
   ---------------------------------------------------------------------------
   The thing the app could not see. A day she did not train was a blank, and
   there is all the difference in the world between exhausted, unmotivated, out
   of time, and deliberately resting. Knowing only that she skipped is not
   enough to coach her.

   One tap plus, if she wants, her own words. The tap is countable and drives
   the learning; the words carry what a tap never could. Both are stored.

   Scripted rather than model-written, so it works with no signal and no key,
   and every level offers a way out that costs nothing. The questions are
   curious, never an accounting — rule 24 does not stop applying because she is
   being asked something.

   `tag` is what the arithmetic counts. Adding a reason is a list entry.
========================================================================== */
const WHY_TREES = {
  skip: {
    ask: "What got in the way?",
    reasons: [
      { id: "commitment", label: "I had a commitment", tag: "time",
        follow: [{ id: "recurs", q: "One-off, or does something land here most weeks?",
          opts: ["One-off", "Most weeks", "It's new"] }] },
      { id: "overslept", label: "I ran out of time", tag: "time",
        follow: [{ id: "had", q: "How long did you actually have?",
          opts: ["None at all", "About ten minutes", "About twenty"] }] },
      { id: "mood", label: "I wasn't in the mood", tag: "motivation",
        follow: [{ id: "which", q: "Was it the training, or the day?",
          opts: ["The training", "The day", "Both"] },
          { id: "part", q: "Which part put you off?", when: "The training",
            opts: ["The class itself", "How long it is", "How hard it is"] }] },
      { id: "hurt", label: "Something hurt", tag: "body",
        follow: [{ id: "where", q: "Where?",
          opts: ["Shoulder", "Back", "Legs", "Core", "Arms", "Somewhere else"] },
          { id: "again", q: "First time, or has this been back before?",
            opts: ["First time", "It's been back"] }] },
      { id: "tired", label: "I was too tired", tag: "tired",
        follow: [{ id: "source", q: "Was it sleep, or the week?",
          opts: ["Sleep", "The week", "Both"] }] },
      { id: "dislike", label: "Didn't fancy what was on", tag: "dislike",
        follow: [{ id: "instead", q: "What would you rather have done?", library: true }] },
      { id: "chose", label: "I chose to rest", tag: "chosen", follow: [] },
      { id: "away", label: "I was away", tag: "away",
        follow: [{ id: "kit", q: "Anything with you to train with?",
          opts: ["Nothing", "A mat", "Bands or weights"] }] },
    ],
  },
  swap: {
    ask: "What made you change it?",
    reasons: [
      { id: "notfancy", label: "Didn't fancy it", tag: "dislike", follow: [] },
      { id: "toohard", label: "Too hard today", tag: "load", follow: [] },
      { id: "tooeasy", label: "Too easy", tag: "load", follow: [] },
      { id: "length", label: "Wrong length", tag: "time", follow: [] },
      { id: "kit", label: "Didn't have the equipment", tag: "kit", follow: [] },
      { id: "wanted", label: "Wanted this instead", tag: "preference", follow: [] },
      { id: "shoulder", label: "The shoulder", tag: "body", follow: [] },
    ],
    after: { id: "worked", q: "Did the swap turn out to be the right call?",
      opts: ["Yes", "Not really", "Too soon to say"] },
  },
  short: {
    ask: "What happened?",
    reasons: [
      { id: "ranout", label: "Ran out of time", tag: "time", follow: [] },
      { id: "flat", label: "Had nothing in the tank", tag: "tired", follow: [] },
      { id: "pain", label: "Something started hurting", tag: "body", follow: [] },
      { id: "enough", label: "It was enough", tag: "chosen", follow: [] },
    ],
    after: { id: "right", q: "Did stopping feel like the right call?",
      opts: ["Yes", "Not really", "Not sure"] },
  },
};
const whyTree = (kind) => WHY_TREES[kind] || WHY_TREES.skip;
const whyReason = (kind, id) => whyTree(kind).reasons.find((r) => r.id === id) || null;
const whyLabel = (kind, id) => whyReason(kind, id)?.label || id;
const whyTag = (kind, id) => whyReason(kind, id)?.tag || "other";



const prescribe = ({ library, logs, date, recovery, restDay, phase, themeGoal, shoulderFrozen, shoulderInjury, shoulderSore, block, bodywork }) => {
  if (!library.length) return null;
  /* nothing is prescribed on a rest day. Rest is the prescription. */
  if (restDay) return null;

  const daysSince = (w) => {
    for (let i = 1; i <= 30; i++) {
      const l = logs[addDays(date, -i)];
      if (l?.completed && l.type === w.name) return i;
      if ((l?.extraSessions || []).some((x) => x.type === w.name)) return i;
    }
    return 99;
  };

  /* The programme decides WHAT KIND of session today is. The coach only
     decides which class delivers it — freshness, recovery and shoulder. */
  /* A class qualifies by id (the seed classes) OR by goal (anything she adds
     later). Id-only matching meant a class she created could never be picked,
     which quietly made the library read-only in practice. */
  const inBlock = (w) => {
    if (!block) return true;
    const ids = block.ids || [];
    const goals = block.goals || [];
    if (!ids.length && !goals.length) return true;
    return ids.includes(w.id) || (!!w.goal && goals.includes(w.goal));
  };

  /* Body work she had in the last day or two changes what today can be. */
  const reactive = bodywork?.reactive || null;   /* { label, why } if tissue is reactive */

  /* what today can physically be — add-ons are never the main session */
  let pool = library.filter((w) => {
    if (w.addon) return false;
    if (!inBlock(w)) return false;
    if (shoulderInjury && shoulderFrozen && w.shoulderLoad === "high") return false;
    if (recovery?.key === "rest") return w.recoveryCost <= 1;
    if (recovery?.key === "easy") return w.recoveryCost <= 3;
    if (reactive && w.recoveryCost >= 4) return false;
    return true;
  });
  /* Block first; if recovery or the shoulder rules all of it out, step outside
     the block rather than prescribe nothing. */
  let outsideBlock = false;
  if (!pool.length && block) {
    outsideBlock = true;
    pool = library.filter((w) => {
      if (w.addon) return false;
      if (shoulderInjury && shoulderFrozen && w.shoulderLoad === "high") return false;
      if (recovery?.key === "rest") return w.recoveryCost <= 1;
      if (recovery?.key === "easy") return w.recoveryCost <= 3;
      return true;
    });
  }
  if (!pool.length) pool = library.filter((w) => !w.addon && w.recoveryCost <= 2);
  if (!pool.length) return null;

  const score = (w) => {
    let n = 0;
    if (themeGoal && w.goal === themeGoal) n += 3;                 /* serves the block's theme */
    n += Math.min(daysSince(w), 10) / 2;                           /* freshness */
    if (recovery?.key === "green") n += w.intensity * 0.8;         /* spend a good day well */
    if (recovery?.key === "easy") n -= w.recoveryCost * 0.8;
    if (recovery?.key === "rest") n -= w.intensity;
    if (daysSince(w) === 1) n -= 6;                                /* not the same thing twice running */
    /* Shoulder state, graded. The hard filter above only fires once the joint
       is bad enough to be called frozen, which made the shoulder an all-or-
       nothing input: invisible until it was a crisis. A shoulder that has been
       uncomfortable this week leans the choice away from overhead load without
       ruling anything out - so the day still has a session in it, just a
       kinder one. (Rule 10: recovery, freshness AND shoulder state.) */
    if (shoulderInjury && shoulderSore) {
      if (w.shoulderLoad === "high") n -= 5;
      else if (w.shoulderLoad === "medium") n -= 2;
    }
    return n;
  };

  const chosen = [...pool].sort((a, b) => score(b) - score(a))[0];
  const durations = chosen.durations?.length ? chosen.durations : [45];
  const minutes = recovery?.key === "rest" || recovery?.key === "easy"
    ? durations[0]
    : recovery?.key === "green" ? durations[durations.length - 1]
    : durations[Math.floor(durations.length / 2)];

  const why = [];
  if (reactive) why.push(`you had ${reactive.label.toLowerCase()} recently and the tissue is still settling`);
  if (block && !outsideBlock) why.push(`week ${(block.week || 0) + 1} of your programme has this down as ${block.label.toLowerCase()}`);
  if (block && outsideBlock) why.push(`your programme says ${block.label.toLowerCase()} today, but nothing in that block suits how you've recovered — this is the nearest sensible thing`);
  if (!recovery) why.push("I don't have a recovery reading for today, so this is based on your cycle and theme alone");
  if (recovery?.key === "rest") why.push("recovery is well below your normal");
  else if (recovery?.key === "easy") why.push("recovery is under your normal, so this is the lighter option");
  else if (recovery?.key === "green") why.push("recovery is above your normal, so you get the longer version");
  if (shoulderFrozen && shoulderInjury) why.push("anything heavy overhead is paused while your shoulder settles");
  else if (shoulderInjury && shoulderSore && chosen.shoulderLoad !== "high")
    why.push("your shoulder has been uncomfortable this week, so this leans away from overhead load");
  if (themeGoal && chosen.goal === themeGoal) why.push(`this block is about ${themeGoal}`);
  const since = daysSince(chosen);
  if (since >= 4 && since < 99) why.push(`you haven't done it in ${since} days`);
  if (since === 99) why.push("you haven't done it yet");

  /* something short to stack on top, when the day has room for it */
  const addons = library.filter((w) => {
    if (!w.addon) return false;
    if (shoulderInjury && shoulderFrozen && w.shoulderLoad === "high") return false;
    if (recovery?.key === "rest") return w.recoveryCost <= 1;
    return w.recoveryCost <= 2;
  });
  let addon = null;
  if (addons.length && (recovery?.key === "green" || recovery?.key === "steady" || !recovery)) {
    const wanted = shoulderInjury ? addons.find((w) => /shoulder/i.test(w.name)) : null;
    addon = wanted || [...addons].sort((a, b) => daysSince(b) - daysSince(a))[0];
  }

  return {
    ...chosen, minutes,
    addon: addon ? { ...addon, minutes: addon.durations?.[0] || 15 } : null,
    reason: why.length ? why.join(", and ") : "it fits where you are this week",
  };
};


/* ============================================================================
   THE DAILY BET
   One small dare, set by the coach, sized to the day you actually had. Never
   punishing on a low day, never trivial on a good one. You either made it or
   you didn't — both are fine, and saying "not tonight" costs nothing.
========================================================================== */
const BET_POOL = [
  /* Every finisher is a number you have NOT hit yet — your own best plus a
     push. Done the moment the class ends, before you stretch, inside a minute.
     `from` names the measure it grows out of; `step` is how far past your best
     it reaches; `base` is what to dare when there's no record yet.
     band = which recovery days it may appear on. */

  { id: "f01", from: "plank",     step: 12, base: 40,  band: ["green", "steady"], unit: "sec",
    make: (n) => `Hold a plank for ${n} seconds. Longer than you have ever held it.` },
  { id: "f02", from: "wallsit",   step: 15, base: 45,  band: ["green", "steady"], unit: "sec",
    make: (n) => `${n} seconds in a wall sit. Start before you catch your breath.` },
  { id: "f03", from: "deepsquat", step: 10, base: 30,  band: ["green", "steady", "easy"], unit: "sec",
    make: (n) => `${n} seconds at the bottom of a squat. Breathe through it.` },
  { id: "f04", from: "sideplank", step: 8,  base: 30,  band: ["green", "steady"], unit: "sec",
    make: (n) => `${n} seconds of side plank on each side, back to back.` },
  { id: "f05", from: "balance",   step: 10, base: 30,  band: ["all"], unit: "sec",
    make: (n) => `Balance on one leg for ${n} seconds a side. Beat your record.` },
  { id: "f06", from: "tandem",    step: 10, base: 30,  band: ["easy", "rest", "steady"], unit: "sec",
    make: (n) => `${n} seconds heel-to-toe, eyes open, both ways round.` },

  { id: "f07", from: "squat",     step: 3,  base: 15,  band: ["green", "steady"], unit: "reps",
    make: (n) => `${n} squats without stopping. Three more than your best.` },
  { id: "f08", from: "pushup",    step: 2,  base: 8,   band: ["green"], shoulder: true, unit: "reps",
    make: (n) => `${n} push-ups. Knees down is fine — the number is the bet.` },
  { id: "f09", from: "updown",    step: 2,  base: 6,   band: ["green"], shoulder: true, unit: "reps",
    make: (n) => `${n} plank up-downs. Slow, controlled, no dropping.` },
  { id: "f10", from: "crunch",    step: 3,  base: 18,  band: ["green", "steady"], unit: "reps",
    make: (n) => `${n} crunches in thirty seconds.` },
  { id: "f11", from: "deadbug",   step: 3,  base: 10,  band: ["steady", "easy"], unit: "reps",
    make: (n) => `${n} dead bugs, three seconds each. Slow is the difficulty.` },
  { id: "f12", from: "dip",       step: 2,  base: 8,   band: ["green"], shoulder: true, unit: "reps",
    make: (n) => `${n} bench dips, straight through.` },
  { id: "f13", from: "bandrow",   step: 3,  base: 15,  band: ["green", "steady"], shoulder: true, unit: "reps",
    make: (n) => `${n} band pull-aparts, no rest between them.` },
  { id: "f14", from: "splitsq",   step: 2,  base: 8,   band: ["green", "steady"], unit: "reps",
    make: (n) => `${n} split squats each leg. The second leg is the bet.` },
  { id: "f15", from: "legreach",  step: 2,  base: 8,   band: ["steady", "easy"], unit: "reps",
    make: (n) => `${n} single-leg reaches a side, slow on the way down.` },
  { id: "f16", from: "burpees",   step: 2,  base: 10,  band: ["green"], unit: "reps",
    make: (n) => `${n} burpees in sixty seconds. Go straight into it.` },

  /* weighted finishers grow out of the load you actually handle */
  { id: "f17", weight: 2.5, reps: 10, band: ["green", "steady"],
    make: (n, kg) => `${n} squats at ${kg} kg in twenty seconds. Heavier than last time.` },
  { id: "f18", weight: 2.5, reps: 12, band: ["green"],
    make: (n, kg) => `${n} walking lunges holding ${kg} kg. Don't put it down.` },
  { id: "f19", weight: 1,   reps: 12, band: ["green", "steady"], shoulder: true,
    make: (n, kg) => `${n} rows at ${kg} kg. Best set of the day, last set of the day.` },

  /* low-recovery days: still past your best, just a gentler measure */
  { id: "f20", from: "deepsquat", step: 5,  base: 20,  band: ["easy", "rest"], unit: "sec",
    make: (n) => `${n} seconds in a deep squat hold before you stretch.` },
  { id: "f21", from: "plank",     step: 5,  base: 30,  band: ["easy", "rest"], unit: "sec",
    make: (n) => `One plank, ${n} seconds. Only one, but past your best.` },
  { id: "f22", from: "balance",   step: 5,  base: 25,  band: ["easy", "rest"], unit: "sec",
    make: (n) => `${n} seconds on one leg, each side.` },
];

const betFor = ({ date, recovery, restDay, shoulderFrozen, workWeight, bestOf, used }) => {
  const band = restDay ? "easy" : (recovery?.key || "steady");
  let pool = BET_POOL.filter((b) => b.band.includes("all") || b.band.includes(band));
  if (shoulderFrozen) pool = pool.filter((b) => !b.shoulder);
  if (!workWeight) pool = pool.filter((b) => !b.weight);

  const build = (b) => {
    if (b.weight) {
      const kg = Math.round((workWeight + b.weight) * 2) / 2;
      return { id: b.id, text: b.make(b.reps, kg), target: `${b.reps} × ${kg} kg` };
    }
    const best = bestOf ? bestOf(b.from) : null;
    const n = Math.round((best !== null && best > 0 ? best : b.base) + (best !== null && best > 0 ? b.step : 0));
    return { id: b.id, text: b.make(n), target: `${n} ${b.unit}`,
             note: best !== null && best > 0 ? `Your best is ${Math.round(best)} ${b.unit}.` : "No record yet — this sets it." };
  };

  const fresh = pool.filter((b) => !(used || []).includes(b.id));
  const from = fresh.length ? fresh : pool;
  if (!from.length) return null;
  /* deterministic per day, so it doesn't reshuffle when the screen re-renders */
  return build(from[Number(date.split("-").join("")) % from.length]);
};

/* ---- PHASES ---------------------------------------------------------------
   The month you're in changes what the coach offers and how hard it pushes.
   Restoration: no home gym yet, shoulder still load-sensitive. Pilates and
   mobility carry the block. Familiarisation: the gym exists but the first week
   in it is about learning the room, not training hard — short sessions, full
   credit, nothing to fail at. Building: everything unlocks.
--------------------------------------------------------------------------- */
const PHASES = {
  restoration: {
    name: "Restoration",
    line: "Pilates and mobility carry this block. Shoulder work is dosed, load stays light.",
    allowHome: false, allowHighShoulder: false, progress: true,
  },
  familiarise: {
    name: "Learning the room",
    line: "First week on the home gym. One piece of equipment at a time, short sessions. Every one counts full.",
    allowHome: true, allowHighShoulder: false, progress: false,
  },
  building: {
    name: "Building",
    line: "Full gym, full library. Progression moves one variable at a time.",
    allowHome: true, allowHighShoulder: true, progress: true,
  },
};

const phaseFor = (t, gymDate) => {
  if (!gymDate) return "restoration";
  const days = Math.floor((parse(t) - parse(gymDate)) / 86400000);
  if (days < 0) return "restoration";
  if (days < 7) return "familiarise";
  return "building";
};


/* ============================================================================
   ANALYSIS
   Every number here is comparative. An absolute figure tells you nothing —
   "plank 45s" only means something against last week's 40s, or against the
   best you've done. So each measure returns: now, previous, best, a percent
   change, and a score out of 10 relative to your own best.
========================================================================== */
/* Total load: kilograms times repetitions. 10 kg x 15 beats 10 kg x 12, and it
   also beats 6.5 kg x 20 — which weight alone gets wrong in both directions.
   Bilateral lifts sum both sides, so a weak side pulls the total down honestly. */
const loadOf = (entry, f) => {
  const w = Number(entry[f.id + "__w"]);
  if (isNaN(w) || w <= 0) return NaN;
  if (f.bilateral) {
    const L = Number(entry[f.id + "__L"]), R = Number(entry[f.id + "__R"]);
    const reps = (isNaN(L) ? 0 : L) + (isNaN(R) ? 0 : R);
    return reps > 0 ? w * reps : NaN;
  }
  const r = Number(entry[f.id]);
  return isNaN(r) || r <= 0 ? NaN : w * r;
};

const readMeasure = (entry, f) => {
  if (!entry) return NaN;
  if (f.type === "weightreps") return loadOf(entry, f);
  /* A measure taken left and right is BOTH sides. `loadOf` already sums them
     for weight x reps, but everything else — timed holds, rep counts, balance —
     fell through to `entry[f.id]`, which holds the left side only. Doubling her
     right-side balance changed nothing, and the improvement was invisible to
     the real-change verdicts, the evidence sweep and the monthly review. */
  if (f.bilateral) {
    const L = Number(entry[f.id + "__L"]), R = Number(entry[f.id + "__R"]);
    const both = [L, R].filter((v) => !isNaN(v) && v > 0);
    if (both.length) return both.reduce((a, b) => a + b, 0) / both.length;
  }
  if (f.type === "time") {
    const raw = String(entry[f.id] || "");
    if (raw.includes(":")) { const [m, sec] = raw.split(":"); return Number(m) * 60 + Number(sec); }
    return Number(raw);
  }
  return Number(entry[f.id]);
};


/* A reading is every variant of the measure, written out. 7.5 kg on its own
   is not a result — it needs the reps it was lifted for. */
const formatReading = (f, e) => {
  if (!e) return null;
  const t = (v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}`;
  if (f.type === "weightreps") {
    const w = e[f.id + "__w"];
    if (w === undefined || w === "") return null;
    const load = loadOf(e, f);
    const reps = f.bilateral
      ? `${w} kg × ${e[f.id + "__L"] ?? "—"} left · ${e[f.id + "__R"] ?? "—"} right`
      : `${w} kg × ${e[f.id] ?? "—"} reps`;
    return { main: isNaN(load) ? `${w} kg` : `${Math.round(load)} kg total`, sub: reps };
  }
  if (f.type === "time") {
    const v = readMeasure(e, f);
    return isNaN(v) ? null : { main: t(v), sub: "" };
  }
  if (f.type === "rung" || (f.rungs?.length > 1 && f.type === "rung")) {
    const r = Number(e[f.id + "__rung"] ?? 0);
    return { main: f.rungs?.[r] || "—", sub: "" };
  }
  if (f.rungs?.length > 1) {
    const r = Number(e[f.id + "__rung"] ?? 0);
    const val = f.bilateral
      ? `${e[f.id + "__L"] ?? "—"} / ${e[f.id + "__R"] ?? "—"} ${f.unit}`
      : `${e[f.id] ?? "—"} ${f.unit}`;
    return { main: val, sub: f.rungs?.[r] || "" };
  }
  if (f.bilateral) {
    return { main: `${e[f.id + "__L"] ?? "—"} / ${e[f.id + "__R"] ?? "—"} ${f.unit}`, sub: "left / right" };
  }
  if (e[f.id] === undefined || e[f.id] === "") return null;
  return { main: `${e[f.id]} ${f.unit}`.trim(), sub: "" };
};

/* The measurement-error floor for a given measure. Below it, a change is
   noise and the word is "holding" — never "declining" (rule 24). Defined at
   module level because `analyseMeasure` is module level and used to compare
   against a hardcoded 2%, which called a 20-to-19 rep count a decline. */
const noiseFloorFor = (f, F = FORMULA_DEFAULTS) =>
  f.type === "time" ? F.mdcTime
  : f.cap === "balance" ? F.mdcBalance
  : f.type === "weightreps" ? F.mdcLoad : F.mdcReps;

const analyseMeasure = (f, store, F = FORMULA_DEFAULTS) => {
  const keys = Object.keys(store).sort();
  const series = keys.map((k) => ({ k, v: readMeasure(store[k], f) })).filter((x) => !isNaN(x.v) && x.v > 0);
  if (!series.length) return null;
  const now = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const up = f.better !== "down";
  const best = series.reduce((a, b) => (up ? (b.v > a.v ? b : a) : (b.v < a.v ? b : a)));
  const first = series[0];

  /* LADDER EXERCISES: A HARDER RUNG IS NOT A COLLAPSE.

     A ladder measure holds a list of rungs — bodyweight squat, goblet squat,
     split squat. Clearing the target moves her UP a rung and the rep count
     resets low. Comparing the raw numbers across a rung change read 25 reps
     then 10 as "-60%, declining", filed it under "needs attention", told her
     "no added load until it recovers", and blocked the `ready` design rule in
     the monthly review. The file's own comment says this must read as progress.

     Across a rung change the two numbers are not the same measure, so there is
     no honest percentage to report. The direction comes from the rung instead,
     and the percentage says nothing (rule 23). */
  const rungOf = (k) => Number(store[k]?.[f.id + "__rung"] ?? f.rung ?? 0);
  const rungNow = rungOf(now.k);
  const rungPrev = prev ? rungOf(prev.k) : rungNow;
  const rungFirst = rungOf(first.k);
  const rungMoved = prev && rungNow !== rungPrev;

  const pct = rungMoved ? null
    : (prev && prev.v ? ((now.v - prev.v) / prev.v) * 100 * (up ? 1 : -1) : null);
  const sinceStart = rungNow !== rungFirst ? null
    : (first.v ? ((now.v - first.v) / first.v) * 100 * (up ? 1 : -1) : null);
  const outOf10 = best.v ? Math.round(Math.max(0, Math.min(10, (up ? now.v / best.v : best.v / now.v) * 10))) : null;

  return {
    id: f.id, label: f.label, cap: f.cap, unit: f.unit, better: f.better, type: f.type,
    reading: formatReading(f, store[now.k]),
    prevReading: prev ? formatReading(f, store[prev.k]) : null,
    now: now.v, prev: prev?.v ?? null, best: best.v, first: first.v,
    pct, sinceStart, outOf10, isBest: now.v === best.v && series.length > 1,
    points: series.length,
    rung: rungNow, rungMoved,
    /* A rung change is judged by the rung. Otherwise, only past its own error
       floor does a move get a direction. */
    direction: rungMoved ? (rungNow > rungPrev ? "up" : "down")
      : pct === null ? "new"
      : pct >= noiseFloorFor(f, F) ? "up"
      : pct <= -noiseFloorFor(f, F) ? "down" : "flat",
  };
};

/* why something moved — read off the weeks around it rather than guessed */
const explainChange = (m, ctx) => {
  if (m.direction === "new") return "First reading. This becomes the line everything after is measured against.";
  if (m.direction === "up") {
    if (ctx.hitTarget && ctx.recoveryOk) return "You trained the full week and recovered well. That combination is what moved it.";
    if (ctx.hitTarget) return "You hit your sessions. Consistency did this, not any single hard day.";
    return "It rose despite a light week — likely carry-over from the weeks before.";
  }
  if (m.direction === "down") {
    if (!ctx.hitTarget) return "You trained less than target this week. This usually recovers within two weeks of getting back on schedule.";
    if (!ctx.recoveryOk) return "Recovery ran below your normal. Performance follows recovery, not effort.";
    if (m.cap === "push" && ctx.shoulderIssue) return "Shoulder comfort was low. Expected — and the right trade.";
    return "Down slightly with no obvious cause. One reading isn't a trend; watch it next week.";
  }
  return "Holding steady. Maintaining is a result, not a stall.";
};

const nextStepFor = (m, ctx) => {
  if (m.direction === "new") return `Repeat ${m.label.toLowerCase()} next week the same way so the comparison is honest.`;
  if (m.direction === "down") return `Keep ${m.label.toLowerCase()} exactly as it is next week. No added load until it recovers.`;
  if (m.direction === "flat") return `Add a small amount to ${m.label.toLowerCase()} — one rep, five seconds, or half a kilo.`;
  if (m.outOf10 >= 10) return `${m.label} is at your best. Move it up a rung or add load.`;
  return `${m.label} is rising. Keep the same approach — it's working.`;
};


/* A personal best has to carry every variant of the measure, or it's not the
   result — 7.5 kg means nothing without the reps it was lifted for. */
const bestEntryFor = (f, stores) => {
  const rows = [];
  stores.forEach((store) => Object.keys(store).sort().forEach((k) => rows.push({ k, e: store[k] })));
  const scoreOf = (e) => {
    const v = readMeasure(e, f);
    return isNaN(v) ? NaN : (f.better === "down" ? -v : v);
  };
  const scored = rows.map((r) => ({ ...r, s: scoreOf(r.e) })).filter((r) => !isNaN(r.s));
  if (!scored.length) return null;
  const top = scored.reduce((a, b) => (b.s > a.s ? b : a));
  const e = top.e;

  const fmtTime = (v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}`;
  let main = "", sub = "";

  if (f.type === "weightreps") {
    const w = Number(e[f.id + "__w"]);
    main = `${w} kg`;
    if (f.bilateral) {
      const L = e[f.id + "__L"], R = e[f.id + "__R"];
      sub = `${L ?? "—"} left · ${R ?? "—"} right`;
    } else {
      sub = `${e[f.id] ?? "—"} reps`;
    }
  } else if (f.type === "time") {
    main = fmtTime(readMeasure(e, f));
  } else if (f.rungs?.length > 1) {
    const rung = Number(e[f.id + "__rung"] ?? 0);
    main = `${e[f.id] ?? "—"} ${f.unit}`;
    sub = f.rungs[rung] || "";
    if (f.bilateral) sub += ` · ${e[f.id + "__L"] ?? "—"}L / ${e[f.id + "__R"] ?? "—"}R`;
  } else if (f.bilateral) {
    main = `${e[f.id + "__L"] ?? "—"} / ${e[f.id + "__R"] ?? "—"} ${f.unit}`;
    sub = "left / right";
  } else {
    main = `${e[f.id]} ${f.unit}`;
  }

  return { main, sub, when: top.k };
};

/* ---- THE TEST BATTERY -----------------------------------------------------
   Two tiers. Anchors never change — they are the comparison spine that runs
   for years. Rotators change with the theme.

   Ladder exercises hold a list of rungs. You sit on a rung and log a number
   against it; clearing the target moves you up and the number resets low.
   The chart plots rung and number together, so moving up reads as progress
   rather than a collapse.

   inWeekly decides whether it appears in the ~10 min weekly battery.
   Everything appears in the ~30 min monthly.
   role: 'anchor' | 'rotating'   measure: number | weightreps | time | scale | note
--------------------------------------------------------------------------- */
const SEED_WEEKLY = [
  /* ---- LOWER ---- */
  { id: "squat",     cap: "lower",    label: "Squat",            role: "anchor",   type: "number", unit: "reps", better: "up", inWeekly: true,
    rungs: ["Bodyweight squat", "Goblet squat", "Split squat L/R"], rung: 0 },
  { id: "wallsit",   cap: "lower",    label: "Wall sit",         role: "rotating", type: "number", unit: "sec",  better: "up", inWeekly: true },
  { id: "splitsq",   cap: "lower",    label: "Split squat L/R",  role: "rotating", type: "number", unit: "reps", better: "up", inWeekly: false },
  { id: "goblet",    cap: "lower",    label: "Goblet squat",     role: "rotating", type: "weightreps", unit: "kg x reps", better: "up", inWeekly: false },

  /* ---- PUSH ---- */
  { id: "pushup",    cap: "push",     label: "Push-up",          role: "anchor",   type: "number", unit: "reps", better: "up", inWeekly: true,
    rungs: ["Knee push-up", "Floor push-up"], rung: 0 },
  { id: "press",     cap: "push",     label: "Shoulder press",   role: "rotating", type: "weightreps", unit: "kg x reps", better: "up", inWeekly: true, bilateral: true },
  { id: "raise",     cap: "push",     label: "Lateral raise",    role: "rotating", type: "weightreps", unit: "kg x reps", better: "up", inWeekly: false, bilateral: true },
  { id: "dip",       cap: "push",     label: "Bench dip",        role: "rotating", type: "number", unit: "reps", better: "up", inWeekly: false },

  /* ---- PULL ---- */
  { id: "cablerow",  cap: "pull",     label: "Cable row",        role: "anchor",   type: "weightreps", unit: "kg x reps", better: "up", inWeekly: true },
  { id: "bandrow",   cap: "pull",     label: "Band row",         role: "rotating", type: "number", unit: "reps", better: "up", inWeekly: true },
  { id: "latpull",   cap: "pull",     label: "Lat pulldown",     role: "rotating", type: "weightreps", unit: "kg x reps", better: "up", inWeekly: false },
  { id: "facepull",  cap: "pull",     label: "Face pull",        role: "rotating", type: "weightreps", unit: "kg x reps", better: "up", inWeekly: false },

  /* ---- CORE ---- */
  { id: "plank",     cap: "core",     label: "Plank hold",       role: "anchor",   type: "number", unit: "sec",  better: "up", inWeekly: true },
  { id: "updown",    cap: "core",     label: "Plank up-downs",   role: "anchor",   type: "number", unit: "reps", better: "up", inWeekly: true },
  { id: "sideplank", cap: "core",     label: "Side plank L/R",   role: "rotating", type: "number", unit: "sec",  better: "up", inWeekly: false, bilateral: true },
  { id: "crunch",    cap: "core",     label: "Crunches 30s",     role: "rotating", type: "number", unit: "reps", better: "up", inWeekly: false },
  { id: "deadbug",   cap: "core",     label: "Dead bug",         role: "rotating", type: "number", unit: "reps", better: "up", inWeekly: false },

  /* ---- CARDIO ---- */
  { id: "elliptical",cap: "cardio",   label: "Elliptical 1 km",  role: "anchor",   type: "time",   unit: "mm:ss", better: "down", inWeekly: true },
  { id: "burpees",   cap: "cardio",   label: "Burpees 60s",      role: "rotating", type: "number", unit: "reps", better: "up", inWeekly: true },
  { id: "treadmill", cap: "cardio",   label: "Treadmill 1 km",   role: "rotating", type: "time",   unit: "mm:ss", better: "down", inWeekly: false },

  /* ---- MOBILITY ---- */
  { id: "reach",     cap: "mobility", label: "Forward reach",    role: "anchor",   type: "rung",   unit: "",     better: "up", inWeekly: true,
    rungs: ["Ankles", "Toes", "Palms flat"], rung: 0 },
  { id: "shoulderflex", cap: "mobility", label: "Shoulder flexion", role: "rotating", type: "number", unit: "cm gap", better: "down", inWeekly: true },
  { id: "overhead",  cap: "mobility", label: "Overhead reach",   role: "rotating", type: "scale",  unit: "1–5", max: 5, better: "up", inWeekly: false },
  { id: "deepsquat", cap: "mobility", label: "Deep squat hold",  role: "rotating", type: "number", unit: "sec",  better: "up", inWeekly: false },

  /* ---- BALANCE ---- */
  { id: "balance",   cap: "balance",  label: "Single-leg stand", role: "anchor",   type: "number", unit: "sec",  better: "up", inWeekly: true, bilateral: true,
    rungs: ["Free", "Eyes closed"], rung: 0 },
  { id: "tandem",    cap: "balance",  label: "Tandem stance",    role: "rotating", type: "number", unit: "sec",  better: "up", inWeekly: true },
  { id: "legreach",  cap: "balance",  label: "Single-leg reach", role: "rotating", type: "number", unit: "reps", better: "up", inWeekly: false, bilateral: true },

  /* ---- HOW THE WEEK FELT ---- */
  { id: "weight",     cap: "",        label: "Weight",           role: "anchor",   type: "number", unit: "kg",   better: null, inWeekly: true },
  { id: "confidence", cap: "",        label: "Confidence",       role: "anchor",   type: "scale",  unit: "1–10", max: 10, better: "up", inWeekly: true },
  { id: "rpe",        cap: "",        label: "Average effort",   role: "anchor",   type: "scale",  unit: "1–10", max: 10, better: null, inWeekly: true },
  { id: "win",        cap: "",        label: "Biggest win",      role: "anchor",   type: "note",   unit: "",     better: null, inWeekly: true },
  { id: "challenge",  cap: "",        label: "Biggest challenge",role: "anchor",   type: "note",   unit: "",     better: null, inWeekly: true },
];

const SEED_MONTHLY = [
  { id: "muscle", cap: "", label: "Muscle",   unit: "%", type: "number", better: "up",   role: "anchor", inWeekly: false },
  { id: "fat",    cap: "", label: "Body fat", unit: "%", type: "number", better: "down", role: "anchor", inWeekly: false },
];

const newId = () => "f" + Math.random().toString(36).slice(2, 9);

/* ============================================================================
   2. PALETTE + TYPE
   ==========================================================================*/
/* Light, airy, cheerful. Warm white page with plenty of air, deep plum type,
   burgundy for actions, teal for anything measured, soft pink for the things
   meant to feel good. No heavy blocks — tinted panels instead of borders. */
const C = {
  chalk:  "#FCF8F8",  // warm white page
  card:   "#FFFFFF",
  ink:    "#2B1B2E",  // deep plum, softer than black
  signal: "#9B2D52",  // burgundy — actions
  moss:   "#127E82",  // teal — measured, on target
  ochre:  "#D4638A",  // pink — milestones, bests
  pist:   "#FBE2E8",  // pink tint fill
  mint:   "#DCF0F0",  // teal tint fill
  muted:  "#8A7885",
  line:   "#F0E4E7",
  clay:   "#C2542F",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300&family=Hanken+Grotesk:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
.disp { font-family: 'Fraunces', Georgia, serif; letter-spacing: -0.01em; font-variation-settings: 'SOFT' 60, 'WONK' 1; }
.body { font-family: 'Hanken Grotesk', system-ui, sans-serif; }
.serif-it { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 300; }
.mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
.tap:active { transform: scale(0.985); }
.tap { transition: transform 120ms ease, background 140ms ease, border-color 140ms ease; }
button:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: 2px solid ${C.signal}; outline-offset: 2px;
}
input, textarea { font-size: 16px; }
::-webkit-scrollbar { width: 0; height: 0; }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.rise { animation: rise 260ms ease both; }
@media (prefers-reduced-motion: reduce) { .rise { animation: none; } .tap { transition: none; } }
`;

/* ============================================================================
   3. DATES
   ==========================================================================*/
const DAYNAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const stepBtn = {
  width: 34, height: 34, borderRadius: 9, cursor: "pointer", fontSize: 16,
  border: "1.5px solid #F0E4E7", background: "transparent", color: "#8A7885",
};
const SCOPE_LABEL = { day: "today", week: "this week", month: "this month", quarter: "so far", year: "the year" };
const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = (d) => d.toLocaleDateString("en-CA");
const today = () => iso(new Date());
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
/* Her week runs Sunday → Saturday. */
const weekStart = (s) => { const d = parse(s); d.setDate(d.getDate() - d.getDay()); return iso(d); };
const monthKey = (s) => s.slice(0, 7);
const prettyShort = (d) =>
  parse(d).toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();

const dayName = (s) => DAY_KEYS[parse(s).getDay()];
const prettyDate = (s) => parse(s).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

/* ============================================================================
   4. STORAGE
   ==========================================================================*/

/* ============================================================================
   STORAGE
   Inside Claude this uses the host's storage. Standing on its own — on your
   phone, on your own hosting — it falls back to the browser's localStorage.
   Nothing else in the app knows or cares which one it got.
========================================================================== */
const store = {
  /* A read that FAILS and a key that is ABSENT are different events, and
     returning null for both is what made a transient failure look like a first
     run — after which the app cheerfully saved an empty store over her history.
     A failure now throws, and the caller decides. */
  async get(key) {
    if (typeof window !== "undefined" && window.storage?.get) {
      const r = await window.storage.get(key);
      return r?.value ?? null;
    }
    return window.localStorage.getItem(key);
  },
  async set(key, value) {
    if (typeof window !== "undefined" && window.storage?.set) {
      try { await window.storage.set(key, value); return true; } catch { /* fall through */ }
    }
    /* A write that fails must not pass for a write that worked — a full disk
       would otherwise drop the day's logging with no sign of it. */
    window.localStorage.setItem(key, value);
    return true;
  },
};


/* ============================================================================
   THE MODEL
   Inside Claude the request needs no key — the host supplies it. Running on
   your own hosting it needs your key, entered once in Settings and kept on
   the device. Everything that talks to the model goes through here.
========================================================================== */
const insideClaude = () => typeof window !== "undefined" && !!window.storage?.get;

const askModel = async ({ system, messages, apiKey, maxTokens = 1000 }) => {
  const headers = { "Content-Type": "application/json" };
  if (!insideClaude()) {
    if (!apiKey) throw new Error("no-key");
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) throw new Error("request-failed");
  const data = await res.json();
  return (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("").trim();
};

/* ---- WHICH VERSION IS THIS PHONE ACTUALLY RUNNING? -------------------
   The app updates itself in the background, which is right, but it meant
   there was no way to tell a fix that had not arrived from a fix that did
   not work. Bumped by hand on every deploy, shown in Settings, and printed
   on the rescue screen where it matters most. */
const BUILD = "8 August 2026 · 26";

/* ---- WHY THE PHONE WOULD NOT TAKE AN UPDATE --------------------------
   The generated registration was:

     navigator.serviceWorker.register('./sw.js', { scope: './' })

   with no `updateViaCache`. The default is 'imports', which means the
   browser fetches the updater script THROUGH ITS OWN HTTP CACHE. GitHub
   Pages serves it with max-age=600, so the phone kept checking for a new
   version against a saved copy of the old one and concluding, by its own
   logic correctly, that nothing had changed. Six deploys went nowhere.

   Registering the same script again with different options replaces the
   options on the existing registration, so this repairs a phone that is
   already stuck as well as preventing it. Then: check on every open, check
   again whenever she comes back to the app, and reload exactly once when a
   new worker actually takes over. Guarded so it can never loop. */
let swReloaded = false;
const keepCurrent = () => {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;

    sw.addEventListener("controllerchange", () => {
      if (swReloaded) return;
      swReloaded = true;
      try { window.location.reload(); } catch (e) {}
    });

    const refresh = () => {
      sw.getRegistrations().then((regs) => {
        regs.forEach((r) => { try { r.update(); } catch (e) {} });
      }).catch(() => {});
    };

    sw.register("./sw.js", { scope: "./", updateViaCache: "none" })
      .then((r) => { try { r.update(); } catch (e) {} })
      .catch(() => refresh());

    refresh();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
  } catch (e) { /* an app that cannot update itself must still run */ }
};

const KEY = "coach:data";
/* Set when the store existed but could not be read. While true the app refuses
   to save, so a transient failure cannot destroy what is still on the device. */
let storeReadFailed = false;
const didStoreReadFail = () => storeReadFailed;
/* A copy of this file opened straight off the disk. Browsers refuse local
   storage on a file:// page, so the read throws and there is nothing wrong
   with her data — the file simply has nowhere to put anything. Worth saying
   plainly rather than showing a rescue screen for a problem she does not have. */
const openedFromDisk = () => {
  try { return typeof location !== "undefined" && location.protocol === "file:"; }
  catch (e) { return false; }
};
const BLANK = {
  settings: {
    name: "", age: "", height: "", weeklyTarget: 4, gymDate: "", monthTheme: "", primaryGoal: "",
    shoulderInjury: false, whoopConnected: false,
    /* Off by default. Only useful if she is actually experiencing these, and
       it is not the app's business to assume she is. */
    trackSymptoms: false,
    preferredDays: ["Mon", "Tue", "Thu", "Sat"],
    recoveryBaseline: 55,
    scheduleMode: "cycle", cycleOn: 2, cycleOff: 1, cycleStart: today(),
  },
  fields: { weekly: SEED_WEEKLY, monthly: SEED_MONTHLY },
  /* Both batteries are hers to change. Seeded, never fixed. */
  mobTests: SEED_MOBILITY,
  drills: SEED_DRILLS,
  library: SEED_LIBRARY,
  program: SEED_PROGRAM,
  morning: {},
  sample: false,  /* true while demo history is loaded */
  journal: [],    /* free entries: { id, date, text } */
  notes: {},      /* date -> { text, kept } */
  notesUsed: [],  /* pool indices already spent, so nothing repeats */
  plan: { startDate: today(), themes: { week: {}, month: {}, quarter: {} } },
  logs: {}, weekly: {}, monthly: {},
  /* Things she wants to be able to do, in her words. Each one becomes a real
     input to the monthly design rather than a note she wrote once. */
  goals: [],
  /* Everything she has told the coach that isn't a number. Never deleted. */
  issues: [],
  /* Every conversation, kept. The coach reads them before it answers. */
  chats: [],
  /* What the coach has come to believe about her. Never deleted, always
     visible, always correctable. Entries she wrote herself carry hers: true
     and outrank anything inferred. */
  profile: [],
  /* Mobility battery, keyed by week start, same shape as the strength one. */
  mobility: {},
};

async function loadData() {
  try {
    const r = await store.get(KEY);
    if (r) {
      const d = JSON.parse(r);
      return {
        ...BLANK, ...d,
        settings: { ...BLANK.settings, ...(d.settings || {}) },
        fields: {
          weekly: d.fields?.weekly?.length ? d.fields.weekly : SEED_WEEKLY,
          monthly: d.fields?.monthly?.length ? d.fields.monthly : SEED_MONTHLY,
        },
        library: d.library?.length ? d.library : SEED_LIBRARY,
        goals: Array.isArray(d.goals) ? d.goals : [],
        issues: Array.isArray(d.issues) ? d.issues : [],
        chats: Array.isArray(d.chats) ? d.chats : [],
        profile: Array.isArray(d.profile) ? d.profile : [],
        /* An older file has neither — seed them, never wipe them (rule 20). */
        mobTests: Array.isArray(d.mobTests) && d.mobTests.length ? d.mobTests : SEED_MOBILITY,
        drills: Array.isArray(d.drills) && d.drills.length ? d.drills : SEED_DRILLS,
        mobility: d.mobility || {},
        /* One block at a time: anything after the live block was written
           before that rule existed and would pre-empt a design the coach
           should make from evidence. Kept only if she added it herself. */
        program: d.program?.phases?.length
          ? { ...d.program, phases: (() => {
              const ph = d.program.phases;
              const liveAt = ph.findIndex((x) => x.status === "live");
              if (liveAt === -1) return [ph[0]];
              return ph.filter((x, i) => i <= liveAt || x.status === "done" || x.basis?.length);
            })() }
          : SEED_PROGRAM,
        morning: d.morning || {},
        sample: !!d.sample,
        journal: d.journal || [],
        notes: d.notes || {},
        notesUsed: d.notesUsed || [],
        plan: {
          startDate: d.plan?.startDate || today(),
          themes: { week: {}, month: {}, quarter: {}, ...(d.plan?.themes || {}) },
        },
      };
    }
  } catch (e) {
    /* A READ THAT FAILS IS NOT A FIRST RUN.

       Both used to land here and return BLANK — and because the app saves
       whatever it loaded, a single unreadable read overwrote years of history
       with an empty store, silently. A missing key is a first run. Anything
       else (a parse failure, a blocked or throwing read) means her data may
       still be there, so the app must NOT write over it. */
    storeReadFailed = true;
  }
  /* FIRST RUN STARTS EMPTY, ON PURPOSE.

     It used to come up pre-filled with demo history so no screen looked bare.
     But the first block is a calibration month whose whole job is to gather a
     month of her real numbers, and rule 7 is explicit that sample data must
     never be allowed to pass as her own logging. Pre-filled history is exactly
     how that happens — on a new phone, months later, silently.

     The empty state is not a bare screen anyway: the calibration checklist on
     Today walks her through what to log and why each input matters. */
  return { ...BLANK };
}

/* ============================================================================
   BACKUP
   ---------------------------------------------------------------------------
   Her data lives in one browser on one device, which is a single point of
   failure for years of history. Three layers, in order of how little they ask
   of her:

   1. SNAPSHOTS — kept automatically, in a separate storage key, so a corrupted
      or half-restored `coach:data` can never take the history with it. Rolling
      window: one per day, most recent kept.
   2. A FILE — a real dated download. On a phone the share sheet puts it
      straight into OneDrive or Drive.
   3. A FOLDER — on a desktop browser she can grant the app one folder, once
      (her OneDrive folder, say). After that the app writes a dated backup into
      it every time it opens, and OneDrive syncs it off the device. This is the
      closest thing to unattended cloud backup that a page can do without
      registering an app with Google or Microsoft.

   What this deliberately does NOT do: claim to sync to a cloud account. That
   needs OAuth credentials she has to create herself, and pretending otherwise
   would be a promise the app cannot keep.
   ==========================================================================*/
const SNAP_KEY = "coach:snapshots";
const SNAP_KEEP = 10;
/* Ten whole copies of a dataset that has to survive years will eventually
   outgrow the roughly five megabytes a browser gives a site - and the moment
   it does, the write that fails is the NEXT save of her real data, not the
   snapshot. So the safety net gets a budget, and drops its oldest copies
   rather than ever crowding out the thing it exists to protect. */
const SNAP_BUDGET = 1200000;

const snapRead = () => {
  try { return JSON.parse(window.localStorage.getItem(SNAP_KEY) || "[]") || []; }
  catch (e) { return []; }
};

/* One snapshot per day. Taking one every save would burn storage for nothing;
   a day is the granularity anything here is measured in anyway. */
const snapshotIfDue = (d) => {
  try {
    /* Never snapshot the demo data. Rule 7: sample data must not be allowed to
       pass as her own logging — and a snapshot is exactly how it would sneak
       back in months later, wearing a date. */
    if (!d || d.sample) return snapRead();
    const day = today();
    const snaps = snapRead();
    if (snaps.length && snaps[0].day === day) return snaps;
    const entry = {
      day,
      at: new Date().toISOString(),
      days: Object.keys(d.logs || {}).length,
      json: JSON.stringify(d),
    };
    let next = [entry, ...snaps].slice(0, SNAP_KEEP);
    const size = (list) => list.reduce((a, x) => a + (x.json || "").length, 0);
    while (next.length > 1 && size(next) > SNAP_BUDGET) next = next.slice(0, -1);
    /* Even inside the budget the store can be full for reasons of its own.
       Halve and retry rather than lose the day's copy outright; and if even a
       single copy will not fit, leave what is already there untouched. */
    while (next.length) {
      try {
        window.localStorage.setItem(SNAP_KEY, JSON.stringify(next));
        return next;
      } catch (e) {
        if (next.length === 1) break;
        next = next.slice(0, Math.max(1, Math.floor(next.length / 2)));
      }
    }
    return snapRead();
  } catch (e) { return snapRead(); }
};

const backupName = () => `coach-backup-${today()}.json`;

/* --- the folder she grants once, remembered across sessions ---------------
   A directory handle cannot go in localStorage — it is a live object, so it
   goes in IndexedDB. Chrome and Edge on a desktop support this; Safari and
   phones do not, and the UI says so rather than offering a dead button. */
const DIR_DB = "coach-backup", DIR_STORE = "handles", DIR_ID = "folder";
const idb = () => new Promise((res, rej) => {
  try {
    const r = window.indexedDB.open(DIR_DB, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(DIR_STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  } catch (e) { rej(e); }
});
const dirSave = async (handle) => {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(DIR_STORE, "readwrite");
    tx.objectStore(DIR_STORE).put(handle, DIR_ID);
    tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
  });
};
const dirLoad = async () => {
  try {
    const db = await idb();
    return await new Promise((res) => {
      const tx = db.transaction(DIR_STORE, "readonly");
      const q = tx.objectStore(DIR_STORE).get(DIR_ID);
      q.onsuccess = () => res(q.result || null);
      q.onerror = () => res(null);
    });
  } catch (e) { return null; }
};
const dirForget = async () => {
  try {
    const db = await idb();
    return await new Promise((res) => {
      const tx = db.transaction(DIR_STORE, "readwrite");
      tx.objectStore(DIR_STORE).delete(DIR_ID);
      tx.oncomplete = () => res(true); tx.onerror = () => res(false);
    });
  } catch (e) { return false; }
};

const canPickFolder = () => typeof window !== "undefined" && !!window.showDirectoryPicker;
const canShareFiles = () => typeof navigator !== "undefined" && !!navigator.canShare &&
  (() => { try { return navigator.canShare({ files: [new File(["x"], "x.json")] }); } catch (e) { return false; } })();

/* Writes the backup into the granted folder. Returns a short status string so
   the UI can be honest about what happened rather than claiming success. */
const writeToFolder = async (d) => {
  try {
    if (!d || d.sample) return "sample";
    const dir = await dirLoad();
    if (!dir) return "no-folder";
    if (dir.queryPermission) {
      let p = await dir.queryPermission({ mode: "readwrite" });
      if (p !== "granted" && dir.requestPermission) p = await dir.requestPermission({ mode: "readwrite" });
      if (p !== "granted") return "denied";
    }
    const fh = await dir.getFileHandle(backupName(), { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(d, null, 2));
    await w.close();
    try { window.localStorage.setItem("coach:lastFolderBackup", today()); } catch (e) {}
    return "ok";
  } catch (e) { return "failed"; }
};

const lastFolderBackup = () => {
  try { return window.localStorage.getItem("coach:lastFolderBackup") || null; } catch (e) { return null; }
};
const lastFileBackup = () => {
  try { return window.localStorage.getItem("coach:lastFileBackup") || null; } catch (e) { return null; }
};
const markFileBackup = () => {
  try { window.localStorage.setItem("coach:lastFileBackup", today()); } catch (e) {}
};

/* How long since anything left this device. Null means never. */
const backupAgeDays = () => {
  const a = lastFolderBackup(), b = lastFileBackup();
  const best = [a, b].filter(Boolean).sort().pop();
  if (!best) return null;
  return Math.max(0, Math.round((parse(today()) - parse(best)) / 86400000));
};

/* Quiet until there is something to lose, then persistent but never nagging:
   a fortnight since the last copy, or a week of real logging with no copy at
   all. Sample data is never worth backing up (rule 7). */
const backupDue = (d) => {
  if (!d || d.sample) return false;
  const days = Object.keys(d.logs || {}).length;
  if (!days) return false;
  const age = backupAgeDays();
  if (age === null) return days >= 7;
  return age >= 14;
};

const downloadBackup = (d) => {
  try {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = backupName();
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    markFileBackup();
    return true;
  } catch (e) { return false; }
};

const shareBackup = async (d) => {
  try {
    const file = new File([JSON.stringify(d, null, 2)], backupName(), { type: "application/json" });
    await navigator.share({ files: [file], title: "Coach backup" });
    markFileBackup();
    return "ok";
  } catch (e) {
    return (e && e.name === "AbortError") ? "cancelled" : "failed";
  }
};

let storeWriteFailed = false;
const didStoreWriteFail = () => storeWriteFailed;
const saveData = async (d) => {
  /* Never write over data we failed to read. */
  if (storeReadFailed) return;
  try { await store.set(KEY, JSON.stringify(d)); storeWriteFailed = false; }
  catch (e) { storeWriteFailed = true; }
  /* A snapshot a day, kept separately, so a bad restore or a corrupted write
     can never take the history with it. */
  try { snapshotIfDue(d); } catch (e) {}
};

/* ============================================================================
   5. THE COACH
   ==========================================================================*/
function useCoach(data) {
  return useMemo(() => {
    const { settings, logs, weekly, monthly, fields } = data;
    const morning = data.morning || {};
    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const FX = formulas(settings);
    const t = today();
    const done = (d) => !!logs[d]?.completed;
    /* two on, one off beats fixed weekdays when the rhythm matters more than
       which day it lands on — the cycle just keeps turning */
    /* Two on, one off — but anchored to what you actually did, not to a date.
       Train Tuesday instead of Monday and the cycle simply moves with you.
       A day is a training day unless you've already done your run of them. */
    /* ONE ANSWER TO "IS TODAY A TRAINING DAY", USED EVERYWHERE.

       Consistency, missed days, the lapse state and the programme all asked
       this question separately and got different answers, which is how her
       deliberate rest days became missed sessions. They all call this now, and
       it reads her rhythm — whichever of the modes she chose. */
    const schedule = scheduleOf(settings);
    const schedMode = scheduleMode(schedule);
    const schedCtx = { schedule, logs, dayName, addDays, weekStart, done: (d) => !!logs[d]?.completed };
    const isScheduled = (d) => {
      try { return !!schedMode.trains(d, schedCtx); } catch (e) { return true; }
    };
    /* Some rhythms cannot call a single day "missed" — "four times a week, my
       choice of days" is only short once the week is over. */
    const missableDay = (d) => !schedMode.weeklyShortfall && isScheduled(d);

    /* No streak here, by design. A streak punishes one bad day, and the
       evidence says one missed opportunity does not measurably damage habit
       formation. The 28-day consistency window below does the same job
       without the punishment. */
    /* NOTHING BEFORE HER FIRST SESSION COUNTS.

       Without this a brand-new app opens by telling her she has missed five
       training days — days that existed before she had ever used it — and
       reports 4% consistency the moment she logs her first session, because
       the three weeks before she started are counted against her. That is the
       app shaming her for its own empty history, which rule 24 forbids. A day
       only counts once there is something to have lapsed from. */
    const firstSession = (() => {
      const days = Object.keys(logs).filter((d) => logs[d]?.completed).sort();
      return days.length ? days[0] : null;
    })();

    let sched = 0, hit = 0;
    for (let i = 0; i < (FX.consistencyWindow || 28); i++) {
      const d = addDays(t, -i);
      if (firstSession && d < firstSession) continue;
      if (isScheduled(d)) { sched++; if (done(d)) hit++; }
    }
    const consistency = sched ? Math.round((hit / sched) * 100) : 0;

    const ws = weekStart(t);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const weekDone = weekDays.filter(done).length;
    const target = weeklyTargetOf(settings);

    const mk = monthKey(t);
    const monthDone = Object.keys(logs).filter((d) => d.startsWith(mk) && logs[d].completed).length;
    const daysInMonth = new Date(parse(t).getFullYear(), parse(t).getMonth() + 1, 0).getDate();
    const monthTarget = Math.round((target / 7) * daysInMonth);
    const totalSessions = Object.values(logs).filter((l) => l.completed).length;

    /* A week you hit your target is the unit that matters — not consecutive
       days, which a two-on-one-off cycle can never produce. */
    const weekTallies = (() => {
      const logged = Object.keys(logs).filter((d) => logs[d]?.completed).sort();
      if (!logged.length) return [];
      const firstWeek = weekStart(logged[0]);           /* history starts here, not 52 weeks ago */
      const out = [];
      for (let i = 0; i < 52; i++) {
        const k = addDays(ws, -7 * i);
        if (k < firstWeek) break;
        const days = Array.from({ length: 7 }, (_, j) => addDays(k, j));
        const n = days.filter((d) => d <= t && logs[d]?.completed).length;
        const running = days[6] > t;                    /* don't judge a week still in progress */
        if (running && n < target) continue;
        out.push({ k, n, hit: n >= target });
      }
      return out;                                       /* newest first */
    })();
    const weeksHit = weekTallies.filter((w) => w.hit).length;
    const weekRun = (() => {
      let n = 0;
      for (const w of weekTallies) { if (w.hit) n++; else break; }
      return n;
    })();
    const avgPerWeek = weekTallies.length
      ? Math.round((weekTallies.reduce((a, w) => a + w.n, 0) / weekTallies.length) * 10) / 10
      : 0;
    const totalMinutes = Object.values(logs).reduce((a, l) => {
      const m = Number(l?.minutes) || 0;
      const ex = (l?.extraSessions || []).reduce((b, x) => b + (Number(x.minutes) || 0), 0);
      return a + (l?.completed ? m : 0) + ex;
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);

    /* Kilograms moved: weight x reps across every battery entry ever logged,
       weekly and monthly. The only kilogram figure the app actually holds, and
       like the other two it only ever goes one way. */
    const totalKg = (() => {
      const wr = (fields.weekly || []).concat(fields.monthly || [])
        .filter((f) => f.type === "weightreps");
      if (!wr.length) return 0;
      let sum = 0;
      [weekly, monthly].forEach((store) => Object.values(store || {}).forEach((entry) => {
        wr.forEach((f) => { const v = loadOf(entry, f); if (!isNaN(v) && v > 0) sum += v; });
      }));
      return Math.round(sum);
    })();

    /* personal bests — driven entirely by the current field list */
    const wKeys = Object.keys(weekly).sort();
    const pbs = {}; let pbCount = 0;
    const stores = [weekly, monthly];
    const readVal = (entry, f) => {
      if (!entry) return NaN;
      if (f.type === "weightreps") return loadOf(entry, f);
      if (f.type === "time") {
        const raw = String(entry[f.id] || "");
        if (raw.includes(":")) { const [m, sec] = raw.split(":"); return Number(m) * 60 + Number(sec); }
        return Number(raw);
      }
      return Number(entry[f.id]);
    };
    fields.weekly.filter((f) => f.type !== "note" && f.better).forEach((f) => {
      let best = null;
      stores.forEach((store) => Object.keys(store).forEach((k) => {
        const v = readVal(store[k], f);
        if (isNaN(v) || v <= 0) return;
        if (best === null || (f.better === "up" ? v > best : v < best)) { best = v; pbCount++; }
      }));
      if (best !== null) pbs[f.id] = best;
    });

    const weekMap = {};
    Object.keys(logs).forEach((d) => { if (logs[d].completed) weekMap[weekStart(d)] = (weekMap[weekStart(d)] || 0) + 1; });
    const betsWon = Object.values(logs).filter((l) => l?.bet?.met === true).length;
    const betsTaken = Object.values(logs).filter((l) => l?.bet?.met !== undefined && l?.bet?.met !== null).length;

    const dn = dayName(t);

    /* where we are: week -> month (4 weeks) -> quarter (3 months) */
    const plan = data.plan || { startDate: t, themes: { week: {}, month: {}, quarter: {} } };
    const elapsed = Math.floor((parse(t) - parse(plan.startDate)) / 86400000);
    const rawWeek = Math.max(1, Math.floor(elapsed / 7) + 1);
    const pos = { week: rawWeek, month: Math.ceil(rawWeek / 4), quarter: Math.ceil(Math.ceil(rawWeek / 4) / 3) };
    const themePos = pos;  /* resolved against phase + season just below */

    /* which block of training we're in — it gates what the library offers */
    const phaseKey = phaseFor(t, settings.gymDate);
    const phase = { key: phaseKey, ...PHASES[phaseKey] };

    /* TWO LISTS, AND THE DIFFERENCE MATTERS.

       `allClasses` is everything she owns. `library` is only what today's phase
       allows — away from the home gym, equipment classes drop out.

       That filter belongs to PRESCRIBING ("what can she do today"). It must
       never touch ACCOUNTING ("what did she do"), or a session she genuinely
       completed becomes invisible the moment the phase changes: no body
       regions, no weekly sets, no coverage — as though she had trained
       nothing. Historical lookups below use `allClasses` for exactly this
       reason. */
    const allClasses = data.library || [];
    const library = allClasses.filter((w) => {
      if (w.home && !phase.allowHome) return false;
      if (w.shoulderLoad === "high" && !phase.allowHighShoulder && settings.shoulderInjury) return false;
      return true;
    });
    const session = allClasses.find((w) => w.name === logs[t]?.type) || null;
    const hasPlan = library.length > 0;

    const planned = session;
    /* The programme owns the week's shape now: it says which days train and
       which rest, and it says what kind of session each training day is. */
    const program = data.program?.phases?.length ? data.program : SEED_PROGRAM;
    const block = blockFor(t, program, isScheduled);
    const programWeek = programWeekOf(t, program);
    const programPhase = phaseForWeek(programWeek, program);
    const programPhases = phaseRanges(program);
    const liveIdx = Math.max(0, programPhases.findIndex((ph) => programWeek >= ph.from && programWeek <= ph.to));
    const livePhase = programPhases[liveIdx] || programPhases[0] || null;
    const calibrating = !!(livePhase && livePhase.calibrate);
    /* ---- THE CALIBRATION MONTH ------------------------------------------
       Her correction, and it is the right one: "the app should be in charge
       of everything, not me" applies AFTER the first month, not during it.
       In the first block the coach has nothing to design from, so a class it
       names is a guess she then has to work around — and a day logged against
       a guess she did not take is worse than no plan at all.

       So during calibration the coach proposes nothing. It asks what she did,
       records it, chases what is missing, and says what it notices. It knows
       what today WOULD have been (below, unused) only so that at the end of
       the month it can see how close its instincts were to her real month. */
    const restDay = block ? block.id === "rest" : !isScheduled(t);
    const loggedToday = logs[t] || null;

    /* recovery is entered in the morning and shapes the day before it happens */
    const recValue = data.morning?.[t]?.recovery ?? loggedToday?.whoopRecovery ?? "";
    const recBaseline = recoveryBaseline(data.morning, t) || Number(settings.recoveryBaseline) || 55;
    const F = formulas(settings);
    const recovery = recoveryBand(recValue, recBaseline, F);

    /* winter holds the line instead of pushing it */
    const season = seasonOf(t);

    /* the coach writes the themes; anything typed in Workouts wins */
    const auto = autoThemes(t, themePos, phase.key, season.key);
    const themes = {
      week: plan.themes.week?.[pos.week] || auto.week,
      month: plan.themes.month?.[pos.month] || auto.month,
      quarter: plan.themes.quarter?.[pos.quarter] || auto.quarter,
    };
    const themesAuto = {
      week: !plan.themes.week?.[pos.week],
      month: !plan.themes.month?.[pos.month],
      quarter: !plan.themes.quarter?.[pos.quarter],
    };
    const seasonTarget = season.key === "maintain" ? Math.max(2, target - 1) : target;

    /* ---- what the coach picks for today ---- */
    const themeGoal = (() => {
      const txt = (themes.week || "").toLowerCase();
      return GOALS.find((g) => txt.includes(g)) || null;
    })();

    /* ---- the weekly verdict, read off last completed week ---- */
    const lastWeekKey = weekStart(addDays(t, -7));
    const lastWeek = weekly[lastWeekKey] || null;
    const prevWeek = weekly[weekStart(addDays(t, -14))] || null;

    const confRaw = lastWeek ? Number(lastWeek.confidence) : NaN;
    const confidence = confidenceRule(isNaN(confRaw) ? null : confRaw);

    const comfortReadings = weekDays.map((d) => Number(logs[d]?.shoulder)).filter((v) => !isNaN(v) && v > 0);
    const lowComfort = comfortReadings.filter((v) => v < 4).length;
    const comfortOk = settings.shoulderInjury
      ? (comfortReadings.length ? lowComfort === 0 : null)
      : null;
    const shoulderFrozen = settings.shoulderInjury && lowComfort >= 2;

    const recReadings = weekDays.map((d) => Number(data.morning?.[d]?.recovery)).filter((v) => !isNaN(v) && v > 0);
    const recAvg = recReadings.length ? recReadings.reduce((a, b) => a + b, 0) / recReadings.length : null;

    const qualityRaw = lastWeek ? Number(lastWeek.rpe) : NaN;
    const verdict = phase.progress && season.key !== "maintain"
      ? weeklyVerdict({
          hitTarget: weekDone >= seasonTarget ? true : (weekDone >= seasonTarget - 1 ? null : false),
          comfortOk,
          recoveryOk: recAvg === null ? null : recAvg >= recBaseline - 5,
          confidence: confidence ? confidence.key === "up" : null,
          quality: isNaN(qualityRaw) ? null : qualityRaw <= 8,
        })
      : { key: "paused", label: "Progression paused",
          line: season.key === "maintain" ? "Maintenance season. Nothing needs to get harder right now."
            : "Learning the room this week. Nothing needs to get harder yet." };

    /* ---- weekly health score ---- */
    const sleepVals = weekDays.map((d) => Number(logs[d]?.sleep)).filter((v) => !isNaN(v) && v > 0);
    const capBest = (cap) => {
      const f = fields.weekly.find((x) => x.cap === cap && x.role === "anchor");
      if (!f || !lastWeek || !prevWeek) return null;
      const a = Number(lastWeek[f.id]), b = Number(prevWeek[f.id]);
      if (isNaN(a) || isNaN(b) || !b) return null;
      return Math.max(0, Math.min(1, 0.5 + (a - b) / b));
    };
    const health = healthScore({
      completion: seasonTarget ? weekDone / seasonTarget : null,
      recovery: recAvg === null ? null : Math.min(1, recAvg / (recBaseline + 10)),
      sleep: sleepVals.length ? Math.min(1, (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) / 8) : null,
      strength: capBest("push"),
      mobility: capBest("mobility"),
      balance: capBest("balance"),
    }, { completion: F.wCompletion, recovery: F.wRecovery, sleep: F.wSleep,
         strength: F.wStrength, mobility: F.wMobility, balance: F.wBalance });

    /* ---- every measure, analysed comparatively ---- */
    const ctx = {
      hitTarget: weekDone >= seasonTarget,
      recoveryOk: recAvg === null ? true : recAvg >= recBaseline - 5,
      shoulderIssue: settings.shoulderInjury && lowComfort > 0,
    };
    const analysis = fields.weekly
      .filter((f) => f.type !== "note" && f.better)
      .map((f) => {
        const m = analyseMeasure(f, { ...weekly, ...monthly }, FX);
        return m ? { ...m, why: explainChange(m, ctx), next: nextStepFor(m, ctx) } : null;
      })
      .filter(Boolean);

    const improving = analysis.filter((m) => m.direction === "up");
    const declining = analysis.filter((m) => m.direction === "down");
    const holding = analysis.filter((m) => m.direction === "flat");
    const overall = analysis.length
      ? Math.round((analysis.reduce((a, m) => a + (m.outOf10 ?? 0), 0) / analysis.length) * 10) / 10
      : null;

    /* ---- the coach speaks first, without being asked ---- */
    /* the weight in a bet is one she has actually handled, not a guess */
    const workWeight = (() => {
      const src = ["goblet", "cablerow", "press"];
      for (const id of src) {
        const f = fields.weekly.find((x) => x.id === id);
        if (!f) continue;
        const keys = Object.keys(weekly).sort().reverse();
        for (const k of keys) {
          const w = Number(weekly[k]?.[id + "__w"]);
          if (!isNaN(w) && w > 0) return Math.round(w * 2) / 2;
        }
      }
      return null;
    })();

    /* her best on any measure, so a finisher can reach past it */
    const bestOf = (id) => {
      const f = fields.weekly.find((x) => x.id === id);
      if (!f) return null;
      let best = null;
      Object.values(weekly).forEach((e) => {
        const v = readMeasure(e, f);
        if (!isNaN(v) && (best === null || v > best)) best = v;
      });
      return best;
    };

    const bet = betFor({
      date: t, recovery, restDay, shoulderFrozen, workWeight, bestOf,
      used: Object.values(logs).map((l) => l?.bet?.id).filter(Boolean),
    });

    /* ---- THE RECORD ----------------------------------------------------
       Read before the coach answers anything. The value isn't the list, it's
       what the list can tell her the third time something comes back. */
    const issues = (data.issues || []);
    const openIssues = issues.filter((i) => i.status !== "closed");

    /* what she did in the three days before a date — the suspects */
    const priorSessions = (date, days = 3) => {
      const out = [];
      for (let i = 1; i <= days; i++) {
        const d = addDays(date, -i);
        const l = logs[d];
        if (l?.completed && l.type) out.push({ date: d, type: l.type, ago: i, rpe: l.rpe, sets: l.sets });
        (l?.extraSessions || []).forEach((x) => { if (x.type) out.push({ date: d, type: x.type, ago: i }); });
      }
      return out;
    };

    /* everything this issue has been before: when, what was tried, what worked */
    const historyFor = (issue) => {
      const past = issues.filter((x) => x.id !== issue.id && sameIssue(x.tags, issue.tags))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      const helped = [];
      past.concat(issue).forEach((x) => {
        (x.tried || []).forEach((tr) => {
          if (Number(tr.helped) >= 4) helped.push({ what: tr.what, when: tr.date, score: Number(tr.helped) });
        });
      });
      /* classes that appear before more than one occurrence — the pattern */
      const counts = {};
      past.concat(issue).forEach((x) => {
        priorSessions(x.date).forEach((ps) => {
          counts[ps.type] = (counts[ps.type] || 0) + 1;
        });
      });
      const occurrences = past.length + 1;
      const suspects = Object.entries(counts)
        .filter(([, n]) => n >= 2 && occurrences >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([type, n]) => ({ type, n }));
      return { past, occurrences, helped, suspects, gapDays: past.length
        ? Math.round((parse(issue.date) - parse(past[0].date)) / 86400000) : null };
    };

    /* open issues the coach hasn't asked about in a couple of days */
    const issueFollowUp = openIssues.filter((i) => {
      const last = (i.tried || []).slice(-1)[0];
      const since = Math.round((parse(t) - parse(last ? last.date : i.date)) / 86400000);
      return since >= 2;
    });

    /* anything recurring right now */
    const recurring = openIssues.map((i) => ({ issue: i, ...historyFor(i) }))
      .filter((x) => x.occurrences >= 2)
      .sort((a, b) => b.occurrences - a.occurrences);

    /* ---- GOALS AND MOBILITY --------------------------------------------
       Things she wants to be able to do, and the tests that say how close
       she is. A goal here is not a note — it changes what gets prescribed. */
    const goals = (data.goals || []).filter((g) => g.status !== "retired");
    const openGoals = goals.filter((g) => g.status !== "won");

    const mobKeys = Object.keys(data.mobility || {}).sort();
    const lastMob = mobKeys.length ? data.mobility[mobKeys[mobKeys.length - 1]] : null;
    const prevMob = mobKeys.length > 1 ? data.mobility[mobKeys[mobKeys.length - 2]] : null;
    const mobDaysAgo = mobKeys.length
      ? Math.round((parse(t) - parse(mobKeys[mobKeys.length - 1])) / 86400000) : null;
    const mobDue = mobDaysAgo === null || mobDaysAgo >= 7;

    /* every test, scored, with its asymmetry and its direction of travel */
    const mobTests = data.mobTests?.length ? data.mobTests : SEED_MOBILITY;
    const drills = data.drills?.length ? data.drills : SEED_DRILLS;
    const mobRows = mobTests.map((m) => {
      const cur = lastMob?.[m.id] || null;
      const old = prevMob?.[m.id] || null;
      const val = (o) => {
        if (!o) return null;
        if (m.side) {
          const l = Number(o.l), r = Number(o.r);
          return l > 0 && r > 0 ? (l + r) / 2 : (l > 0 ? l : r > 0 ? r : null);
        }
        const v = Number(o.v);
        return v > 0 || (v === 0 && m.better === "lower") ? v : null;
      };
      const now = val(cur), then = val(old);
      const gap = m.side && cur && Number(cur.l) > 0 && Number(cur.r) > 0
        ? Math.abs(Number(cur.l) - Number(cur.r)) : null;
      const gapPct = gap !== null && Math.max(Number(cur.l), Number(cur.r)) > 0
        ? Math.round((gap / Math.max(Number(cur.l), Number(cur.r))) * 100) : null;
      const moved = now !== null && then !== null ? now - then : null;
      const better = moved === null ? null : (m.better === "higher" ? moved > 0 : moved < 0);
      /* how short is it? a 0-1 score where 1 = needs work most */
      const shortfall = now === null ? null
        : m.max ? Math.max(0, 1 - now / m.max)
        : m.better === "lower" ? Math.min(1, now / 30)
        : Math.max(0, 1 - now / 12);
      return { ...m, now, then, moved, better, gap, gapPct, shortfall, entry: cur };
    });

    const mobScored = mobRows.filter((r) => r.now !== null);
    const mobWeakest = [...mobScored].sort((a, b) => (b.shortfall || 0) - (a.shortfall || 0)).slice(0, 3);
    const mobAsym = mobScored.filter((r) => r.gapPct !== null && r.gapPct >= FX.asymmetryPct)
      .sort((a, b) => b.gapPct - a.gapPct);
    const mobScore = mobScored.length
      ? Math.round((1 - mean(mobScored.map((r) => r.shortfall))) * 100) : null;

    /* ten minutes of work, chosen by what the tests say is short — plus
       anything her stated goals need */
    const dailyDrills = (() => {
      const ids = [];
      mobWeakest.forEach((r) => (r.drills || []).forEach((d) => { if (!ids.includes(d)) ids.push(d); }));
      mobAsym.forEach((r) => (r.drills || []).forEach((d) => { if (!ids.includes(d)) ids.push(d); }));
      openGoals.forEach((g) => (g.drills || []).forEach((d) => { if (!ids.includes(d)) ids.push(d); }));
      const out = [];
      let mins = 0;
      for (const id of ids) {
        const d = drillById(id, drills);
        if (!d || mins + d.mins > 11) continue;
        out.push(d); mins += d.mins;
      }
      return { list: out, mins };
    })();

    /* the weekly "how's it going?" on each goal */
    const goalCheckDue = openGoals.filter((g) => {
      const last = (g.scores || []).slice(-1)[0];
      if (!last) return true;
      return Math.round((parse(t) - parse(last.date)) / 86400000) >= 7;
    });

    /* ---- ADHERENCE ENGINE ----------------------------------------------
       Built from the adherence evidence rather than from training theory.
       The one-year probability is the thing being optimised, and these are
       the levers with actual evidence behind them. */

    /* 1. LAPSE vs RELAPSE. One missed session is invisible — the habit
          literature is explicit that a single miss does not damage anything.
          Two or more in a week is a pattern, and the pattern is what turns
          into dropout. This is the difference the app has to be able to see. */
    const missesIn = (from, days) => {
      if (!firstSession) return 0;
      let missed = 0;
      for (let i = from; i < from + days; i++) {
        const d = addDays(t, -i);
        if (d < firstSession) continue;
        if (d >= t) continue;                 /* today is not a miss yet */
        if (!missableDay(d)) continue;        /* her rhythm, not the calendar */
        /* Reaching any rung means the day was not missed. A walk is not a
           session, but it is not a miss either. */
        if (logs[d]?.state === "moved") continue;
        if (!logs[d]?.completed) missed++;
      }
      return missed;
    };
    const missedThisWeek = missesIn(0, 7);
    const missedLastWeek = missesIn(7, 7);
    const daysSinceSession = (() => {
      for (let i = 0; i < 60; i++) if (logs[addDays(t, -i)]?.completed) return i;
      return null;
    })();
    /* ---- A DAY HAS THREE STATES, NOT TWO -------------------------------
       Rule 4 as amended: reaching any rung of the ladder means the day was
       not missed. That is only true if the app can record movement that was
       not the prescribed session — a walk, ten minutes on the floor — without
       either pretending she trained or counting it against her.

       `moved` is that third state. It is deliberately weak: it keeps her out
       of the missed column and it lets the coach say something true, and it
       reaches NOTHING that measures training. Sessions this week, consistency,
       load, sets, ACWR, the batteries and every region calculation all key off
       `completed`, which a moved day never sets. A small day must never be
       able to look like a training day.

       And there is no chain here on purpose. A run of consecutive days is a
       streak, and rule 25 forbids streaks — one bad day must not be able to
       cost her anything. So this is a window, exactly like consistency: how
       many of the last 28 days had movement in them. */
    const movedOn = (d) => !logs[d]?.completed && logs[d]?.state === "moved";
    const touched = (d) => done(d) || movedOn(d);
    const daysSinceMovement = (() => {
      for (let i = 0; i < 60; i++) if (touched(addDays(t, -i))) return i;
      return null;
    })();
    const movedDays28 = Array.from({ length: 28 }, (_, i) => addDays(t, -i)).filter(movedOn).length;
    const touchedDays28 = Array.from({ length: 28 }, (_, i) => addDays(t, -i)).filter(touched).length;

    /* Still about training, on purpose — a fortnight of walks is not the same
       as a fortnight of sessions and the coach should not pretend it is. What
       movement changes is the TONE, not the verdict: `stillMoving` lets the
       return line credit what she actually did instead of opening on a gap. */
    const stillMoving = movedDays28 > 0 && daysSinceMovement !== null && daysSinceMovement <= 2;
    const lapseState =
      daysSinceSession === null ? "none"
      : daysSinceSession >= 10 ? "away"          /* a real break */
      : missedThisWeek >= 2 && missedLastWeek >= 2 ? "drifting"
      : missedThisWeek >= 2 ? "wobble"
      : "steady";

    /* 2. CUE CONSISTENCY. Automaticity comes from a stable context, and the
          most stable cue available here is which days of the week she trains.
          Same days, week after week, is what makes it stop being a decision. */
    const cueConsistency = (() => {
      const byDow = [0, 0, 0, 0, 0, 0, 0];
      let weeks = 0;
      for (let w = 0; w < 8; w++) {
        let any = false;
        for (let i = 0; i < 7; i++) {
          const d = addDays(t, -(w * 7 + i));
          if (logs[d]?.completed) { byDow[parse(d).getDay()]++; any = true; }
        }
        if (any) weeks++;
      }
      if (weeks < 2) return null;
      const hits = byDow.filter((n) => n > 0);
      if (!hits.length) return null;
      /* how much of her training lands on her most-used days */
      const total = byDow.reduce((a, b) => a + b, 0);
      const top = [...byDow].sort((a, b) => b - a).slice(0, 4).reduce((a, b) => a + b, 0);
      return Math.round((top / total) * 100);
    })();

    /* 3. HABIT STRENGTH. Lally found a median 66 days to automaticity, about
          91 for exercise, and that isolated misses don't matter. So: weeks of
          repetition, weighted by cue consistency, forgiving single misses. */
    const trainingDays = Object.keys(logs).filter((d) => logs[d]?.completed);
    const firstEver = trainingDays.length ? trainingDays.sort()[0] : null;
    const weeksTraining = firstEver
      ? Math.floor((parse(t) - parse(firstEver)) / 86400000 / 7) : 0;
    const habitStrength = (() => {
      if (!firstEver || weeksTraining < 1) return null;
      /* 91 days is the habit-formation research figure for exercise — how long
         repetition takes to become automatic. It is NOT a plan and nothing is
         scheduled from it; the programme remains one month at a time. */
      const reps = Math.min(1, (weeksTraining * 7) / 91);
      const cue = cueConsistency === null ? 0.5 : cueConsistency / 100;
      const stick = Math.min(1, consistency / 85);
      return Math.round(reps * 0.45 * 100 + cue * 0.3 * 100 + stick * 0.25 * 100);
    })();

    /* 4. BARRIER COPING. Baseline confidence predicts starting; confidence
          about obstacles predicts still being here in a year. So count the
          sessions she did when something was in the way. */
    const barrierWins = (() => {
      let n = 0;
      for (let i = 0; i < 28; i++) {
        const d = addDays(t, -i);
        if (!logs[d]?.completed) continue;
        const m = morning?.[d] || {};
        const rec = Number(m.recovery);
        const sh = Number(m.shoulderAM);
        const slept = Number(m.asleep);
        const gapBefore = !logs[addDays(d, -1)]?.completed && !logs[addDays(d, -2)]?.completed;
        if ((rec > 0 && recBaseline && rec < recBaseline - 8) ||
            (sh > 0 && sh <= 2) || (slept > 0 && slept < 360) || gapBefore) n++;
      }
      return n;
    })();

    /* 5. IN-SESSION FEELING. How it felt DURING predicts whether she does it
          again; how it felt afterwards does not. Averaged by class. */
    const affectOf = (d) => {
      const v = Number(logs[d]?.during);
      return v >= 1 && v <= 5 ? v - 3 : null;      /* stored 1..5, read -2..+2 */
    };
    const affectRecent = (() => {
      const out = [];
      for (let i = 0; i < 28; i++) { const a = affectOf(addDays(t, -i)); if (a !== null) out.push(a); }
      return out;
    })();
    const affectMean = affectRecent.length >= 3 ? Math.round(mean(affectRecent) * 10) / 10 : null;
    /* "How you felt afterwards" was being collected and read by nothing.
       Paired with the during-session rating it answers a real question:
       does training leave her better than it found her? */
    const afterOf = (d) => {
      const v = Number(logs[d]?.energyAfter);
      return v >= 1 && v <= 5 ? v : null;
    };
    const afterRecent = (() => {
      const out = [];
      for (let i = 0; i < 28; i++) { const a = afterOf(addDays(t, -i)); if (a !== null) out.push(a); }
      return out;
    })();
    const afterMean = afterRecent.length >= 3 ? Math.round(mean(afterRecent) * 10) / 10 : null;
    /* the gap between during and after: negative means sessions cost her more
       than they give back, which is the profile that precedes stopping */
    const givesBack = (affectMean !== null && afterMean !== null)
      ? Math.round(((afterMean - 3) - affectMean) * 10) / 10 : null;

    const affectByClass = (() => {
      const map = {};
      for (let i = 0; i < 56; i++) {
        const d = addDays(t, -i);
        const a = affectOf(d);
        if (a === null || !logs[d]?.type) continue;
        (map[logs[d].type] = map[logs[d].type] || []).push(a);
      }
      return Object.entries(map).filter(([, v]) => v.length >= 2)
        .map(([name, v]) => ({ name, score: Math.round(mean(v) * 10) / 10, n: v.length }))
        .sort((a, b) => b.score - a.score);
    })();

    /* the gentlest thing in the library, for coming back after a break */
    const easiest = [...(data.library || [])]
      .filter((w) => !w.home && !w.addon)
      .sort((a, b) => (a.recoveryCost || 9) - (b.recoveryCost || 9))[0] || null;

    /* ---- PATTERNS IN WHAT SHE SAYS -------------------------------------
       Every dated piece of text she has entered, mined for recurring themes
       and then asked the seasonal and weekly questions. */
    const voice = (() => {
      const items = [];
      const push = (date, text, source) => {
        const tags = tagText(text);
        if (!date || !tags.length) return;
        items.push({ date, text, source, tags, dow: parse(date).getDay(), month: parse(date).getMonth() });
      };
      (data.chats || []).forEach((c) =>
        (c.messages || []).filter((m) => m.role === "user").forEach((m) => push(c.date, m.text, "chat")));
      (data.issues || []).forEach((i) => {
        push(i.date, i.text, "record");
        (i.tried || []).forEach((tr) => push(tr.date, tr.what, "record"));
      });
      (data.journal || []).forEach((j) => push(j.date, j.text, "journal"));
      Object.keys(logs).forEach((d) => {
        push(d, `${logs[d].sessionNote || ""} ${logs[d].did || ""}`, "session note");
        if (logs[d].mood) push(d, logs[d].mood === "good" ? "good" : `feeling ${logs[d].mood}`, "mood");
      });
      /* Same reason: the daily line is the app's voice, not hers. Feeding it
         to the pattern engine would let a theme in 101 canned sentences be
         reported back to her as a pattern in her own words. Only notes she
         kept — an act of hers — count. */
      Object.keys(data.notes || {}).forEach((d) => {
        if (data.notes[d]?.kept) push(d, data.notes[d]?.text, "note");
      });
      return items;
    })();

    const voicePatterns = (() => {
      const out = [];
      if (voice.length < 12) return out;
      const rateOf = (tag, subset) => {
        if (!subset.length) return null;
        return subset.filter((x) => x.tags.includes(tag)).length / subset.length;
      };
      const label = (tag) => VOICE_TAGS.find((v) => v.id === tag)?.label || tag;

      VOICE_TAGS.forEach((tag) => {
        const base = rateOf(tag.id, voice);
        if (base === null || base === 0) return;
        const total = voice.filter((x) => x.tags.includes(tag.id)).length;
        if (total < 3) return;

        /* seasonal — only where she has actually used the app in that season */
        SEASONS.forEach((se) => {
          const sub = voice.filter((x) => se.months.includes(x.month));
          if (sub.length < 8) return;
          const r = rateOf(tag.id, sub);
          if (r === null) return;
          const lift = Math.round((r - base) * 100);
          if (lift >= 15) out.push({ kind: "season", tag: tag.id,
            text: `You mention ${label(tag.id)} noticeably more between ${se.label.toLowerCase()} — ${Math.round(r * 100)}% of what you write then, against ${Math.round(base * 100)}% across the year.`,
            n: sub.length });
        });

        /* weekday */
        const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const weekend = voice.filter((x) => x.dow === 0 || x.dow === 6);
        const week = voice.filter((x) => x.dow > 0 && x.dow < 6);
        if (weekend.length >= 6 && week.length >= 6) {
          const rw = rateOf(tag.id, weekend), rd = rateOf(tag.id, week);
          if (rw !== null && rd !== null && Math.round((rw - rd) * 100) >= 15)
            out.push({ kind: "week", tag: tag.id,
              text: `${label(tag.id).charAt(0).toUpperCase() + label(tag.id).slice(1)} comes up far more at weekends than on weekdays — ${Math.round(rw * 100)}% against ${Math.round(rd * 100)}%.`,
              n: weekend.length });
          if (rw !== null && rd !== null && Math.round((rd - rw) * 100) >= 15)
            out.push({ kind: "week", tag: tag.id,
              text: `${label(tag.id).charAt(0).toUpperCase() + label(tag.id).slice(1)} is a weekday thing for you — ${Math.round(rd * 100)}% against ${Math.round(rw * 100)}% at weekends.`,
              n: week.length });
        }

        /* is it building or fading? last 28 days against everything before */
        const recent = voice.filter((x) => x.date > addDays(t, -28));
        const older = voice.filter((x) => x.date <= addDays(t, -28));
        if (recent.length >= 6 && older.length >= 10) {
          const rr = rateOf(tag.id, recent), ro = rateOf(tag.id, older);
          if (rr !== null && ro !== null) {
            const lift = Math.round((rr - ro) * 100);
            if (lift >= 20) out.push({ kind: "trend", tag: tag.id,
              text: `${label(tag.id).charAt(0).toUpperCase() + label(tag.id).slice(1)} has been coming up more this month than it used to — ${Math.round(rr * 100)}% against ${Math.round(ro * 100)}% before.`, n: recent.length });
            if (lift <= -20) out.push({ kind: "trend", tag: tag.id,
              text: `You mention ${label(tag.id)} less than you used to — ${Math.round(rr * 100)}% this month against ${Math.round(ro * 100)}% before. Worth noticing; those shifts are invisible day to day.`, n: recent.length });
          }
        }
      });
      return out.sort((a, b) => b.n - a.n);
    })();

    /* what she said around this time last year, and in this season before */
    const thisSeason = SEASONS.find((se) => se.months.includes(parse(t).getMonth())) || null;
    const seasonPast = thisSeason
      ? voice.filter((x) => thisSeason.months.includes(x.month) && x.date < addDays(t, -300)) : [];

    /* ---- WHAT THE APP HAS LEARNED ABOUT HER ----------------------------
       Not opinion — patterns computed from what actually happened. What
       precedes a session she does, versus one she misses. Everything here is
       derived, so it corrects itself as the evidence changes. */
    const learned = (() => {
      const out = { motivators: [], brakes: [], best: null, worst: null, notes: [] };
      const days = [];
      for (let i = 0; i < 84; i++) {
        const d = addDays(t, -i);
        const sched = isScheduled(d);
        if (!sched) continue;
        const m = morning?.[d] || {};
        const l = logs[d] || {};
        days.push({
          d, done: !!l.completed, dow: parse(d).getDay(),
          rec: Number(m.recovery) || null, slept: Number(m.asleep) || null,
          mood: l.mood || null, during: Number(l.during) || null,
          bodyPrev: (logs[addDays(d, -1)]?.therapy || []).length > 0,
          restPrev: !logs[addDays(d, -1)]?.completed,
        });
      }
      if (days.length < 10) return out;
      const rate = (f) => {
        const sub = days.filter(f);
        return sub.length >= 3 ? { pct: Math.round((sub.filter((x) => x.done).length / sub.length) * 100), n: sub.length } : null;
      };
      const base = Math.round((days.filter((x) => x.done).length / days.length) * 100);
      out.base = base;

      /* which weekday actually works */
      const byDow = [0,1,2,3,4,5,6].map((n) => ({ dow: n, ...(rate((x) => x.dow === n) || {}) }))
        .filter((x) => x.pct !== undefined);
      const bestDow = [...byDow].sort((a, b) => b.pct - a.pct)[0];
      const worstDow = [...byDow].sort((a, b) => a.pct - b.pct)[0];
      const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      if (bestDow && bestDow.pct - base >= 15) out.motivators.push(`${DOW[bestDow.dow]}s are your strongest day — you train on ${bestDow.pct}% of them against ${base}% overall`);
      if (worstDow && base - worstDow.pct >= 20) out.brakes.push(`${DOW[worstDow.dow]}s are where sessions go missing — ${worstDow.pct}% against ${base}% overall`);

      /* recovery: does a low score actually stop her? */
      const lowRec = rate((x) => x.rec !== null && recBaseline && x.rec < recBaseline - 8);
      const highRec = rate((x) => x.rec !== null && recBaseline && x.rec > recBaseline + 8);
      if (lowRec && base - lowRec.pct >= 20) out.brakes.push(`a low recovery score stops you — ${lowRec.pct}% of those days get trained against ${base}% overall`);
      else if (lowRec && Math.abs(lowRec.pct - base) < 10) out.motivators.push(`a low recovery score doesn't stop you, which is unusual and worth knowing`);
      if (highRec && highRec.pct - base >= 15) out.motivators.push(`you reliably use a good recovery morning — ${highRec.pct}% of them get trained`);

      /* sleep */
      const shortSleep = rate((x) => x.slept !== null && x.slept < 390);
      if (shortSleep && base - shortSleep.pct >= 20) out.brakes.push(`a short night is one of the strongest brakes on you — ${shortSleep.pct}% against ${base}%`);

      /* body work the day before */
      const afterBody = rate((x) => x.bodyPrev);
      if (afterBody && afterBody.pct - base >= 15) out.motivators.push(`the day after body work you almost always train — ${afterBody.pct}%`);

      /* coming off a rest day */
      const afterRest = rate((x) => x.restPrev);
      if (afterRest && base - afterRest.pct >= 20) out.brakes.push(`getting going again after a day off is where it slips — ${afterRest.pct}% against ${base}%`);

      /* what feels good */
      if (affectByClass.length >= 2) {
        out.best = affectByClass[0];
        const last = affectByClass[affectByClass.length - 1];
        if (last.score < 0) out.worst = last;
        /* Top of a list is not the same as good. If every class scores
           negative, the least-bad one was being announced as "what reliably
           feels good" on the same screen as "harder than it should be". */
        if (affectByClass[0].score > 0)
          out.motivators.push(`${affectByClass[0].name} is what reliably feels good while you're doing it`);
        if (last.score < 0) out.brakes.push(`${last.name} consistently feels worse in the room than anything else you do`);
      }

      /* what she has written when things went well or badly */
      const noteWords = (want) => {
        const words = {};
        Object.keys(logs).forEach((d) => {
          const l = logs[d];
          const txt = `${l.sessionNote || ""} ${l.did || ""}`.toLowerCase();
          if (!txt.trim()) return;
          const good = Number(l.during) >= 4 || Number(l.energyAfter) >= 4;
          if (good !== want) return;
          txt.split(/[^a-z']+/).filter((w) => w.length > 4).forEach((w) => { words[w] = (words[w] || 0) + 1; });
        });
        return Object.entries(words).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
      };
      out.goodWords = noteWords(true);
      out.hardWords = noteWords(false);
      return out;
    })();

    /* ---- BODY WORK -----------------------------------------------------
       Never prescribed, always optional, but it changes what the next
       session should be — so the engine reads it before it decides. */
    const therapyOn = (d) => (logs[d]?.therapy || []);
    const therapyWindow = (days) => {
      const out = [];
      for (let i = 0; i < days; i++) {
        const d = addDays(t, -i);
        therapyOn(d).forEach((x) => out.push({ ...x, date: d, ago: i, def: therapyById(x.type) }));
      }
      return out.filter((x) => x.def);
    };
    const therapyRecent = therapyWindow(3);
    const therapy28 = therapyWindow(28);

    /* tissue still settling? only the reactive kinds, and only inside their window */
    const reactiveEntry = therapyRecent.find((x) => x.def.after === "easy" && x.ago < x.def.days);
    const supportEntry = therapyRecent.find((x) => x.def.after === "support" && x.ago <= 1);
    const guidedEntry = therapyRecent.find((x) => x.def.after === "guided" && x.ago <= 1);
    const bodywork = {
      recent: therapyRecent,
      reactive: reactiveEntry ? { label: reactiveEntry.def.label, why: reactiveEntry.def.why } : null,
      support: supportEntry ? { label: supportEntry.def.label, why: supportEntry.def.why } : null,
      guided: guidedEntry ? { label: guidedEntry.def.label, why: guidedEntry.def.why } : null,
      count28: therapy28.length,
      minutes28: therapy28.reduce((a, x) => a + (Number(x.minutes) || 0), 0),
    };

    /* did recovery actually respond the morning after? her evidence, not a claim */
    const recAfter = (kind) => {
      const vals = [];
      therapy28.filter((x) => x.def.after === kind).forEach((x) => {
        const before = Number(morning?.[x.date]?.recovery);
        const after = Number(morning?.[addDays(x.date, 1)]?.recovery);
        if (before > 0 && after > 0) vals.push(after - before);
      });
      return vals.length >= 2 ? Math.round(mean(vals)) : null;
    };
    const supportResponse = recAfter("support");
    const reactiveResponse = recAfter("easy");


    const wouldHavePicked = prescribe({
      library, logs, date: t, recovery, restDay, phase, themeGoal, block, bodywork,
      shoulderFrozen, shoulderInjury: settings.shoulderInjury,
      /* one uncomfortable day is enough to tilt the choice; two is what makes
         it a freeze. Nothing is ruled out at one - it is a lean, not a bar. */
      shoulderSore: !!settings.shoulderInjury && lowComfort >= 1,
    });
    /* Nothing is offered in the calibration block. Everything downstream that
       asks "what did the coach say today" gets null, and answers honestly. */
    const prescribed = calibrating ? null : wouldHavePicked;

    /* the whole quarter, so she can see where today sits in it */
    const programDays = (from, count) => Array.from({ length: count }, (_, i) => {
      const d = addDays(from, i);
      const b = blockFor(d, program, isScheduled);
      return { date: d, block: b, done: !!logs[d]?.completed, type: logs[d]?.type || null };
    });

    /* ---- the coach sets the day, not you --------------------------------
       Measuring rides on the first training day of the week: you're already
       changed, already in the room, already warm. Numbers first, then train.
       Same for the monthly benchmark — first training day of the month. If
       nothing is scheduled at all, it falls on the first day. */
    const firstTrainingDay = (days) => days.find((d) => isScheduled(d)) || days[0];

    const weeklyAssessDay = firstTrainingDay(weekDays);
    const monthDays = (() => {
      const first = mk + "-01";
      const out = [];
      for (let i = 0; i < 31; i++) {
        const d = addDays(first, i);
        if (d.slice(0, 7) !== mk) break;
        out.push(d);
      }
      return out;
    })();
    const monthlyAssessDay = firstTrainingDay(monthDays);

    /* once this week's are in, the card should name the NEXT one, not the
       day that has already gone by */
    const nextWeekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, 7 + i));
    const nextAssessDay = weekly[ws] ? firstTrainingDay(nextWeekDays) : weeklyAssessDay;

    /* due the moment its day arrives, and it stays due until it's done */
    const weeklyDue = !weekly[ws] && t >= weeklyAssessDay;
    const monthlyDue = !monthly[mk] && t >= monthlyAssessDay;
    const weeklyToday = !weekly[ws] && t === weeklyAssessDay;
    const monthlyToday = !monthly[mk] && t === monthlyAssessDay;
    const weeklyLate = weeklyDue && t > weeklyAssessDay
      ? Math.round((parse(t) - parse(weeklyAssessDay)) / 86400000) : 0;
    const monthlyLate = monthlyDue && t > monthlyAssessDay
      ? Math.round((parse(t) - parse(monthlyAssessDay)) / 86400000) : 0;

    const nudges = [];
    if (monthlyToday) nudges.push({ admin: true, tone: "push", text: "Benchmark day. The battery is today's session — thirty minutes under load, body composition included. Stretch afterwards if you have it in you." });
    else if (weeklyToday) nudges.push({ admin: true, tone: "push", text: "Measurement day. Ten minutes at the front of today's session, and the whole coaching engine gets its numbers." });
    else if (monthlyLate >= 2) nudges.push({ admin: true, tone: "firm", text: `Your monthly benchmark is ${monthlyLate} days late. Without it I'm coaching on guesswork.` });
    else if (weeklyLate >= 2) nudges.push({ admin: true, tone: "firm", text: `Your measurements are ${weeklyLate} days late. Take them today — every target I set comes out of those numbers.` });
    if (!loggedToday && !restDay && recovery?.key === "green")
      nudges.push({ tone: "push", text: "Recovery is above your normal today. If you want a harder one this week, this is the day your body is set up for." });
    const missedRecently = firstSession
      ? weekDays.filter((d) => d < t && d >= firstSession && isScheduled(d) && !done(d)).length : 0;
    if (missedRecently >= 2 && weekDone < seasonTarget - 1)
      nudges.push({ tone: "firm", text: `The week has been lighter than planned. No accounting needed — if today suits you, it's a good one to take.` });
    if (declining.length >= 3)
      nudges.push({ tone: "firm", text: `${declining.length} measures moved down this week. Usually volume, not ability. Get the sessions in and they come back.` });
    if (improving.length >= 3)
      nudges.push({ tone: "warm", text: `${improving.length} measures improved. Whatever you did over the last fortnight, do it again.` });
    if (pbCount > 0 && improving.some((m) => m.isBest))
      nudges.push({ tone: "warm", text: `New personal best in ${improving.filter((m) => m.isBest).map((m) => m.label.toLowerCase()).join(" and ")}. That's the whole point of measuring.` });
    if (consistency >= 85)
      nudges.push({ tone: "warm", text: `${consistency}% consistency over four weeks. Most people never get near that.` });
    if (recovery?.key === "rest" && !loggedToday)
      nudges.push({ tone: "firm", text: "Recovery is well below your normal. Doing nothing today is the correct training decision, not a missed day." });

    /* ================= THE FIVE VITALS =================================
       Everything above answers "what today". These answer "how is this
       going" — the five numbers that show whether the training is working,
       computed the way the sports-science literature computes them and then
       translated into English. Each carries its own explanation because she
       has never used numbers like these before. */

    const readMorning = (key, days) => {
      const out = [];
      for (let i = 0; i < days; i++) {
        const v = Number(morning?.[addDays(t, -i)]?.[key]);
        if (v > 0) out.push(v);
      }
      return out;
    };

    /* --- autonomic drift: weekly, never daily. Day-to-day noise swamps it --- */
    const rhr7 = mean(readMorning("rhr", 7)), rhr28 = mean(readMorning("rhr", 28));
    const hrv7 = mean(readMorning("hrv", 7)), hrv28 = mean(readMorning("hrv", 28));
    const slp7 = mean(readMorning("asleep", 7)), slp28 = mean(readMorning("asleep", 28));
    const rhrDrift = rhr7 && rhr28 ? rhr7 - rhr28 : null;
    const hrvDrift = hrv7 && hrv28 ? ((hrv7 - hrv28) / hrv28) * 100 : null;

    /* --- which capabilities have gone quiet --- */
    const capOf = (name) => allClasses.find((w) => w.name === name)?.goal || null;
    const goalsSeen = (days) => {
      const seen = {};
      for (let i = 0; i < days; i++) {
        const d = addDays(t, -i);
        const l = logs[d];
        if (!l?.completed) continue;
        [l.type, ...((l.extraSessions || []).map((x) => x.type))].forEach((n) => {
          const g = capOf(n);
          if (g) seen[g] = (seen[g] || 0) + 1;
        });
      }
      return seen;
    };
    const seen14 = goalsSeen(14);
    const dormant = GOALS.filter((g) => !seen14[g]);
    const variety28 = new Set(
      Array.from({ length: 28 }, (_, i) => logs[addDays(t, -i)])
        .filter((l) => l?.completed && l.type).map((l) => l.type)).size;
    /* A class she adds herself starts without a body map, and a class with no
       body map is invisible to Coverage, to weekly sets and to the `sets`
       design rule — it would look like she trained nothing. So fall back to a
       sensible spread for the goal it carries. A rough map beats a blank one;
       she can tune it per class in Workouts. */
    const bodyOf = (name) => {
      const w = allClasses.find((x) => x.name === name);
      if (!w) return null;
      return w.body || BODY_BY_GOAL[w.goal] || null;
    };
    const rpeOf = (l) => Number(l?.rpe) || 0;

    /* Session load = minutes x effort. The standard internal-load measure. */
    const loadOfDay = (d) => {
      const l = logs[d];
      if (!l?.completed) return 0;
      let sum = Number(l.minutes || 0) * rpeOf(l);
      (l.extraSessions || []).forEach((x) => {
        sum += Number(x.minutes || 0) * (Number(x.rpe) || rpeOf(l) || 0);
      });
      return Math.round(sum);
    };
    const loadWindow = (days, offset = 0) => {
      let sum = 0;
      for (let i = 0; i < days; i++) sum += loadOfDay(addDays(t, -(i + offset)));
      return sum;
    };

    const acute = loadWindow(7);                    /* last 7 days  = fatigue */
    const chronic28 = loadWindow(28);
    const chronic = Math.round(chronic28 / 4);      /* mean week over 28d = fitness */
    const priorWeek = loadWindow(7, 7);
    const loadTrend = priorWeek ? Math.round(((acute - priorWeek) / priorWeek) * 100) : null;
    const hasLoad = chronic28 > 0;

    /* Acute:chronic. 0.8-1.3 is the range the evidence supports.

       IT NEEDS A REAL BASE TO DIVIDE BY. `chronic` is the 28-day mean week and
       the 28 days INCLUDE this one, so with no prior history the ratio pins at
       its arithmetic ceiling of 4.00 — her very first session read "Spiking",
       and the landing page told her sudden jumps cause injuries and to take the
       next one easier. The same thing happened after every lay-off, which is
       precisely the accounting rule 24 and the description forbid.

       So: there must be genuine training in the three weeks BEFORE this one.
       Below that there is nothing to be a ratio of, and the honest answer is
       to say nothing (rule 23). */
    const baseDays = (() => {
      let n = 0;
      for (let i = 7; i < 28; i++) if (loadOfDay(addDays(t, -i)) > 0) n++;
      return n;
    })();
    const hasChronicBase = baseDays >= 3;
    const acwr = (chronic > 0 && hasChronicBase) ? Math.round((acute / chronic) * 100) / 100 : null;
    const acwrBand = acwr === null ? null
      : acwr < FX.acwrLow ? { key: "under", label: "Under", color: C.ochre }
      : acwr <= FX.acwrHigh ? { key: "good", label: "In range", color: C.moss }
      : acwr <= FX.acwrSpike ? { key: "high", label: "Pushing", color: C.ochre }
      : { key: "spike", label: "Spiking", color: C.clay };

    /* Load per body region, so the app stops watching one shoulder only. */
    const regionLoad = (days) => {
      const out = {};
      REGIONS.forEach((r) => { out[r.id] = 0; });
      for (let i = 0; i < days; i++) {
        const d = addDays(t, -i);
        const l = logs[d];
        if (!l?.completed) continue;
        const each = [{ type: l.type, minutes: l.minutes, rpe: l.rpe }, ...(l.extraSessions || [])];
        each.forEach((sess) => {
          const b = bodyOf(sess.type);
          if (!b) return;
          /* Coverage is a SHARE, so it stays meaningful on minutes alone when
             no effort score exists — which is what the card already claims.
             Effort and Balance stay blank, because a share is honest without
             RPE and a total is not. */
          const ld = Number(sess.minutes || 0) * (Number(sess.rpe) || rpeOf(l) || 1);
          REGIONS.forEach((r) => { out[r.id] += (ld * (b[r.id] || 0)) / 3; });
        });
      }
      REGIONS.forEach((r) => { out[r.id] = Math.round(out[r.id]); });
      return out;
    };
    const body7 = regionLoad(7);
    const body28 = regionLoad(28);
    const bodyTotal7 = REGIONS.reduce((a, r) => a + body7[r.id], 0);

    /* Sets per region per week. A class's body map weights how much of a
       session's sets land on each region, so eight sets of BODYPUMP counts
       fully towards legs and partially towards arms. */
    const regionSets = (days) => {
      const out = {};
      REGIONS.forEach((r) => { out[r.id] = 0; });
      for (let i = 0; i < days; i++) {
        const l = logs[addDays(t, -i)];
        if (!l?.completed) continue;
        [{ type: l.type, sets: l.sets }, ...(l.extraSessions || [])].forEach((sess) => {
          const b = bodyOf(sess.type);
          const n = Number(sess.sets) || 0;
          if (!b || !n) return;
          REGIONS.forEach((r) => { out[r.id] += (n * (b[r.id] || 0)) / 3; });
        });
      }
      REGIONS.forEach((r) => { out[r.id] = Math.round(out[r.id] * 10) / 10; });
      return out;
    };
    const sets7 = regionSets(7);
    const setsTotal = REGIONS.reduce((a, r) => a + sets7[r.id], 0);
    const SET_TARGET = FX.setTarget;
    const setsMet = REGIONS.filter((r) => sets7[r.id] >= SET_TARGET).length;
    const setsShort = REGIONS.filter((r) => sets7[r.id] < SET_TARGET)
      .sort((a, b) => sets7[a.id] - sets7[b.id]);

    /* A region counts as covered if it took a real share of the week's work. */
    const COVER_MIN = FX.coverMin;
    const bodyRows = REGIONS.map((r) => {
      const share = bodyTotal7 ? body7[r.id] / bodyTotal7 : 0;
      return {
        ...r, load: body7[r.id], load28: body28[r.id], share: Math.round(share * 100),
        sets: sets7[r.id], setsMet: sets7[r.id] >= SET_TARGET,
        covered: bodyTotal7 > 0 && share >= COVER_MIN,
        state: !bodyTotal7 ? "none" : share >= FX.coverStrong ? "strong" : share >= COVER_MIN ? "ok" : "thin",
      };
    });
    const covered = bodyRows.filter((r) => r.covered).length;
    const thinnest = bodyRows.filter((r) => !r.covered).sort((a, b) => a.load28 - b.load28);

    /* Adaptation: is the same work costing less? Recovery response per unit strain. */
    const costSeries = (days, offset) => {
      const out = [];
      for (let i = 0; i < days; i++) {
        const d = addDays(t, -(i + offset));
        const st = Number(morning?.[d]?.strain);
        const rNext = Number(morning?.[addDays(d, 1)]?.recovery);
        const rNow = Number(morning?.[d]?.recovery);
        if (st > 6 && rNext > 0 && rNow > 0) out.push((rNow - rNext) / st);
      }
      return out;
    };
    const nowSeries = costSeries(28, 0), thenSeries = costSeries(28, 28);
    const costNow = mean(nowSeries), costThen = mean(thenSeries);
    /* This is a ratio, and a ratio against a near-zero denominator explodes:
       a month whose average cost was 0.02 turns a trivial difference into
       "-130%", which is noise wearing the clothes of a finding — and it would
       be shown as a headline reading "costing more". So: enough hard days on
       both sides to average at all, and a denominator big enough to divide by.
       Below that it says nothing, which is the honest answer. */
    const ADAPT_MIN_DAYS = 5;      /* enough hard days to average at all      */
    const ADAPT_MIN_COST = 0.1;    /* last month's strain must have actually
                                      cost recovery — roughly a point of
                                      recovery per ten points of strain        */
    const adaptation =
      costNow !== null && costThen !== null &&
      nowSeries.length >= ADAPT_MIN_DAYS && thenSeries.length >= ADAPT_MIN_DAYS &&
      costThen >= ADAPT_MIN_COST
        ? Math.round(((costThen - costNow) / costThen) * 100) : null;

    /* Several numbers, one sentence. This is the conclusion she asked for —
       effort, balance, consistency and coverage read together rather than
       one at a time, because no single one of them means much alone. */
    const readingOf = () => {
      const parts = [];
      if (!hasLoad)
        return "These five start working once your sessions carry an effort score — the tap is at the bottom of this card, right after you log. Until then the app is counting attendance, which is the least interesting thing about you.";
      if (acwrBand?.key === "spike")
        parts.push("This week is a long way above your normal, and sudden jumps are where injuries come from — not hard training, sudden training. Take the next one easier.");
      else if (acwrBand?.key === "under" && consistency < 70)
        parts.push("You're doing less than your body is prepared for, and missing sessions on top. Neither is a crisis on its own; together they're a drift worth stopping.");
      else if (acwrBand?.key === "under")
        parts.push("You're showing up reliably but the work has got lighter. There's room to push — your body is prepared for more than you're giving it.");
      else if (acwrBand?.key === "good" && consistency >= 75)
        parts.push("Consistent, and training at a level your body is ready for. This is exactly the boring middle where progress actually happens.");
      else if (acwrBand?.key === "high")
        parts.push("Heavier than your usual month. Fine for one week — not two in a row.");
      else parts.push("The load is reasonable; the gaps between sessions are the thing to tighten.");
      if (covered <= 4 && thinnest.length)
        parts.push(`${thinnest.slice(0, 2).map((r) => r.label.toLowerCase()).join(" and ")} barely got touched — that's where the next add-on should go.`);
      if (adaptation !== null && adaptation > 8)
        parts.push("And the same effort is costing you less recovery than it did a month ago, which is the part no strength number will tell you.");
      return parts.join(" ");
    };
    const reading = readingOf();

    /* ---- the rest of the calculations ---------------------------------
       Everything in the calculations document, not just the headline five.
       Each carries how it's worked out and what it means, and each is honest
       about needing an input it hasn't got yet rather than inventing a value. */

    /* ---- THE REST OF WHOOP --------------------------------------------
       Sixteen fields were being stored and read by nothing. Rule 14 says a
       field either feeds a calculation and produces something she can act on,
       or it gets dropped. These are the four questions they can answer. */

    /* 1. Illness watch. Skin temperature, blood oxygen and respiratory rate
          together are WHOOP's own early-warning trio — no one of them alone
          means much, two moving together usually precedes feeling unwell. */
    const tempBase = mean(readMorning("skinTemp", 28));
    const tempNow = mean(readMorning("skinTemp", 3));
    const respBase = mean(readMorning("respiratory", 28));
    const respNow = mean(readMorning("respiratory", 3));
    const spo2Now = mean(readMorning("spo2", 3));
    const illnessFlags = [];
    if (tempBase && tempNow && tempNow - tempBase >= 0.4) illnessFlags.push("skin temperature up");
    if (respBase && respNow && respNow - respBase >= 1.0) illnessFlags.push("breathing rate up");
    if (spo2Now && spo2Now < 95) illnessFlags.push("blood oxygen below 95%");
    /* ---- THE SMALLER DOOR ----------------------------------------------
       Rule 4 as amended: the coach never accepts a no and closes the
       conversation. What is available today, hardest first, with the
       load-bearing rungs removed when her body is the thing talking.

       `physical` is deliberately broad. Sore is not the same as can't-face-it,
       and on the days it IS her body the ladder must not offer her load — it
       offers what is left, which is still not nothing. */
    const physicalSignal = !!(
      shoulderFrozen
      || (settings.shoulderInjury && lowComfort >= 1)
      || recovery?.key === "rest"
      || illnessFlags.length > 0
    );
    const ladder = ladderFor({
      prescribed: prescribed || null,
      easiest,
      drills: dailyDrills,
      physical: physicalSignal,
    });
    const ladderWhy = physicalSignal
      ? (shoulderFrozen || (settings.shoulderInjury && lowComfort >= 1)
          ? "Your shoulder is the thing talking today, so nothing here loads it."
          : illnessFlags.length ? "Something is showing in your overnight numbers, so nothing here loads you."
          : "Recovery is well below your normal, so nothing here loads you.")
      : null;


    /* 2. Sleep quality, as distinct from quantity. Deep and REM are the two
          stages that do the physical and neural repair; efficiency and
          disturbances say whether the hours in bed were worth having. */
    const deepNow = mean(readMorning("deep", 14));
    const remNow = mean(readMorning("rem", 14));
    const asleepNow = mean(readMorning("asleep", 14));
    const restorativePct = deepNow && remNow && asleepNow
      ? Math.round(((deepNow + remNow) / asleepNow) * 100) : null;
    const effNow = mean(readMorning("sleepEff", 14));
    const disturbNow = mean(readMorning("disturbances", 14));

    /* 3. Sleep debt — the gap between what WHOOP says she needed and got. */
    const debtNow = mean(readMorning("sleepDebt", 7));

    /* 4. Cardiac work per session: how high her heart actually goes, and
          whether the same strain now costs fewer beats. */
    const maxHrNow = mean(readMorning("maxHr", 28));
    const avgHrNow = mean(readMorning("avgHr", 28));
    const avgHrPrev = (() => {
      const out = [];
      for (let i = 28; i < 56; i++) {
        const v = Number(morning?.[addDays(t, -i)]?.avgHr);
        if (v > 0) out.push(v);
      }
      return mean(out);
    })();
    const cardiacDrift = avgHrNow && avgHrPrev ? Math.round(avgHrNow - avgHrPrev) : null;


    const MDC = { load: FX.mdcLoad, time: FX.mdcTime, reps: FX.mdcReps, balance: FX.mdcBalance };
    const noiseFor = (m) => m.type === "time" ? MDC.time
      : m.cap === "balance" ? MDC.balance
      : m.type === "weightreps" ? MDC.load : MDC.reps;
    const realMoves = analysis.filter((m) => m.pct !== null && Math.abs(m.pct) >= noiseFor(m));
    const realUp = realMoves.filter((m) => m.pct > 0);
    const realDown = realMoves.filter((m) => m.pct < 0);

    /* bilateral gap, on any measure that stores both sides */
    const sideRows = fields.weekly.filter((f) => f.bilateral).map((f) => {
      const keys = Object.keys(weekly).sort();
      for (let i = keys.length - 1; i >= 0; i--) {
        const e = weekly[keys[i]];
        const L = Number(e?.[f.id + "__L"]), R = Number(e?.[f.id + "__R"]);
        if (L > 0 && R > 0) {
          const hi = Math.max(L, R), lo = Math.min(L, R);
          return { label: f.label.replace(" L/R", ""), gap: Math.round(((hi - lo) / hi) * 100), weak: L < R ? "left" : "right" };
        }
      }
      return null;
    }).filter(Boolean);
    const worstGap = sideRows.slice().sort((a, b) => b.gap - a.gap)[0] || null;

    /* body composition against the clock */
    const mKeys = Object.keys(monthly).sort();
    const muscleNow = mKeys.length ? Number(monthly[mKeys[mKeys.length - 1]]?.muscle) : NaN;
    const muscleFirst = mKeys.length ? Number(monthly[mKeys[0]]?.muscle) : NaN;
    const monthsSpan = mKeys.length > 1
      ? Math.max(1, Math.round((parse(mKeys[mKeys.length - 1] + "-01") - parse(mKeys[0] + "-01")) / 2592000000)) : 0;
    const expectedLoss = monthsSpan ? (0.75 / 12) * monthsSpan : 0;   /* ~0.75%/yr untrained after 50 */
    const muscleCredit = (muscleNow > 0 && muscleFirst > 0 && monthsSpan)
      ? Math.round(((muscleNow - muscleFirst) + expectedLoss) * 100) / 100 : null;

    /* sleep: we have durations, not bed and wake times, so this is variability
       of hours slept — an honest proxy, not the Sleep Regularity Index */
    const slp = readMorning("asleep", 28);
    const slpMean = mean(slp);
    const slpSD = slp.length > 6 && slpMean
      ? Math.sqrt(slp.reduce((a, v) => a + (v - slpMean) ** 2, 0) / slp.length) : null;

    /* Regularity proper: how much the CLOCK TIMES move, not the durations.
       Circular spread, so 23:50 and 00:10 read as twenty minutes apart. */
    const spreadOf = (key) => {
      const v = readMorning(key, 28);
      if (v.length < 7) return null;
      const rad = v.map((x) => (x / 1440) * 2 * Math.PI);
      const C1 = mean(rad.map(Math.cos)), S1 = mean(rad.map(Math.sin));
      const R = Math.sqrt(C1 * C1 + S1 * S1);
      if (R <= 0 || R >= 1) return 0;
      return Math.round(Math.sqrt(-2 * Math.log(R)) * (1440 / (2 * Math.PI)));  /* minutes */
    };
    const bedSpread = spreadOf("bedAt"), wakeSpread = spreadOf("wakeAt");
    const timingSpread = bedSpread !== null && wakeSpread !== null
      ? Math.round((bedSpread + wakeSpread) / 2) : null;

    /* adherence over quarters */
    const weeksSinceStart = totalSessions ? Math.max(1, Math.round(totalMinutes / 1 > 0 ? weeksHit + (weekRun || 0) : 1)) : 0;
    const quarterHit = weeksHit;

    const chronicPrev = Math.round(loadWindow(28, 28) / 4);
    const chronicGrowth = chronicPrev > 0 ? Math.round(((chronic - chronicPrev) / chronicPrev) * 100) : null;

    /* efficiency: strength moved per unit of load spent */
    const strengthNow = analysis.filter((m) => m.type === "weightreps").reduce((a, m) => a + (m.now || 0), 0);
    const strengthFirst = analysis.filter((m) => m.type === "weightreps").reduce((a, m) => a + (m.first || 0), 0);
    const returnOnLoad = (chronic28 > 0 && strengthFirst > 0)
      ? Math.round(((strengthNow - strengthFirst) / strengthFirst) * 100 / (chronic28 / 1000) * 10) / 10 : null;

    /* shoulder: what it has actually cost */
    const shoulderDays = Object.keys(logs).filter((d) => Number(logs[d]?.shoulder) > 0);
    const shoulderLow = shoulderDays.filter((d) => Number(logs[d].shoulder) <= 3).length;
    const shoulderCost = shoulderDays.length ? Math.round((shoulderLow / shoulderDays.length) * 100) : null;
    const shoulderRecent = shoulderDays.filter((d) => d >= addDays(t, -28));
    const shoulderTrend = shoulderRecent.length >= 3 && shoulderDays.length > shoulderRecent.length
      ? Math.round((mean(shoulderRecent.map((d) => Number(logs[d].shoulder))) -
          mean(shoulderDays.filter((d) => d < addDays(t, -28)).map((d) => Number(logs[d].shoulder)))) * 100) / 100
      : null;

    /* ---- the 24-hour shoulder rule ------------------------------------
       Standard practice for irritable tissue: discomfort during and after
       loading is acceptable up to about 5/10 provided it is back to baseline
       by the next morning. Same-or-better means progress the load; worse
       means step back one. The during-session score can't tell you this. */
    const yesterday = addDays(t, -1);
    const trainedYesterday = !!logs[yesterday]?.completed;
    const shoulderAM = morning?.[t]?.shoulderAM || "";
    const shoulderPM = logs[yesterday]?.shoulder || "";
    const shoulderVerdict = (() => {
      if (!trainedYesterday || !shoulderAM) return null;
      const am = Number(shoulderAM), pm = Number(shoulderPM) || null;
      /* Compare against the session BEFORE deciding it is clear. A 5 during
         the session followed by a 4 this morning is worse, not clear — and the
         old order short-circuited on `am >= 4` and told her to add load to a
         rehabilitating joint that had gone backwards overnight. The whole point
         of this rule is the comparison, so the comparison goes first. */
      if (pm && am < pm) return { key: "back", color: C.clay,
        text: "A little worse this morning than it was during the session. Not alarming, but it's the signal to hold the load where it is rather than adding to it — the morning reading is the one that decides." };
      if (am >= 4) return { key: "clear", color: C.moss,
        text: "Back to baseline overnight. That load was right — you can go up a step next time it comes round." };
      if (pm && am >= pm) return { key: "ok", color: C.moss,
        text: "No worse this morning than it was during the session. The shoulder tolerated it. Hold this load rather than adding." };
      if (am === 3) return { key: "hold", color: C.ochre,
        text: "Still grumbling this morning. Not a problem, but not a green light either — repeat the same load rather than progressing." };
      return { key: "back", color: C.clay,
        text: "Worse this morning than before you started. That's the signal to step back one level on overhead work, not to push through it." };
    })();
    const amReadings = Object.keys(morning).filter((d) => morning[d]?.shoulderAM);
    const amRecent = amReadings.filter((d) => d >= addDays(t, -28));
    const shoulderAMTrend = amRecent.length >= 3
      ? Math.round(mean(amRecent.map((d) => Number(morning[d].shoulderAM))) * 100) / 100 : null;

    /* functional age, from the sit-to-stand style measures we hold */
    const balanceM = analysis.find((m) => m.id === "balance");
    const squatM = analysis.find((m) => m.id === "squat");


    /* ---- MORE PATTERNS -------------------------------------------------
       All computed from what is already stored. Each one answers a question
       she can act on; none of them need anything new logged. */

    /* 1. Does she do what the coach picks? The swaps are revealed preference —
          what she avoids without ever saying so. */
    const swaps = (() => {
      const rows = [];
      for (let i = 0; i < 84; i++) {
        const d = addDays(t, -i);
        const l = logs[d];
        if (!l?.completed || !l.prescribed || !l.type) continue;
        rows.push({ date: d, asked: l.prescribed, did: l.type, kept: l.prescribed === l.type });
      }
      if (rows.length < 5) return null;
      const kept = rows.filter((r) => r.kept).length;
      const avoided = {}; const chosen = {};
      rows.filter((r) => !r.kept).forEach((r) => {
        avoided[r.asked] = (avoided[r.asked] || 0) + 1;
        chosen[r.did] = (chosen[r.did] || 0) + 1;
      });
      const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0] || null;
      return { n: rows.length, pct: Math.round((kept / rows.length) * 100),
        avoided: top(avoided), chosen: top(chosen) };
    })();

    /* 2. How much she writes. Disengagement shows in the writing before it
          shows in the training — this is the earliest warning available. */
    const writing = (() => {
      const count = (from, days) => {
        let n = 0;
        for (let i = from; i < from + days; i++) {
          const d = addDays(t, -i);
          const l = logs[d] || {};
          if ((l.sessionNote || "").trim() || (l.did || "").trim()) n++;
          /* Only what SHE wrote. `notes[date]` is the line the app writes TO
             her — one every day she opens it, from a pool of 101. Counting
             those gave this metric a floor of about fourteen that the app
             supplied itself, which masked exactly the collapse in her own
             writing it exists to catch. */
          if (data.notes?.[d]?.kept && (data.notes[d].text || "").trim()) n++;
        }
        (data.journal || []).forEach((j) => {
          if (j.date <= addDays(t, -from) && j.date > addDays(t, -(from + days))) n++;
        });
        (data.chats || []).forEach((c) => {
          if (c.date <= addDays(t, -from) && c.date > addDays(t, -(from + days))) n++;
        });
        return n;
      };
      const now = count(0, 14), before = count(14, 14);
      if (before < 3) return null;
      return { now, before, drop: Math.round(((now - before) / before) * 100) };
    })();

    /* 3. Do her restarts last longer than they used to? The best single
          measure of whether any of this is working. */
    const restarts = (() => {
      const runs = [];
      let run = 0, started = null;
      for (let i = 200; i >= 0; i--) {
        const d = addDays(t, -i);
        if (blockFor(d, program, isScheduled)?.id === "rest") continue;
        if (logs[d]?.completed) { if (!started) started = d; run++; }
        else if (run > 0) { runs.push({ len: run, from: started }); run = 0; started = null; }
      }
      if (run > 0) runs.push({ len: run, from: started, current: true });
      if (runs.length < 3) return null;
      const half = Math.floor(runs.length / 2);
      const early = runs.slice(0, half), late = runs.slice(half);
      const avg = (a) => a.reduce((x, y) => x + y.len, 0) / a.length;
      return { runs: runs.length, longest: Math.max(...runs.map((r) => r.len)),
        current: runs[runs.length - 1]?.current ? runs[runs.length - 1].len : 0,
        earlyAvg: Math.round(avg(early) * 10) / 10, lateAvg: Math.round(avg(late) * 10) / 10,
        improving: avg(late) > avg(early) };
    })();

    /* 4. Which session lengths she actually completes. */
    const byDuration = (() => {
      const buckets = { short: { n: 0, mins: 0 }, mid: { n: 0, mins: 0 }, long: { n: 0, mins: 0 } };
      for (let i = 0; i < 84; i++) {
        const l = logs[addDays(t, -i)];
        if (!l?.completed) continue;
        const m = Number(l.minutes) || 0;
        const k = m <= 30 ? "short" : m <= 45 ? "mid" : "long";
        buckets[k].n++; buckets[k].mins += m;
      }
      const total = buckets.short.n + buckets.mid.n + buckets.long.n;
      if (total < 8) return null;
      const rows = Object.entries(buckets).map(([k, v]) => ({ k, n: v.n, share: Math.round((v.n / total) * 100) }));
      return { rows, favourite: [...rows].sort((a, b) => b.n - a.n)[0], total };
    })();

    /* 5. Where in a block she dips. If it is always week three, the coach can
          build the easier week in rather than discovering it. */
    const blockCurve = (() => {
      if (!livePhase || programWeek === null) return null;
      const byWeek = [0, 0, 0, 0, 0].map(() => ({ done: 0, sched: 0 }));
      for (let i = 0; i < 140; i++) {
        const d = addDays(t, -i);
        const wk = programWeekOf(d, program);
        if (wk === null) continue;
        const ph = programPhases.find((x) => wk >= x.from && wk <= x.to);
        if (!ph) continue;
        const inBlock = Math.min(4, wk - ph.from);
        if (blockFor(d, program, isScheduled)?.id === "rest") continue;
        byWeek[inBlock].sched++;
        if (logs[d]?.completed) byWeek[inBlock].done++;
      }
      const rows = byWeek.map((b, i) => ({ week: i + 1, ...b,
        pct: b.sched >= 3 ? Math.round((b.done / b.sched) * 100) : null })).filter((r) => r.pct !== null);
      if (rows.length < 3) return null;
      const worst = [...rows].sort((a, b) => a.pct - b.pct)[0];
      const best = [...rows].sort((a, b) => b.pct - a.pct)[0];
      return { rows, worst, best, spread: best.pct - worst.pct };
    })();

    /* 6. Her own delayed-fatigue window: does a hard day cost her tomorrow,
          or the day after? */
    const domsLag = (() => {
      const hard = [];
      for (let i = 3; i < 84; i++) {
        const d = addDays(t, -i);
        const l = logs[d];
        if (!l?.completed) continue;
        const ld = (Number(l.minutes) || 0) * (Number(l.rpe) || 0);
        if (ld < 300) continue;
        const rec = (n) => Number(morning?.[addDays(d, n)]?.recovery) || null;
        const base = Number(morning?.[d]?.recovery) || null;
        if (!base) continue;
        const r1 = rec(1), r2 = rec(2);
        if (r1) hard.push({ lag: 1, delta: r1 - base });
        if (r2) hard.push({ lag: 2, delta: r2 - base });
      }
      if (hard.length < 8) return null;
      const at = (n) => {
        const sub = hard.filter((h) => h.lag === n);
        return sub.length >= 4 ? Math.round(mean(sub.map((h) => h.delta))) : null;
      };
      const d1 = at(1), d2 = at(2);
      if (d1 === null || d2 === null) return null;
      return { d1, d2, worst: d2 < d1 ? 2 : 1 };
    })();

    /* 7. What each class actually costs her, from the morning after. */
    const costByClass = (() => {
      const map = {};
      for (let i = 1; i < 84; i++) {
        const d = addDays(t, -i);
        const l = logs[d];
        if (!l?.completed || !l.type) continue;
        const before = Number(morning?.[d]?.recovery);
        const after = Number(morning?.[addDays(d, 1)]?.recovery);
        if (!(before > 0 && after > 0)) continue;
        (map[l.type] = map[l.type] || []).push(after - before);
      }
      const rows = Object.entries(map).filter(([, v]) => v.length >= 3)
        .map(([name, v]) => ({ name, delta: Math.round(mean(v)), n: v.length }))
        .sort((a, b) => a.delta - b.delta);
      return rows.length >= 2 ? rows : null;
    })();

    /* 8. The days she does more than she was asked. */
    const extraDays = (() => {
      const rows = [];
      for (let i = 0; i < 56; i++) {
        const d = addDays(t, -i);
        const l = logs[d];
        if (!l?.completed) continue;
        if ((l.extraSessions || []).length || (l.extras || []).length)
          rows.push({ date: d, dow: parse(d).getDay() });
      }
      if (rows.length < 4) return null;
      const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const counts = {};
      rows.forEach((r) => { counts[r.dow] = (counts[r.dow] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return { n: rows.length, day: DOW[Number(top[0])], dayN: top[1] };
    })();

    /* 9. Time of day — one tap, and it answers when she actually trains. */
    const byTimeOfDay = (() => {
      const slots = { morning: { done: 0 }, midday: { done: 0 }, evening: { done: 0 } };
      let total = 0;
      for (let i = 0; i < 84; i++) {
        const l = logs[addDays(t, -i)];
        if (!l?.completed || !l.when || !slots[l.when]) continue;
        slots[l.when].done++; total++;
      }
      if (total < 6) return null;
      const rows = Object.entries(slots).map(([k, v]) => ({ slot: k, n: v.done,
        share: Math.round((v.done / total) * 100) })).sort((a, b) => b.n - a.n);
      return { rows, best: rows[0], total };
    })();


    /* ---- WHAT THE COACH HAS LEARNED ABOUT HER ---------------------------
       Two sources, one list.

       OBSERVED is arithmetic, recomputed every render from what she has
       actually done and the reasons she gave. It never needs writing down
       because it is always current, it works with no key and no signal, and it
       cannot drift out of date. Tier one.

       STORED is `data.profile` — entries the model wrote after a conversation,
       and entries she wrote or corrected herself. Those need persisting
       because nothing recomputes them. Tier two, plus her.

       Confidence is EARNED, and this is the rule that stops one bad morning
       becoming a permanent belief about her:

         noted      said or seen once      the coach does not act on it
         tentative  twice, or once + behaviour agreeing
         believed   three or more

       Anything she wrote herself is `hers` and outranks everything inferred,
       at any confidence. Nothing here becomes a rule: a believed preference
       changes the ORDER the coach picks in, never what is available. A class
       she disliked once still appears — it stops being first. */
    const confidenceOf = (n) => (n >= 3 ? "believed" : n >= 2 ? "tentative" : "noted");

    const whyEntries = Object.keys(logs)
      .filter((d) => logs[d]?.why?.reason)
      .map((d) => ({ date: d, ...logs[d].why }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const observed = (() => {
      const out = [];
      const add = (id, kind, claim, evidence) => {
        if (!evidence.length) return;
        out.push({ id, kind, claim, evidence, source: "did",
          confidence: confidenceOf(evidence.length), status: "active", computed: true });
      };

      /* why she actually stops — counted, not guessed (rule 16) */
      const byTag = {};
      whyEntries.forEach((w) => {
        const tag = whyTag(w.kind || "skip", w.reason);
        (byTag[tag] = byTag[tag] || []).push(w);
      });
      const TAG_CLAIM = {
        motivation: "When you miss, it is usually motivation rather than your body",
        time: "When you miss, it is usually time rather than not wanting to",
        tired: "Tiredness is what stops you most often",
        body: "Your body is what stops you most often",
        dislike: "You skip when you don't like what was prescribed",
        chosen: "You choose rest deliberately rather than drifting out of it",
        away: "Being away from home is what interrupts you",
      };
      Object.entries(byTag).forEach(([tag, list]) => {
        if (!TAG_CLAIM[tag] || list.length < 2) return;
        add(`why-${tag}`, "barrier", TAG_CLAIM[tag],
          list.slice(0, 6).map((w) => ({ date: w.date, source: "said",
            quote: whyLabel(w.kind || "skip", w.reason) })));
      });

      /* what she swaps out of — revealed preference beats anything said once */
      if (swaps && swaps.avoided && swaps.avoided[1] >= 2)
        add("swap-avoid", "preference", `You swap out of ${swaps.avoided[0]} more than anything else`,
          Array.from({ length: swaps.avoided[1] }, () => ({ date: t, source: "did", quote: swaps.avoided[0] })));
      if (swaps && swaps.chosen && swaps.chosen[1] >= 2)
        add("swap-choose", "preference", `When you change the plan you reach for ${swaps.chosen[0]}`,
          Array.from({ length: swaps.chosen[1] }, () => ({ date: t, source: "did", quote: swaps.chosen[0] })));

      /* THE TIRED-ANYWAY LEDGER. The most useful sentence the app can say, on
         exactly the morning it is needed, entirely from her own history. */
      const tiredAnyway = Object.keys(logs).filter((d) => {
        const l = logs[d];
        if (!l?.completed) return false;
        const m = morning?.[d] || {};
        const rec = Number(m.recovery);
        const rough = (rec > 0 && recBaseline && rec < recBaseline - 5) || l.mood === "tired" || l.mood === "flat" || l.mood === "low";
        return rough && (l.energyAfter !== undefined || l.during !== undefined);
      });
      const better = tiredAnyway.filter((d) => Number(logs[d].energyAfter) >= 4 || Number(logs[d].during) >= 4);
      if (tiredAnyway.length >= 3)
        add("tired-anyway", "response",
          `You have trained ${tiredAnyway.length} times when you felt rough, and felt better afterwards ${better.length} of them`,
          tiredAnyway.slice(0, 8).map((d) => ({ date: d, source: "did", quote: logs[d].type || "session" })));

      /* the weekday that reliably costs her — already computed, never used */
      (learned?.brakes || []).forEach((b, i) =>
        add(`brake-${i}`, "barrier", b, [{ date: t, source: "did", quote: b }, { date: t, source: "did", quote: b }]));
      (learned?.motivators || []).forEach((m, i) =>
        add(`motiv-${i}`, "motivator", m, [{ date: t, source: "did", quote: m }, { date: t, source: "did", quote: m }]));

      return out;
    })();

    const storedProfile = (data.profile || []).map((p) => ({
      ...p,
      confidence: p.hers ? "believed" : confidenceOf((p.evidence || []).length),
      computed: false,
    }));

    /* One list. Hers first, then what the model concluded, then arithmetic. */
    const profile = [
      ...storedProfile.filter((p) => p.hers),
      ...storedProfile.filter((p) => !p.hers),
      ...observed,
    ].filter((p) => p.status !== "retired");
    const profileBelieved = profile.filter((p) => p.confidence === "believed" || p.hers);
    /* The most recent decision the app cannot explain. Only ever one, only
       within the last few days, and only where something actually happened —
       never on an ordinary day, and gone tomorrow whether or not she answers. */
    const whyDue = (() => {
      for (let i = 1; i <= 3; i++) {
        const d = addDays(t, -i);
        const l = logs[d] || {};
        if (l.why) continue;
        if (l.completed && l.prescribed && l.type && l.prescribed !== l.type)
          return { date: d, kind: "swap", was: l.prescribed, did: l.type };
        if (!l.completed && l.state !== "moved" && missableDay(d) && d >= (firstSession || d))
          return { date: d, kind: "skip" };
      }
      return null;
    })();


    const M = (o) => ({ key: false, group: "week", ...o });

    const more = [
      M({ group: "day", id: "readiness", label: "Readiness", scope: "this morning",
        display: recValue ? String(recValue) : "—",
        sub: recovery ? recovery.label : "no reading yet", color: recovery?.color || C.muted,
        plain: "Today's recovery score, judged against your own thirty-day median rather than WHOOP's scale.",
        how: "Your recovery today, compared with the middle value of your last thirty days. Bands are set on your numbers, not a population average.",
        meaning: `Your own median sits near ${recBaseline}. A 55 is an ordinary day for you even though it looks middling on WHOOP's dial — which is exactly why the app judges you against yourself. This decides how hard today's class goes, not whether it happens.`,
        need: recValue ? null : "Type this morning's recovery into the card at the top of Today, or import your WHOOP export — either fills this in." }),

      ...(settings.shoulderInjury ? [
      M({ group: "day", id: "shoulder", label: "Shoulder", scope: "all sessions logged",
        display: shoulderCost === null ? "—" : `${100 - shoulderCost}%`,
        sub: shoulderTrend === null ? "needs more history"
          : shoulderTrend > 0.2 ? "improving" : shoulderTrend < -0.2 ? "worse" : "steady",
        color: shoulderCost === null ? C.muted : shoulderCost < 20 ? C.moss : shoulderCost < 40 ? C.ochre : C.clay,
        plain: "The share of sessions where your shoulder was comfortable, and whether that share is rising.",
        how: "Sessions with a comfort score of 4 or 5, as a percentage of all sessions where you recorded one. The trend compares the last 28 days with everything before.",
        meaning: `This turns the shoulder from a permanent label into a number with a direction. ${shoulderTrend > 0.2 ? "It is getting better, which is what you said would happen." : "What matters is not today's score but whether the line is moving."} The decision rule now runs on the NEXT MORNING reading, which is the standard for irritable tissue: same or better than before the session means the load was right and can go up; worse means step back one. ${shoulderAMTrend !== null ? `Your morning-after scores are averaging ${shoulderAMTrend} out of 5.` : "It asks you the morning after any day you trained."}`,
        need: shoulderCost === null ? "Needs shoulder comfort scores. The app asks for one the morning after each day you train." : null })] : []),

      M({ group: "week", id: "autonomic", label: "Autonomic", scope: "7 days vs 28",
        display: rhrDrift === null ? "—" : `${rhrDrift > 0 ? "+" : ""}${Math.round(rhrDrift)}`,
        sub: rhrDrift === null ? "needs 28 days of WHOOP"
          : rhrDrift <= -2 ? "settling" : rhrDrift >= 3 ? "elevated" : "stable",
        color: rhrDrift === null ? C.muted : rhrDrift <= -2 ? C.moss : rhrDrift >= 3 ? C.ochre : C.ink,
        plain: "Your resting heart rate this week against your own month, in beats per minute.",
        how: "Mean resting heart rate over 7 days minus the mean over 28 days. Weekly, never daily — single-morning readings are mostly noise.",
        meaning: `Your resting heart rate currently sits around the mid-sixties and your HRV in the low twenties — that is your starting line, not a verdict, and aerobic work is what moves both. A rise of three or more beats held for a week usually means sleep, stress or illness rather than training; a fall sustained across months is the clearest evidence training is working. ${hrvDrift !== null ? `Your heart rate variability is running ${Math.round(hrvDrift)}% against its month.` : ""}`,
        need: rhrDrift === null ? "Needs about four weeks of imported WHOOP history." : null }),

      M({ group: "week", id: "sleep", label: "Sleep regularity", scope: "last 28 days",
        display: timingSpread === null ? (slpSD === null ? "—" : `${Math.round(slpSD / 60 * 10) / 10}h`)
          : `${Math.round(timingSpread / 6) / 10}h`,
        sub: timingSpread === null ? (slpSD === null ? "needs WHOOP history" : "duration only — reimport for timing")
          : timingSpread < 45 ? "very regular" : timingSpread < 75 ? "reasonable" : "scattered",
        color: timingSpread === null ? C.muted
          : timingSpread < 45 ? C.moss : timingSpread < 75 ? C.ink : C.ochre,
        plain: "How much your bedtime and wake time drift from night to night.",
        how: "Circular spread of your sleep-onset and wake times across 28 days, averaged. Circular so that 23:50 and 00:10 count as twenty minutes apart, not twenty-three hours.",
        meaning: `You sleep about nine hours, which is plenty. Whether you sleep them at the same time turns out to matter more: across sixty thousand people, sleep regularity predicted mortality more strongly than sleep duration did, with the most regular groups showing 20–48% lower all-cause risk. ${timingSpread !== null ? `Your timing moves by about ${Math.round(timingSpread / 6) / 10} hours night to night.` : ""} Pulling that under an hour is worth more to you than an extra session.`,
        need: timingSpread === null ? "Re-import your WHOOP export — the app now keeps bed and wake times, which earlier imports discarded." : null }),

      M({ group: "day", id: "illness", label: "Early warning", scope: "temperature, breathing, oxygen",
        display: tempBase === null && respBase === null ? "—" : illnessFlags.length ? String(illnessFlags.length) : "clear",
        sub: !illnessFlags.length ? "nothing moving" : illnessFlags.join(", "),
        color: !illnessFlags.length ? C.moss : illnessFlags.length > 1 ? C.clay : C.ochre,
        plain: "Whether skin temperature, breathing rate and blood oxygen are drifting together.",
        how: "Three-day average against your own 28-day baseline. Skin temperature up 0.4°C, breathing rate up 1 breath per minute, or blood oxygen under 95% each count as one flag.",
        meaning: `No single one of these means much — bodies fluctuate. Two moving together is the pattern that tends to precede feeling unwell by a day or two, which is the useful bit: it lets you take the easy version of a session before you know you needed to, rather than training through the start of something. ${illnessFlags.length ? `Right now: ${illnessFlags.join(" and ")}.` : "Nothing is moving at the moment."}`,
        need: tempBase === null ? "Needs about four weeks of WHOOP history for a baseline." : null }),

      M({ group: "week", id: "sleepquality", label: "Restorative sleep", scope: "deep + REM share",
        display: restorativePct === null ? "—" : `${restorativePct}%`,
        sub: restorativePct === null ? "needs WHOOP history"
          : restorativePct >= 40 ? "strong" : restorativePct >= 30 ? "adequate" : "light",
        color: restorativePct === null ? C.muted : restorativePct >= 40 ? C.moss : restorativePct >= 30 ? C.ink : C.ochre,
        plain: "How much of your sleep is deep or REM rather than light.",
        how: "Deep plus REM minutes as a share of total sleep, averaged over 14 nights.",
        meaning: `Nine hours of mostly light sleep does less than seven hours with a good deep and REM share. Deep sleep is when physical repair happens — the part that matters after a strength day — and REM is where the nervous system recovers. Around 40% of the night in the two together is a good share for an adult. ${effNow ? `Your sleep efficiency is ${Math.round(effNow)}%${disturbNow ? `, with about ${Math.round(disturbNow)} disturbances a night` : ""}.` : ""}`,
        need: restorativePct === null ? "Needs imported WHOOP sleep data." : null }),

      M({ group: "week", id: "sleepdebt", label: "Sleep debt", scope: "last 7 nights",
        display: debtNow === null ? "—" : `${Math.round(debtNow / 6) / 10}h`,
        sub: debtNow === null ? "needs WHOOP history"
          : debtNow < 30 ? "paid off" : debtNow < 90 ? "manageable" : "accumulating",
        color: debtNow === null ? C.muted : debtNow < 30 ? C.moss : debtNow < 90 ? C.ink : C.ochre,
        plain: "How far behind your own sleep need you are running.",
        how: "WHOOP's calculated sleep debt, averaged across seven nights. It compares what your body needed, given recent strain, against what you actually got.",
        meaning: "This is the number that explains a bad recovery score when nothing else does. Debt accumulates quietly across a week and then shows up as a flat, heavy day you can't account for. It is also the most fixable thing on this whole list — an earlier bedtime clears it faster than any training change.",
        need: debtNow === null ? "Needs imported WHOOP sleep data." : null }),

      M({ group: "month", id: "cardiac", label: "Working heart rate", scope: "this month vs last",
        display: avgHrNow === null ? "—" : String(Math.round(avgHrNow)),
        sub: cardiacDrift === null ? "needs two months"
          : cardiacDrift <= -2 ? `${Math.abs(cardiacDrift)} bpm lower` : cardiacDrift >= 2 ? `${cardiacDrift} bpm higher` : "steady",
        color: cardiacDrift === null ? C.muted : cardiacDrift <= -2 ? C.moss : cardiacDrift >= 2 ? C.ochre : C.ink,
        plain: "Your average heart rate across the day, and whether it is falling.",
        how: "Mean of WHOOP's daily average heart rate over 28 days, against the 28 days before. Max heart rate is shown alongside for context.",
        meaning: `Resting heart rate tells you about recovery; this tells you about the work. If your average day costs fewer beats than it did a month ago while you are doing the same or more, your heart has got better at the job. ${maxHrNow ? `Your daily maximum averages ${Math.round(maxHrNow)}, which is the ceiling your hard sessions are reaching.` : ""}`,
        need: avgHrNow === null ? "Needs imported WHOOP data across two months." : null }),

      M({ group: "week", id: "habit", label: "Habit strength", scope: "how automatic this has become",
        display: habitStrength === null ? "—" : `${habitStrength}%`,
        sub: habitStrength === null ? "needs a few weeks"
          : habitStrength >= 75 ? "close to automatic" : habitStrength >= 45 ? "forming" : "early",
        color: habitStrength === null ? C.muted : habitStrength >= 75 ? C.moss : C.ink,
        plain: "How far training has moved from a decision to a default.",
        how: "Three parts: how long you have been repeating it against the roughly three months exercise takes to become automatic, how consistently you train on the same days, and your 28-day consistency. This is a description of habit formation, not a plan — your programme is still designed one month at a time.",
        meaning: "The research here is unusually specific and unusually reassuring. Habits take a median of 66 days to form and about 91 days for exercise — so if it still feels like effort at week six, that is the normal timeline, not a failure of will. The same work also found that missing one opportunity does not measurably damage the process. What does damage it is missing repeatedly in the same week. This number climbs fastest when you train on the same days rather than fitting sessions in wherever they land.",
        need: habitStrength === null ? "Needs about two weeks of logging." : null }),

      M({ group: "week", id: "cue", label: "Same days", scope: "cue consistency",
        display: cueConsistency === null ? "—" : `${cueConsistency}%`,
        sub: cueConsistency === null ? "needs two weeks"
          : cueConsistency >= 80 ? "strong routine" : cueConsistency >= 60 ? "loose routine" : "scattered",
        color: cueConsistency === null ? C.muted : cueConsistency >= 80 ? C.moss : C.ochre,
        plain: "How much of your training lands on the same days each week.",
        how: "The share of your sessions over eight weeks falling on your four most-used weekdays.",
        meaning: "A stable cue is what turns a behaviour automatic — the same days, ideally the same time, attached to something that already happens. Scattered training can still be plenty of training, but it stays a decision every single time, and decisions are what run out on the days you are tired. This is the cheapest change available to you: not more sessions, just more predictable ones.",
        need: cueConsistency === null ? "Needs two weeks of sessions." : null }),

      M({ group: "month", id: "feels", label: "How it feels", scope: "during, not after",
        display: affectMean === null ? "—" : `${affectMean > 0 ? "+" : ""}${affectMean}`,
        sub: affectMean === null ? "needs three sessions"
          : affectMean >= 1 ? "good in the room" : affectMean >= 0 ? "neutral" : "harder than it should be",
        color: affectMean === null ? C.muted : affectMean >= 0.5 ? C.moss : affectMean < 0 ? C.ochre : C.ink,
        plain: "How training feels while you are doing it, on a scale of minus two to plus two.",
        how: "Your during-session rating averaged over 28 days, and broken down by class.",
        meaning: `This is the most under-rated number in the app. How exercise feels DURING predicts whether you keep doing it; how it feels afterwards does not. One study found each point of positive in-session feeling was worth about forty extra minutes of training a week a year later. So this is not a comfort metric — it is an adherence metric. ${affectByClass.length ? `Your best so far: ${affectByClass[0].name} at ${affectByClass[0].score > 0 ? "+" : ""}${affectByClass[0].score}.${affectByClass.length > 1 && affectByClass[affectByClass.length - 1].score < 0 ? ` Your hardest: ${affectByClass[affectByClass.length - 1].name}.` : ""}` : ""}`,
        need: affectMean === null ? "Tap how it felt during your next few sessions." : null }),

      M({ group: "week", id: "mobility", label: "Mobility", scope: "across seven tests",
        display: mobScore === null ? "—" : `${mobScore}%`,
        sub: mobScore === null ? "no test logged yet"
          : mobAsym.length ? `${mobAsym[0].label} ${mobAsym[0].gapPct}% apart`
          : mobWeakest.length ? `shortest: ${mobWeakest[0].label}` : "even",
        color: mobScore === null ? C.muted : mobScore >= 75 ? C.moss : mobScore >= 50 ? C.ink : C.ochre,
        plain: "How freely your body moves, across seven tests of range rather than strength.",
        how: "Each test scored against a full range, averaged. Sit-to-rise, forward fold, overhead reach, behind-the-back reach, ankle to wall, seated rotation and cross-legged sit. Four are measured left and right.",
        meaning: `Strength keeps muscle; range keeps what you can do with it. These are the movements that quietly disappear without anyone noticing, because nothing tests them until the day you need one. ${mobWeakest.length ? `Your shortest right now is ${mobWeakest[0].label.toLowerCase()}, which is why it drives your daily ten minutes.` : ""}${mobAsym.length ? ` Your ${mobAsym[0].label.toLowerCase()} is ${mobAsym[0].gapPct}% apart side to side — closing that matters more than improving either side alone.` : ""}`,
        need: mobScore === null ? "Take the mobility battery — about ten minutes." : null }),

      M({ group: "month", id: "swaps", label: "Coach vs you", scope: "how often you keep the pick",
        display: swaps === null ? "—" : `${swaps.pct}%`,
        sub: swaps === null ? "needs a few weeks"
          : swaps.avoided ? `most swapped: ${swaps.avoided[0]}` : "you keep the pick",
        color: swaps === null ? C.muted : C.ink,
        plain: "How often you do the class the coach picked, and what you swap it for.",
        how: "Compares the prescribed class against what you actually logged, over twelve weeks.",
        meaning: `The swaps are the honest part. What you quietly avoid says more than anything you'd tell me if I asked directly. ${swaps?.avoided ? `You swap out of ${swaps.avoided[0]} more than anything else${swaps.chosen ? `, usually for ${swaps.chosen[0]}` : ""} — worth deciding whether that class earns its place at all, rather than it sitting there being skipped.` : ""} A low number here isn't disobedience, it's information I should be using.`,
        need: swaps === null ? "Needs a few weeks of logged sessions." : null }),

      M({ group: "week", id: "writing", label: "How much you write", scope: "14 days vs the 14 before",
        display: writing === null ? "—" : String(writing.now),
        sub: writing === null ? "needs history"
          : writing.drop <= -40 ? "well down" : writing.drop >= 20 ? "up" : "steady",
        color: writing === null ? C.muted : writing.drop <= -40 ? C.ochre : C.moss,
        plain: "How many notes, entries and conversations you've added lately.",
        how: "Session notes, daily notes, journal entries and conversations in the last fortnight, against the fortnight before.",
        meaning: "This is the earliest warning the app has. Engagement drops in the writing before it drops in the training — usually a couple of weeks before. It is not a target and you are not expected to write more; it is simply the thing I watch to know whether to ask how you're doing.",
        need: writing === null ? "Needs a month of history." : null }),

      M({ group: "month", id: "restarts", label: "How restarts hold", scope: "run length over time",
        display: restarts === null ? "—" : String(restarts.lateAvg),
        sub: restarts === null ? "needs three runs"
          : restarts.improving ? `up from ${restarts.earlyAvg}` : `was ${restarts.earlyAvg}`,
        color: restarts === null ? C.muted : restarts.improving ? C.moss : C.ink,
        plain: "How many sessions a run lasts before a gap, and whether that's growing.",
        how: "Every unbroken run of sessions since you started, split into your earlier half and your later half.",
        meaning: `Everyone stops sometimes. The question that decides the year is whether each restart holds longer than the last one did. ${restarts ? `Your longest run is ${restarts.longest}${restarts.current ? `, and you're ${restarts.current} into the current one` : ""}.` : ""} This is the number I'd keep if I could only keep one.`,
        need: restarts === null ? "Needs at least three runs of sessions." : null }),

      M({ group: "month", id: "duration", label: "Session length", scope: "what you actually finish",
        display: byDuration === null ? "—" : `${byDuration.favourite.share}%`,
        sub: byDuration === null ? "needs eight sessions"
          : `${byDuration.favourite.k === "short" ? "30 min or under" : byDuration.favourite.k === "mid" ? "31–45 min" : "over 45 min"} is your default`,
        color: byDuration === null ? C.muted : C.ink,
        plain: "Which session lengths you complete most.",
        how: "Your completed sessions grouped into short, medium and long, over twelve weeks.",
        meaning: "A plan built around a length you reliably do beats a better plan built around one you don't. If your completions cluster at thirty minutes, that is what the block should be made of — the extra fifteen minutes you never do is worth nothing.",
        need: byDuration === null ? "Needs eight logged sessions." : null }),

      M({ group: "month", id: "blockcurve", label: "Where you dip", scope: "week within a block",
        display: blockCurve === null ? "—" : `wk ${blockCurve.worst.week}`,
        sub: blockCurve === null ? "needs two blocks" : `${blockCurve.worst.pct}% vs ${blockCurve.best.pct}% at best`,
        color: blockCurve === null ? C.muted : blockCurve.spread >= 25 ? C.ochre : C.ink,
        plain: "Which week of a block your sessions go missing.",
        how: "Completion rate by position within a block, across every block so far.",
        meaning: `Most people have one. ${blockCurve ? `Yours is week ${blockCurve.worst.week}, at ${blockCurve.worst.pct}% against ${blockCurve.best.pct}% in your best week.` : ""} Once it's known it stops being a failure and becomes a design input — the easier week gets built in there deliberately instead of happening anyway.`,
        need: blockCurve === null ? "Needs two blocks of history." : null }),

      M({ group: "week", id: "doms", label: "When it catches up", scope: "your own delay",
        display: domsLag === null ? "—" : `day ${domsLag.worst}`,
        sub: domsLag === null ? "needs WHOOP and effort scores"
          : `${Math.abs(domsLag.worst === 1 ? domsLag.d1 : domsLag.d2)} points down`,
        color: domsLag === null ? C.muted : C.ink,
        plain: "Whether a hard session costs you the next morning or the one after.",
        how: "Recovery change one and two days after every session over 300 load, averaged.",
        meaning: `Textbooks say soreness peaks between one and two days, but yours is a specific number and it decides how sessions should be spaced. ${domsLag ? `For you it lands hardest on day ${domsLag.worst} — so the day after a hard one isn't the problem${domsLag.worst === 2 ? ", the one after that is" : ""}.` : ""}`,
        need: domsLag === null ? "Needs effort scores and WHOOP across several hard sessions." : null }),

      M({ group: "month", id: "classcost", label: "What each class costs", scope: "recovery, morning after",
        display: costByClass === null ? "—" : String(costByClass.length),
        sub: costByClass === null ? "needs WHOOP history"
          : `${costByClass[0].name} costs most`,
        color: costByClass === null ? C.muted : C.ink,
        plain: "The recovery cost of each class, measured rather than assumed.",
        how: "Recovery the morning after each class against the morning of, averaged per class over twelve weeks.",
        meaning: `Every class in the library carries a cost rating I assigned. This is what they actually cost you, which is the only version that matters. ${costByClass ? `Hardest on you: ${costByClass[0].name} at ${costByClass[0].delta} points. Easiest: ${costByClass[costByClass.length - 1].name} at ${costByClass[costByClass.length - 1].delta > 0 ? "+" : ""}${costByClass[costByClass.length - 1].delta}.` : ""}`,
        need: costByClass === null ? "Needs WHOOP across several sessions of the same class." : null }),

      M({ group: "month", id: "extras", label: "When you do more", scope: "add-ons beyond the session",
        display: extraDays === null ? "—" : String(extraDays.n),
        sub: extraDays === null ? "none logged" : `most often ${extraDays.day}`,
        color: extraDays === null ? C.muted : C.moss,
        plain: "The days you added something beyond what was asked.",
        how: "Counts days with extra sessions or add-ons logged, over eight weeks, and which weekday they cluster on.",
        meaning: "The days you do more than asked are the days something is working — the right class, the right time, enough in the tank. They're worth more attention than the days you missed, because they show what to build more of rather than what to fix.",
        need: extraDays === null ? "Log an add-on and this starts building." : null }),

      M({ group: "month", id: "timeofday", label: "When you train", scope: "morning, midday or evening",
        display: byTimeOfDay === null ? "—" : `${byTimeOfDay.best.share}%`,
        sub: byTimeOfDay === null ? "tap when after a session" : `${byTimeOfDay.best.slot} is your slot`,
        color: byTimeOfDay === null ? C.muted : C.ink,
        plain: "Which part of the day your sessions actually happen in.",
        how: "One tap after each session, counted over twelve weeks.",
        meaning: "A stable time of day is the strongest cue there is for making training automatic — stronger than intention, stronger than motivation. If your sessions cluster somewhere, protecting that slot is worth more than any change to the training itself.",
        need: byTimeOfDay === null ? "Tap when you trained after your next few sessions." : null }),

      M({ group: "year", id: "voice", label: "Patterns in what you say", scope: "your own words, over time",
        display: voicePatterns.length ? String(voicePatterns.length) : voice.length ? "—" : "—",
        sub: !voice.length ? "nothing written yet"
          : voicePatterns.length ? "patterns found" : `${voice.length} entries, no pattern yet`,
        color: voicePatterns.length ? C.signal : C.muted,
        plain: "Recurring themes in everything you have written, and when they cluster.",
        how: "Every dated piece of text you have entered — conversations with the coach, the record, session notes, the journal, daily notes — read for seven recurring themes: not wanting to, low mood, stress, tiredness, pain, feeling strong, wanting more. Each theme is then checked by season, by weekday versus weekend, and against the month before.",
        meaning: `The answers to why momentum goes are almost never in the training data — they are in what you said at the time and forgot. This is the app reading that back. ${voicePatterns.length ? voicePatterns.slice(0, 3).map((v) => v.text).join(" ") : "It needs a stretch of writing before it can say anything honest — and it will say nothing rather than invent a pattern from four entries."}`,
        need: voice.length < 12
          ? `Needs more written down — ${voice.length} entries so far, about twelve before patterns mean anything.`
          : voicePatterns.length ? null
          : `${voice.length} entries read, and no theme repeats often enough to call a pattern. That is an honest nothing, not a gap — it fills in as you write more.` }),

      M({ group: "month", id: "learned", label: "What I've learned", scope: "patterns in you, not in training",
        display: learned.motivators?.length || learned.brakes?.length
          ? String((learned.motivators?.length || 0) + (learned.brakes?.length || 0)) : "—",
        sub: !learned.base ? "needs a few weeks"
          : learned.brakes?.length ? `${learned.brakes.length} thing${learned.brakes.length > 1 ? "s" : ""} slowing you`
          : "nothing slowing you",
        color: learned.motivators?.length ? C.signal : C.muted,
        plain: "The conditions that reliably precede you training, and the ones that precede you not.",
        how: "Twelve weeks of scheduled days, split by what happened before each: which weekday, what your recovery said, how you slept, whether you'd had body work, whether you were coming off a rest day. Anything that shifts your completion rate by fifteen points or more against your own average gets named.",
        meaning: `This is the app learning you rather than learning training. ${learned.motivators?.length ? `What moves you: ${learned.motivators.join("; ")}.` : ""} ${learned.brakes?.length ? `What stops you: ${learned.brakes.join("; ")}.` : ""} None of it is a judgement — it is a description, and it corrects itself as you change. The point is that the coach stops guessing what works for you and starts knowing.`,
        need: !learned.base ? "Needs a few weeks of scheduled days to find patterns."
          : (learned.motivators?.length || learned.brakes?.length) ? null
          : "Nothing has shifted your completion rate by fifteen points yet, so there is nothing worth naming. It fills in as more scheduled days accumulate — silence here is honest, not empty." }),

      M({ group: "month", id: "goals", label: "What you're chasing", scope: "your own goals",
        display: openGoals.length ? String(openGoals.length) : "—",
        sub: !openGoals.length ? "none set yet"
          : (() => {
              const scored = openGoals.filter((g) => (g.scores || []).length >= 2);
              if (!scored.length) return "scored weekly";
              const moved = scored.filter((g) => g.scores.slice(-1)[0].value > g.scores[0].value).length;
              return moved ? `${moved} moving` : "holding";
            })(),
        color: openGoals.length ? C.signal : C.muted,
        plain: "The things you said you want to be able to do, and how close you are.",
        how: "Scored out of ten each week by trying it. The coach reads which body regions and drills each one needs, and builds them into the block.",
        meaning: "This is the part of the app that answers to you rather than to the numbers. A goal here is not a wish — it changes what gets prescribed, it decides part of your daily ten minutes, and it is checked every week so you see the distance closing rather than just passing or failing. It is also, on the adherence evidence, the most durable kind of motivation there is: not a target weight but a capability, and one you chose.",
        need: openGoals.length ? null : "Add something you want to be able to do." }),

      M({ group: "month", id: "gives", label: "What it gives back", scope: "after vs during",
        display: afterMean === null ? "—" : `${afterMean}/5`,
        sub: afterMean === null ? "needs three sessions"
          : givesBack === null ? "how you feel afterwards"
          : givesBack > 0.3 ? "leaves you better" : givesBack < -0.3 ? "costing more than it returns" : "even",
        color: afterMean === null ? C.muted : givesBack > 0.3 ? C.moss : givesBack < -0.3 ? C.ochre : C.ink,
        plain: "How you feel after a session, set against how it felt during.",
        how: "Your after-session energy averaged over 28 days, compared with the during-session rating over the same period.",
        meaning: "Training should leave you better than it found you — not every time, but on average. When sessions consistently feel harder during and flatter afterwards, that is the profile that comes before people stop, and it usually means intensity has crept past where it needs to be rather than anything about willingness. This is the pair of numbers that catches it early, while it is still a small adjustment.",
        need: afterMean === null ? "Log how you felt after a few more sessions." : null }),

      M({ group: "month", id: "barriers", label: "Trained anyway", scope: "last 28 days",
        display: String(barrierWins),
        sub: barrierWins === 0 ? "none yet" : "sessions with something in the way",
        color: barrierWins >= 3 ? C.moss : C.ink,
        plain: "Sessions you completed on days when something was against you.",
        how: "Counts completed sessions on days with low recovery, poor sleep, a sore shoulder, or following a two-day gap.",
        meaning: "Confidence that you can train predicts starting. Confidence that you can train when conditions are bad predicts still being here in a year — that distinction is one of the clearest findings in the adherence literature. Every one of these is evidence that a bad day does not have to cost you the session, and that evidence is what carries you through the weeks that go wrong.",
        need: null }),

      M({ group: "month", id: "bodywork", label: "Body work", scope: "last 28 days",
        display: bodywork.count28 ? String(bodywork.count28) : "—",
        sub: !bodywork.count28 ? "none logged"
          : supportResponse !== null ? `recovery ${supportResponse >= 0 ? "+" : ""}${supportResponse} after` 
          : `${Math.round(bodywork.minutes28 / 60 * 10) / 10}h of it`,
        color: !bodywork.count28 ? C.muted : C.moss,
        plain: "Osteopathy, physiotherapy, massage, movement work and lymphatic drainage you've had.",
        how: "Counted from what you log. Nothing here is prescribed — but the type decides what the next session can be, and the morning-after recovery score is compared with the morning before.",
        meaning: `These are training inputs whether or not they feel like it. Osteopathy and deep tissue work leave tissue reactive for a day or two, so the coach drops the intensity of whatever comes next rather than loading into it. Relaxation massage, lymphatic drainage and movement work tend to improve the following day, so it can ask for more. Physiotherapy outranks the coach entirely — if someone qualified is directing your loading, that plan wins. ${supportResponse !== null ? `Your own evidence so far: recovery moves ${supportResponse >= 0 ? "up" : "down"} about ${Math.abs(supportResponse)} points the morning after the restorative kinds.` : "Once a few of these are logged alongside WHOOP, the app can tell you which ones actually move your recovery score."}`,
        need: bodywork.count28 ? null : "Log a session on Today and this starts building." }),

      M({ group: "week", id: "volume", label: "Weekly sets", scope: "regions at 6+ sets",
        display: setsTotal ? `${setsMet}/${REGIONS.length}` : "—",
        sub: !setsTotal ? "log sets after a session"
          : setsMet >= 5 ? "dose met" : setsShort.length ? `${setsShort[0].label.toLowerCase()} lowest` : "building",
        color: !setsTotal ? C.muted : setsMet >= 5 ? C.moss : setsMet >= 3 ? C.ink : C.ochre,
        plain: "How many body regions are getting the six-plus weekly sets that hold muscle.",
        how: "Sets you log per session, distributed across regions by each class's body map, totalled over seven days. A region counts once it reaches six.",
        meaning: `This is the measure that speaks most directly to your actual goal. For post-menopausal women the research puts the dose for holding or building muscle above six to eight sets per muscle per week, and ten or more to reliably prevent lean-mass loss. It is a volume prescription, not an attendance one — four sessions a week is plenty if the sets are there, and useless if they aren't. ${setsTotal ? `Lowest right now: ${setsShort.slice(0, 2).map((r) => `${r.label.toLowerCase()} at ${sets7[r.id]}`).join(", ")}.` : ""}`,
        need: setsTotal ? null : "Tap a rough set count after your strength sessions. Skip it on Pilates or cardio — it isn't a meaningful idea there." }),

      M({ group: "month", id: "realchange", label: "Real change", scope: "beyond measurement noise",
        display: realMoves.length ? `${realUp.length}↑ ${realDown.length}↓` : "0",
        sub: realMoves.length ? "moves that count" : "everything inside the error bars",
        color: realUp.length > realDown.length ? C.moss : realDown.length ? C.ochre : C.ink,
        plain: "How many measures moved further than the test's own error, so the change is real.",
        how: "A measure counts only if it moved more than its noise threshold: 5% for weight-times-reps, 10% for timed holds, 15% for rep counts, 20% for balance.",
        meaning: `Repeat any physical test twice on the same morning and you get two different numbers. ${realMoves.length ? `${realUp.length} measures genuinely improved and ${realDown.length} genuinely fell.` : "Nothing has moved beyond noise, which means holding — not declining."} Everything else is jitter, and calling jitter progress is how apps lose people's trust.`,
        need: null }),

      M({ group: "month", id: "asymmetry", label: "Left vs right", scope: "your widest gap",
        display: worstGap ? `${worstGap.gap}%` : "—",
        sub: worstGap ? `${worstGap.weak} side behind on ${worstGap.label.toLowerCase()}` : "needs both sides logged",
        color: !worstGap ? C.muted : worstGap.gap < FX.bilateralPct ? C.moss : worstGap.gap < FX.bilateralPct * 2 ? C.ochre : C.clay,
        plain: "The difference between your stronger and weaker side on measures that record both.",
        how: "(stronger − weaker) ÷ stronger, as a percentage, on the most recent entry that has both sides.",
        meaning: "Under 10% is normal human asymmetry. Above that is worth closing, and with your shoulder it is worth watching specifically. What matters more than the number is the direction — a gap of 20% that is narrowing every month is a completely different situation from one that is stuck.",
        need: worstGap ? null : "Log both sides on the L/R measures and this fills in." }),

      M({ group: "month", id: "muscle", label: "Muscle banked", scope: "against the clock",
        display: muscleCredit === null ? "—" : `${muscleCredit > 0 ? "+" : ""}${muscleCredit}`,
        sub: muscleCredit === null ? "needs two monthly benchmarks"
          : muscleCredit > 0 ? "ahead of the decline" : "holding",
        color: muscleCredit === null ? C.muted : muscleCredit > 0 ? C.moss : C.ink,
        plain: "Your muscle percentage change, plus the loss you'd have had by doing nothing.",
        how: "Change in muscle % since your first benchmark, plus expected untrained loss of roughly 0.75% a year for a woman past 50.",
        meaning: "This is the number that reframes everything. Muscle mass falls 5 to 10% per decade after 50, faster for women through menopause. Holding steady is not standing still — it is winning against a clock that takes muscle from everyone who does nothing. This measure gives you credit for the loss that didn't happen.",
        need: muscleCredit === null ? "Needs at least two monthly benchmarks to compare." : null }),

      M({ group: "month", id: "base", label: "Fitness base", scope: "this month vs last",
        display: chronicGrowth === null ? "—" : `${chronicGrowth > 0 ? "+" : ""}${chronicGrowth}%`,
        sub: chronicGrowth === null ? "needs two months of effort scores"
          : chronicGrowth > 0 ? "expanding" : chronicGrowth < -10 ? "contracting" : "level",
        color: chronicGrowth === null ? C.muted : chronicGrowth > 0 ? C.moss : chronicGrowth < -10 ? C.ochre : C.ink,
        plain: "Whether your typical week is getting bigger, or just spikier.",
        how: "Average weekly load over the last 28 days, against the 28 days before that.",
        meaning: "Balance tells you whether this week fits your month. This tells you whether the month itself is growing. Fitness develops when the base rises steadily while individual weeks stay close to it — a flat base with occasional big weeks is the pattern that produces injuries rather than progress.",
        need: chronicGrowth === null ? "Needs about eight weeks of effort scores." : null }),

      M({ group: "month", id: "variety", label: "Variety", scope: "last 28 days",
        display: String(variety28), sub: variety28 >= 5 ? "wide" : variety28 >= 3 ? "reasonable" : "narrow",
        color: variety28 >= 5 ? C.moss : variety28 >= 3 ? C.ink : C.ochre,
        plain: "How many different classes you've done this month.",
        how: "Distinct class names across completed sessions in 28 days.",
        meaning: "Not variety for its own sake. In a large cohort of people starting training, greater diversity of equipment and modality was associated with lower dropout — it is an adherence protector, which makes it a genuine training variable rather than a nice-to-have.",
        need: null }),

      M({ group: "quarter", id: "progression", label: "Progression rate", scope: "safe ceiling 10%/week",
        display: chronicGrowth === null ? "—" : `${Math.round((chronicGrowth || 0) / 4)}%`,
        sub: chronicGrowth === null ? "needs effort scores"
          : Math.abs(chronicGrowth / 4) <= 10 ? "within the safe rate" : "faster than advised",
        color: chronicGrowth === null ? C.muted : Math.abs(chronicGrowth / 4) <= 10 ? C.moss : C.ochre,
        plain: "How fast your training load is climbing, per week.",
        how: "Month-over-month change in average weekly load, divided across four weeks.",
        meaning: "The load-management literature is consistent that increases beyond about 10% a week are where trouble starts. This is the number that lets you build for a year without a setback — slower than you'd like, and far more likely to still be going in twelve months.",
        need: chronicGrowth === null ? "Needs two months of effort scores." : null }),

      M({ group: "quarter", id: "efficiency", label: "Return on load", scope: "strength per unit of work",
        display: returnOnLoad === null ? "—" : String(returnOnLoad),
        sub: returnOnLoad === null ? "needs load and strength history" : "strength gained per 1000 load",
        color: returnOnLoad === null ? C.muted : returnOnLoad > 0 ? C.moss : C.ochre,
        plain: "How much strength you're getting back for the work you put in.",
        how: "Percentage strength gain across all weight-and-reps measures, divided by total training load in thousands.",
        meaning: "Efficiency falling while volume rises is the earliest sign a programme has gone stale — it shows up before any single measure declines. It is a slow number and should only be read a quarter at a time.",
        need: returnOnLoad === null ? "Needs effort scores plus a few months of strength benchmarks." : null }),

      ...(settings.shoulderInjury ? [
      M({ group: "quarter", id: "shouldercost", label: "Shoulder cost", scope: "sessions affected",
        display: shoulderCost === null ? "—" : `${shoulderCost}%`,
        sub: shoulderCost === null ? "no comfort scores yet"
          : shoulderCost < 20 ? "rarely limiting" : "still a factor",
        color: shoulderCost === null ? C.muted : shoulderCost < 20 ? C.moss : C.ochre,
        plain: "The share of sessions where the shoulder was uncomfortable enough to matter.",
        how: "Sessions with comfort of 3 or below, as a percentage of all sessions with a comfort score.",
        meaning: "Quarter over quarter, is the shoulder costing you less? That is the only question worth asking about an injury that is healing. A falling number here is the evidence that you were right about it.",
        need: shoulderCost === null ? "Needs shoulder comfort scores, asked the morning after a training day. A few weeks of them and this gets a direction." : null })] : []),

      M({ group: "year", id: "survival", label: "Still here", scope: "against the dropout curve",
        /* Survival is TIME STILL TRAINING, not weeks that hit a target. Using
           `weeksHit` meant ten months of unbroken training with a target set
           one session too high displayed "—  just started" — the exact
           opposite of the one thing this metric exists to say. */
        display: weeksTraining ? `${weeksTraining}w` : "—",
        sub: weeksTraining >= 14 ? "past the median dropout" : weeksTraining ? "building" : "just started",
        color: weeksTraining >= 14 ? C.moss : C.ink,
        plain: "How many weeks you have been training, against when most people quit.",
        how: "Weeks since your first logged session. Not weeks that hit a target — still being here is the thing being measured.",
        meaning: "In a large study of people beginning resistance training, the median dropout came at 14 weeks and only 18% were still going at six months. The over-50s were the group most likely to keep going — 24% against 15% for the under-40s. Every week past that mark is the most meaningful thing this app measures, and no other number captures it.",
        need: weeksTraining ? null : "Starts at your first logged session." }),

      M({ group: "year", id: "ledger", label: "The ledger", scope: "everything, ever",
        display: totalSessions ? String(totalSessions) : "0",
        sub: [`${Math.round(totalHours)} hours`,
              totalKg > 0 ? `${totalKg >= 10000 ? `${Math.round(totalKg / 1000)}t` : `${totalKg} kg`} moved` : null,
              weeksHit > 0 ? `${weeksHit} week${weeksHit === 1 ? "" : "s"} hit` : null]
             .filter(Boolean).join(" \u00b7 "),
        color: C.ink,
        plain: "Total sessions, hours, kilograms moved and weeks you hit your number - since you started.",
        how: "Every completed session and every logged minute, added up. Kilograms are weight times reps across every battery entry you have ever recorded. Weeks hit counts the weeks you reached your number.",
        meaning: "Not analysis — evidence. This is the number to look at on the days when it feels like nothing is happening, because it only ever goes one way.",
        need: null }),

      M({ group: "year", id: "functional", label: "Functional age", scope: "against population norms",
        display: balanceM || squatM ? "see detail" : "—",
        sub: balanceM || squatM ? "from balance and lower body" : "needs benchmarks",
        color: C.ink,
        plain: "How your functional measures compare with published norms for women your age.",
        how: "Balance and lower-body measures read against age-banded reference values.",
        meaning: `Women in their fifties typically manage 10 to 18 repetitions on a 30-second sit-to-stand. ${squatM?.reading ? `Your squat measure currently reads ${squatM.reading.main}${squatM.reading.sub ? ` (${squatM.reading.sub})` : ""}.` : ""} ${balanceM?.reading ? `Single-leg stand: ${balanceM.reading.main}${balanceM.reading.sub ? ` (${balanceM.reading.sub})` : ""}.` : ""} Treat this as a motivational frame built on population averages, not a medical assessment — but it is the single most legible way to see what training is buying you.`,
        need: "Rough by design. It compares you with averages, not with a clinical assessment." }),
    ];

    const vitalDefs = [
      {
        id: "effort", label: "Effort", scope: "last 7 days",
        value: hasLoad ? acute : null, display: hasLoad ? String(acute) : "—",
        sub: loadTrend === null ? "no week to compare yet"
          : `${loadTrend >= 0 ? "+" : ""}${loadTrend}% on last week`,
        color: C.ink,
        plain: "Minutes multiplied by how hard each session felt, added up across the week.",
        meaning: `This is the only honest measure of what you actually did. Forty-five minutes of stretching and forty-five minutes of BODYPUMP both used to count as one session; now they don't. Your week came to ${hasLoad ? acute : "—"}, against a running average of ${hasLoad ? chronic : "—"}. The number itself is meaningless in isolation — what matters is that it is yours, and that it moves.`,
        need: hasLoad ? null : "Tap an effort score after your sessions and this fills in within a week.",
      },
      {
        id: "balance", label: "Balance", scope: "this week vs your month",
        value: acwr, display: acwr === null ? "—" : acwr.toFixed(2),
        sub: acwrBand ? acwrBand.label : "needs a month of effort scores",
        color: acwrBand ? acwrBand.color : C.muted,
        plain: "This week's work divided by your typical week over the last month.",
        meaning: "The single most useful number here. Around 1.0 means this week looks like your normal — you are training at a level your body is already prepared for. Below 0.8 and you are doing less than you are built for, which is how fitness quietly leaks away. Above 1.5 is a spike, and spikes are where injuries come from — not from hard training, but from sudden training. The evidence puts the safe corridor at roughly 0.8 to 1.3.",
        need: acwr === null ? "Needs about four weeks of effort scores before it means anything." : null,
      },
      {
        id: "consistency", label: "Consistency", scope: "last 28 days",
        /* Before her first session there is nothing to be a share OF. Showing
           0% would be inventing a number about someone who has not started
           (rule 23), and reading it as failure on day one (rule 24). */
        value: firstSession ? consistency : null,
        display: firstSession ? `${consistency}%` : "—",
        sub: !firstSession ? "starts with your first session"
          : consistency >= 80 ? "strong" : consistency >= 60 ? "holding" : "slipping",
        color: !firstSession ? C.muted
          : consistency >= 80 ? C.moss : consistency >= 60 ? C.ink : C.ochre,
        plain: "The share of your scheduled sessions you actually did, over four weeks.",
        meaning: "Of everything measured here, this is the one that predicts whether you are still training a year from now. In a large study of people starting resistance training, consistency over the first 28 days was the strongest single predictor of who was still going months later — stronger than age, sex or experience. It is deliberately a 28-day window and not a streak, because a streak punishes one bad day and this doesn't.",
        need: firstSession ? null : "Starts counting from your first logged session — there is nothing before that to be a share of.",
      },
      {
        id: "coverage", label: "Coverage", scope: "body regions, last 7 days",
        value: covered, display: `${covered}/${REGIONS.length}`,
        sub: covered >= 6 ? "whole body" : covered >= 4 ? `${thinnest.length} thin` : "narrow",
        color: covered >= 6 ? C.moss : covered >= 4 ? C.ink : C.ochre,
        plain: "How many parts of your body took a real share of the week's work.",
        meaning: `Until now this app watched one shoulder and nothing else. It now accounts for legs, back, chest, shoulders, arms, core and heart separately, because the regions that quietly disappear are the ones nobody is counting. ${thinnest.length ? `Thinnest right now: ${thinnest.slice(0, 3).map((r) => r.label.toLowerCase()).join(", ")}.` : "Everything is getting a share."}`,
        need: hasLoad ? null : "Sharper once effort scores are in — until then it counts minutes only.",
      },
      {
        id: "adaptation", label: "Adaptation", scope: "this month vs last",
        value: adaptation, display: adaptation === null ? "—" : `${adaptation >= 0 ? "+" : ""}${adaptation}%`,
        sub: adaptation === null ? "needs two months of WHOOP"
          : adaptation > 5 ? "getting easier" : adaptation < -5 ? "costing more" : "steady",
        color: adaptation === null ? C.muted : adaptation > 5 ? C.moss : adaptation < -5 ? C.ochre : C.ink,
        plain: "How much recovery a hard day costs you now, against what it cost a month ago.",
        meaning: "The cleanest evidence of fitness there is, and it needs nothing from you but wearing the WHOOP. When a strain of 12 used to knock eight points off your recovery and now knocks off four, your body has stopped treating that effort as an emergency. Strength numbers move slowly and noisily; this moves every single day. A positive number means the same work is costing you less.",
        need: adaptation === null ? "Needs about eight weeks of WHOOP history, and a stretch of hard days where strain actually cost you recovery — otherwise there is no cost to compare against." : null,
      },
    ];

    const allMetrics = [
      ...vitalDefs.map((v) => ({ ...v, key: true, group: v.id === "effort" ? "day"
        : v.id === "adaptation" ? "month" : "week",
        how: v.id === "effort" ? "Minutes multiplied by your effort score, for every session in the last seven days."
          : v.id === "balance" ? "Total load over 7 days, divided by the average week across 28 days."
          : v.id === "consistency" ? "Sessions completed divided by sessions scheduled, across 28 days."
          : v.id === "coverage" ? "Each class carries a body map. Load is split across regions, and a region counts as covered once it takes at least 7% of the week's work."
          : "Recovery lost per unit of strain this month, against the same figure a month ago." })),
      ...more,
    ];
    const groupsOf = (g) => allMetrics.filter((m) => m.group === g);

    /* ---- the weekly WHOOP import -------------------------------------
       Every export contains the whole history, so weekly loses nothing — it
       just backfills. The coach asks; nothing else can, because a browser app
       cannot reliably push a notification to her phone. */
    /* Recovery and the morning shoulder score can both be typed by hand. If
       either counted as an import, one hand-typed number would silence this
       reminder for a week while every WHOOP-only signal went quietly stale -
       and rule 23 says be honest about missing data, not confident about data
       that isn't there. Only a field she cannot type counts as imported. */
    const HAND_TYPED = ["recovery", "shoulderAM", "shoulderPM"];
    const morningKeys = Object.keys(morning).filter((d) => {
      const m = morning[d];
      if (!m) return false;
      return Object.keys(m).some((k) => !HAND_TYPED.includes(k) && m[k] !== "" && m[k] !== undefined && m[k] !== null);
    }).sort();
    const lastImport = morningKeys.length ? morningKeys[morningKeys.length - 1] : null;
    const importGap = lastImport
      ? Math.round((parse(t) - parse(lastImport)) / 86400000) : null;
    const importDue = importGap === null || importGap >= 7;

    /* ---- end-of-block review, and the next block ----------------------
       At the end of each block the coach reads what actually happened and
       designs the next one from it. Nothing beyond the live block is
       pre-written, because four weeks out is a guess. */
    const weeksIntoBlock = livePhase ? (programWeek - livePhase.from) + 1 : 0;
    const blockWeeksLeft = livePhase ? (livePhase.to - programWeek) : 0;
    const blockDays = livePhase ? Math.max(1, (Number(livePhase.weeks) || 4) * 7) : 28;
    const reviewDue = !!livePhase && blockWeeksLeft <= 0 && programWeek !== null;

    /* what the block actually produced */
    const blockSessions = Object.keys(logs).filter((d) =>
      d > addDays(t, -blockDays) && d <= t && logs[d]?.completed).length;
    const blockLoad = loadWindow(blockDays);
    /* EVERY input she gave, swept in one pass. She logs meticulously; a
       review that reads three fields wastes that. This looks at each battery
       measure individually, every body region, every WHOOP-derived metric,
       every calculation the app runs, and the subjective record. */
    const evidence = (() => {
      const out = { strong: [], weak: [], flags: [], notes: [] };

      /* every measurement, one at a time, filtered by its own noise floor */
      analysis.forEach((m) => {
        if (m.pct === null) return;
        const noise = noiseFor(m);
        if (m.pct >= noise) out.strong.push({ kind: "measure", cap: m.cap, id: m.id,
          text: `${m.label} up ${Math.round(m.pct)}%` });
        else if (m.pct <= -noise) out.weak.push({ kind: "measure", cap: m.cap, id: m.id,
          text: `${m.label} down ${Math.abs(Math.round(m.pct))}%` });
      });

      /* every body region, on both load share and sets */
      bodyRows.forEach((r) => {
        if (!r.covered) out.weak.push({ kind: "region", id: r.id, text: `${r.label} took only ${r.share}% of the work` });
        if (setsTotal && r.sets < SET_TARGET) out.weak.push({ kind: "sets", id: r.id,
          text: `${r.label} at ${r.sets} sets against a target of ${SET_TARGET}` });
      });

      /* every calculation with a real value */
      allMetrics.forEach((mt) => {
        if (mt.display === "—") out.notes.push({ kind: "gap", id: mt.id, text: `${mt.label} still has no data — ${mt.need || "needs more history"}` });
      });

      /* WHOOP, all of it */
      if (rhrDrift !== null && rhrDrift >= 3) out.flags.push({ kind: "whoop", id: "rhr", text: `resting heart rate ${Math.round(rhrDrift)} bpm above the month` });
      if (rhrDrift !== null && rhrDrift <= -2) out.strong.push({ kind: "whoop", id: "rhr", text: `resting heart rate ${Math.abs(Math.round(rhrDrift))} bpm below the month` });
      if (hrvDrift !== null && hrvDrift <= -10) out.flags.push({ kind: "whoop", id: "hrv", text: `HRV ${Math.abs(Math.round(hrvDrift))}% under its baseline` });
      if (hrvDrift !== null && hrvDrift >= 8) out.strong.push({ kind: "whoop", id: "hrv", text: `HRV ${Math.round(hrvDrift)}% above baseline` });
      if (timingSpread !== null && timingSpread >= 75) out.flags.push({ kind: "whoop", id: "sleep", text: `sleep timing swinging ${Math.round(timingSpread / 6) / 10} hours` });
      if (adaptation !== null && adaptation > 5) out.strong.push({ kind: "whoop", id: "adapt", text: `hard days costing ${adaptation}% less recovery` });
      if (adaptation !== null && adaptation < -5) out.flags.push({ kind: "whoop", id: "adapt", text: `hard days costing ${Math.abs(adaptation)}% more recovery` });

      /* body composition and the shoulder */
      if (muscleCredit !== null && muscleCredit > 0) out.strong.push({ kind: "body", id: "muscle", text: `muscle ${muscleCredit} ahead of the expected decline` });
      if (worstGap && worstGap.gap >= FX.bilateralPct) out.weak.push({ kind: "body", id: "asym", text: `${worstGap.gap}% gap between sides on ${worstGap.label.toLowerCase()}` });
      if (settings.shoulderInjury && shoulderAMTrend !== null && shoulderAMTrend >= 4.5) out.strong.push({ kind: "shoulder", id: "am", text: `shoulder waking at ${shoulderAMTrend}/5` });
      if (settings.shoulderInjury && shoulderAMTrend !== null && shoulderAMTrend < 3) out.flags.push({ kind: "shoulder", id: "am", text: `shoulder waking at ${shoulderAMTrend}/5 after training` });

      /* adherence and load */
      if (consistency >= 80) out.strong.push({ kind: "adherence", id: "consistency", text: `${consistency}% consistency` });
      if (consistency < 60) out.flags.push({ kind: "adherence", id: "consistency", text: `${consistency}% consistency` });
      if (acwrBand?.key === "spike") out.flags.push({ kind: "load", id: "acwr", text: `load spiking at ${acwr}` });
      if (acwrBand?.key === "under") out.weak.push({ kind: "load", id: "acwr", text: `load running under your base at ${acwr}` });
      if (variety28 <= 2) out.weak.push({ kind: "variety", id: "variety", text: `only ${variety28} different classes` });

      /* what she wrote */
      const written = Object.keys(logs).filter((d) => d > addDays(t, -blockDays) && (logs[d]?.sessionNote || logs[d]?.did)).length;
      if (written) out.notes.push({ kind: "written", id: "notes", text: `${written} written notes across the block — read them before deciding anything` });
      return out;
    })();

    const blockReview = livePhase ? {
      name: livePhase.name,
      weeks: livePhase.weeks,
      sessions: blockSessions,
      load: blockLoad,
      consistency,
      setsMet, setsShort,
      realUp: realUp.length, realDown: realDown.length,
      rhrDrift, hrvDrift,
      shoulder: shoulderAMTrend,
      acwr, chronicGrowth,
      evidence,
      measuresRead: analysis.length,
      metricsRead: allMetrics.filter((m) => m.display !== "—").length,
      metricsTotal: allMetrics.length,
    } : null;

    /* apply the written rules, in order, and record which fired */
    const proposeNext = () => {
      if (!livePhase) return null;
      const fired = [];
      let week = [...livePhase.week];
      const count = (id) => week.filter((x) => x === id).length;
      const swapFirst = (from, to) => {
        const i = week.indexOf(from);
        if (i >= 0) { week[i] = to; return true; }
        return false;
      };
      const restToward = (id) => {
        const i = week.indexOf("rest");
        if (i >= 0 && week.filter((x) => x === "rest").length > 1) { week[i] = id; return true; }
        return false;
      };

      const month = parse(t).getMonth();
      const wintering = month === 11 || month === 0 || month === 1;
      const deload = (rhrDrift !== null && rhrDrift >= 3) || (hrvDrift !== null && hrvDrift <= -10);
      const shoulderWorse = shoulderAMTrend !== null && shoulderAMTrend < 3;
      const spiking = chronicGrowth !== null && chronicGrowth / 4 > 10;
      const ready = consistency >= 80 && !deload && !shoulderWorse && !spiking && realDown.length === 0;
      /* ---- WHAT SHE SAID, NOT JUST WHAT SHE DID ------------------------
         Rule 8 says the review reads everything she wrote. It never did — it
         counted her notes and emitted a line telling a human to read them.
         The mining has existed for months and reached nothing that designs
         her training. This is that wire.

         Every claim below is counted, gated and silent when thin (rule 16),
         and it changes the ORDER of the block rather than restricting it — a
         class she disliked still exists, it stops being first. */

      /* the reason that accounts for most of her missed days */
      const whyTally = {};
      whyEntries.filter((w) => (w.kind || "skip") === "skip").forEach((w) => {
        const tag = whyTag("skip", w.reason);
        whyTally[tag] = (whyTally[tag] || 0) + 1;
      });
      const whyTotal = Object.values(whyTally).reduce((a, b) => a + b, 0);
      const topWhy = Object.entries(whyTally).sort((a, b) => b[1] - a[1])[0] || null;
      /* at least three reasons given, and one accounting for half of them */
      const whyDominant = whyTotal >= 3 && topWhy && topWhy[1] / whyTotal >= 0.5 ? topWhy[0] : null;

      if (whyDominant) {
        const SAYS = {
          motivation: `${topWhy[1]} of the ${whyTotal} days you explained, you said you were not in the mood rather than tired or hurt. That is not a fitness problem and it does not get fixed by asking for less. This block puts the sessions you actually like on the days you actually miss.`,
          time: `${topWhy[1]} of ${whyTotal} missed days came down to time, not willingness. The sessions get shorter rather than fewer — a short one you do beats a long one you don't.`,
          tired: `${topWhy[1]} of ${whyTotal} were tiredness. This block does less, and the easy days are genuinely easy rather than nominally easy.`,
          body: `${topWhy[1]} of ${whyTotal} were your body rather than your mood. Load holds where it is and the mobility work goes up.`,
          dislike: `${topWhy[1]} of ${whyTotal} times you skipped, you said you did not fancy what was on. That is the plan's fault, not yours — what you avoid comes off the block.`,
          away: `${topWhy[1]} of ${whyTotal} were being away from home. This block carries a version that needs nothing but a floor.`,
          chosen: `You chose rest deliberately ${topWhy[1]} times out of ${whyTotal}. That is a decision, not a lapse, and the block is built around a body that asks for it.`,
        };
        if (SAYS[whyDominant]) fired.push({ id: "why", note: SAYS[whyDominant] });
        if (whyDominant === "time") {
          /* shorter, not fewer */
        } else if (whyDominant === "tired" || whyDominant === "body") {
          if (!swapFirst("strength", "move")) swapFirst("cardio", "move");
        } else if (whyDominant === "dislike" || whyDominant === "motivation") {
          /* what she reaches for, put where the misses are */
          const want = swaps?.chosen?.[0] || null;
          const wantGoal = (allClasses.find((w) => w.name === want) || {}).goal;
          const asBlock = wantGoal === "strength" ? "strength" : wantGoal === "core" ? "core"
            : wantGoal === "cardio" ? "cardio" : wantGoal === "mobility" ? "move" : null;
          if (asBlock && count(asBlock) < 3) { if (!restToward(asBlock)) swapFirst("cardio", asBlock); }
        }
      }

      /* revealed preference — what she quietly never does */
      if (swaps && swaps.n >= 5 && swaps.avoided && swaps.avoided[1] >= 2) {
        fired.push({ id: "prefers", note: `You were given ${swaps.avoided[0]} ${swaps.avoided[1]} times and did something else. ${swaps.chosen ? `What you reached for instead was ${swaps.chosen[0]}.` : ""} It stays in the library, but it stops being first.` });
      }

      /* the conditions that reliably cost her a session — computed for months,
         read by nothing until now */
      (learned?.brakes || []).slice(0, 2).forEach((b) =>
        fired.push({ id: "brakes", note: `${b.charAt(0).toUpperCase()}${b.slice(1)}. Built into this block rather than discovered again.` }));

      /* and anything the coach has actually earned the right to believe */
      (profileBelieved || []).filter((p) => !p.computed || p.hers).slice(0, 3).forEach((p) =>
        fired.push({ id: "profile", note: `${p.claim}. ${p.hers ? "Your words, so it outranks anything I worked out." : `Seen ${(p.evidence || []).length} times.`}` }));


      if (deload) {
        fired.push({ id: "autonomic", note: `Resting heart rate and HRV say you were absorbing, not adapting. This block does less, on purpose.` });
        if (!swapFirst("strength", "move")) swapFirst("cardio", "move");
      } else if (shoulderWorse) {
        fired.push({ id: "shoulder", note: "Your shoulder was reading below 3 most mornings after training. Same number of strength days, no added overhead load." });
      } else if (consistency < 60) {
        fired.push({ id: "adherence", note: `You hit ${consistency}% of scheduled sessions. This block asks for fewer days rather than pretending the last one worked.` });
        const i = week.findIndex((x) => x !== "rest" && x !== "pilates");
        if (i >= 0) week[i] = "rest";
      } else if (spiking) {
        fired.push({ id: "spike", note: "Load climbed faster than 10% a week. Same shape again — let the base catch up before adding." });
      } else if (ready) {
        fired.push({ id: "ready", note: `${consistency}% consistency, load steady, nothing declining. This is the one condition where adding work is a good idea.` });
        if (count("strength") < 3) { if (!restToward("strength")) swapFirst("core", "strength"); }
      } else {
        fired.push({ id: "hold", note: "Nothing in the numbers argues for more or less. Same shape, run it again — repetition is what makes a block work." });
      }

      /* what she said she wants comes before what the numbers prefer */
      if (openGoals.length || mobAsym.length || (mobScore !== null && mobScore < 60)) {
        const bits = [];
        if (openGoals.length) bits.push(`she's working toward "${openGoals[0].text}"`);
        if (mobAsym.length) bits.push(`${mobAsym[0].label.toLowerCase()} is ${mobAsym[0].gapPct}% apart side to side`);
        else if (mobWeakest.length) bits.push(`${mobWeakest[0].label.toLowerCase()} is the shortest thing she has`);
        fired.push({ id: "goals", note: `${bits.join(", and ")}. This block keeps a mobility day and points the daily ten minutes at it.` });
        if (count("move") < 2) { if (!restToward("move")) swapFirst("cardio", "move"); }
      }

      if (setsShort.length && setsShort[0].sets < 3 && !deload) {
        const target = setsShort[0].id;
        const wants = target === "legs" || target === "back" || target === "chest" || target === "arms" || target === "shoulders"
          ? "strength" : target === "core" ? "core" : target === "heart" ? "cardio" : "move";
        if (count(wants) < 3 && swapFirst(wants === "strength" ? "core" : "cardio", wants))
          fired.push({ id: "sets", note: `${setsShort[0].label} was the thinnest region. One day moves toward ${BLOCKS[wants].label.toLowerCase()}.` });
        else fired.push({ id: "sets", note: `${setsShort[0].label} was thin — worth an add-on rather than a whole day.` });
      }
      if (wintering) fired.push({ id: "season", note: "December to February. Maintenance, deliberately — getting through the low months still training is the win." });

      const names = { autonomic: "Recovery block", shoulder: "Steady load", adherence: "Fewer, kept",
        spike: "Consolidation", ready: "Progression", hold: "Repeat", season: "Maintenance",
        /* named after what she said, not what the numbers noticed */
        why: "Built round the reason", prefers: "What you actually do",
        brakes: "Around what stops you", profile: "What I know about you" };
      const lead = fired[0]?.id || "hold";
      return {
        id: `blk${programPhases.length + 1}`,
        name: names[lead] || "Next block",
        weeks: 4,
        status: "proposed",
        line: fired[0]?.note || "",
        basis: fired.map((f) => f.note),
        firedRules: fired.map((f) => f.id),
        evidence,
        read: `Built from ${analysis.length} measurements, ${allMetrics.filter((m) => m.display !== "—").length} live calculations, ${REGIONS.length} body regions and your WHOOP history.`,
        week,
      };
    };
    const proposal = reviewDue ? proposeNext() : null;



    /* ---- CALIBRATION MONTH --------------------------------------------
       The first block is not a training decision, it is a data-gathering one.
       The coach cannot design anything until it has a month of her actual
       numbers, so for these weeks its main job is making sure nothing goes
       unlogged — and telling her plainly why each thing matters. */
    /* read once, outside the row builder, so the block does not reach into
       browser storage while it is being described */
    const backupDueRow = (() => { try { return backupDue(data); } catch (e) { return false; } })();

    const capture = (() => {
      const l = logs[t] || {};
      const mg = morning?.[t] || {};
      const wkEntry = weekly[ws] || null;
      const moEntry = monthly[mk] || null;
      const rows = [];
      /* THREE DIFFERENT REGISTERS, AND THEY ARE NOT INTERCHANGEABLE.
           label — the row, four or five words, read at a glance
           why   — the explanation behind the circled i, read once, if ever
           say   — one sentence the COACH says out loud

         The coach used to speak by pasting `why` into its own mouth, which
         produced things like "How hard it was, 1-10 is still open. Minutes
         alone can't tell BODYPUMP from stretching." — an instruction manual
         read aloud. Rule 31: write like the coach. So every row now carries a
         line written to be spoken, and nothing else is ever put in its mouth. */
      /* atSession: this question is about a SESSION, not about the day. It
         still counts toward the ledger and the coach can still mention it,
         but it is never a row in "Needs you" — on a day with two classes a
         row saying "how hard was it" cannot say which one it means. Those
         are asked under each session instead. */
      const AT_SESSION = ["rpe", "sets", "during", "felt", "note"];
      const add = (id, scope, label, done, why, say) =>
        rows.push({ id, scope, label, done, why, say, atSession: AT_SESSION.includes(id) });

      /* Before anything else: how often does she actually want to train? Every
         count in the app is a share of this, so guessing it makes every other
         number a guess too. */
      add("rhythm", "block", "How often you want to train", scheduleSet(settings),
        "Everything the app counts is measured against this and nothing else — how consistent you are, what counts as a missed day, and how the month is laid out. Tell me the rhythm you actually want and I will build around it rather than assuming.",
        "How often do you want to train? Tell me that one number and I will build everything else around it.");
      add("recovery", "day", "This morning's WHOOP recovery", !!mg.recovery,
        "It sets your bands. Without it every recovery judgement is a guess.",
        "I don't have your recovery score this morning, so anything I say about how today should feel is a guess.");
      if (settings.shoulderInjury && trainedYesterday)
        add("shoulderAM", "day", "How the shoulder woke up", !!mg.shoulderAM,
          "The morning after load is the only reading that tells us whether the load was right.",
        "You trained yesterday — how did the shoulder wake up? The morning after is the reading that matters.");
      if (!restDay) {
        add("session", "day", "Today's session logged", !!l.completed,
          "Everything downstream counts from this.",
        "Nothing logged today yet. When you have done something, tell me what it was.");
        if (l.completed) {
          add("rpe", "day", "How hard it was, 1–10", !!l.rpe,
            "Minutes alone can't tell BODYPUMP from stretching. This is the number load is built from.",
        "The session is in but not how hard it was. One tap, and it stops being just minutes.");
          add("sets", "day", "Roughly how many working sets", l.sets !== undefined && l.sets !== "",
            "Sets are the dose that decides whether you hold muscle. Nothing else can see it.",
        "About how many working sets was that? A rough number is fine — it is the part that decides whether you hold muscle.");
          add("during", "day", "How it felt while you were doing it", !!l.during,
            "How a session feels DURING is one of the better predictors of whether you do it again. Afterwards doesn't carry the same signal.",
        "How did that feel while you were in it? Not afterwards — during. It is the better predictor of whether you come back.");
          add("felt", "day", "How you felt afterwards", !!l.energyAfter,
            "The subjective read often moves before the objective one does.",
        "How did you feel afterwards? It often moves before anything I can measure does.");
          add("note", "day", "A line about how it went", !!(l.sessionNote || l.did),
            "In three months this will be the most useful thing you wrote.",
        "Say a line about how that went, if you have one in you. In three months it will be the most useful thing here.");
        }
      }
      add("battery", "week",
        weeklyToday ? "Today is your measurement day"
          : weeklyLate ? `This week's measurements — ${weeklyLate} day${weeklyLate === 1 ? "" : "s"} late`
          : "This week's measurements",
        !!wkEntry,
        `Every target the coach sets comes out of these numbers. It rides on the first training day of the week — ${prettyShort(weeklyAssessDay)} — because you are already changed, already warm, already in the room.`,
        weeklyToday
          ? "Today is your measurement day. It rides on a training day because you are already warm and in the room."
          : weeklyLate
          ? `This week's measurements are ${weeklyLate} day${weeklyLate === 1 ? "" : "s"} late. Ten minutes and the week has something to compare against.`
          : "This week's measurements are still open. Every target I set comes out of them.");
      add("benchmark", "month",
        monthlyToday ? "Today is your benchmark day"
          : monthlyLate ? `This month's benchmark — ${monthlyLate} day${monthlyLate === 1 ? "" : "s"} late`
          : "This month's benchmark",
        !!moEntry,
        `Body composition and the heavier tests, on the first training day of the month — ${prettyShort(monthlyAssessDay)}. Without two of these, nothing can be compared to anything.`,
        monthlyToday
          ? "Today is your benchmark day — the full battery and body composition. About half an hour."
          : monthlyLate
          ? `The month's benchmark is ${monthlyLate} day${monthlyLate === 1 ? "" : "s"} late. Without two of these there is nothing to compare.`
          : "This month's benchmark is still open. It is the one that lets me see change rather than noise.");
      add("whoop", "week", "WHOOP imported this week", !settings.whoopConnected || (importGap !== null && importGap < 8),
        "One export backfills everything — recovery, sleep, heart rate, strain. Recovery and the shoulder score can be typed by hand; nothing else can, so a stale import quietly ages every other signal.",
        "Your WHOOP export is getting stale. One file backfills recovery, sleep, heart rate and strain in one go.");

      /* ---- rows that used to be cards of their own ---------------------
         Eight separate cards said these things, each with its instruction
         printed in full whether or not she had ever read it. One block of
         rows, each actionable where it sits (rule 11), each explaining
         itself only when asked. */
      add("mobility", "week", "Mobility check", !mobDue,
        "Seven tests, about ten minutes. The scores choose the ten minutes of drills you do after each session, so a stale battery means the drills are aimed at where you were, not where you are.",
        "The mobility battery is due. It is about ten minutes, and it is what chooses your drills for the week.");
      add("backup", "block", "A copy off this device", !backupDueRow,
        "Everything lives in this browser, on this device. Another device is a separate copy that never syncs. One tap sends a file you can drop into Drive.",
        "Take a copy of your data off this device. One tap, and it is the difference between a lost phone costing you nothing or everything.");

      /* ---- the two quiet rows that stop being quiet --------------------
         The record and the goals sit folded away on a normal day. The
         moment either one is actually asking her something — a followed-up
         issue, a goal due a score — it comes up here instead, because a
         thing the app needs from her should never be behind a tap. */
      if (issueFollowUp.length)
        add("issue", "day",
          issueFollowUp.length === 1
            ? `You mentioned ${issueFollowUp[0].text} — how is it now?`
            : `${issueFollowUp.length} things you mentioned — how are they now?`,
          false,
          "You told me about this two days ago. Whether it settled, stayed the same or got worse is the whole point of writing it down — without the second reading there is nothing to compare, and next time it happens I would be starting from scratch again.",
          issueFollowUp.length === 1
            ? `You mentioned ${issueFollowUp[0].text} a couple of days ago. How is it now?`
            : "A couple of things you mentioned are due a second look. How are they now?");
      if (goalCheckDue.length)
        add("goal", "week",
          goalCheckDue.length === 1
            ? `Try "${goalCheckDue[0].text}" and score it`
            : `${goalCheckDue.length} of your goals are due a score`,
          false,
          "You score these by actually trying the thing, not by guessing. It is the only measure in the app that comes from what you said you wanted rather than what the app decided to measure, and it outranks the numbers when the month gets designed.",
          goalCheckDue.length === 1
            ? `Try "${goalCheckDue[0].text}" this week and tell me how close it is now.`
            : "A couple of your goals are due a score. Try them and tell me where they are.");

      const due = rows.filter((r) => !r.done);
      const dueHere = due.filter((r) => !r.atSession);   /* what "Needs you" may show */
      const pct = rows.length ? Math.round(((rows.length - due.length) / rows.length) * 100) : 100;
      return { rows, due, dueHere, pct, complete: due.length === 0 };
    })();



    /* ================= THE COACH LEADS =================================
       A coach that only answers questions isn't a coach. Everything below
       runs unprompted: the engine keeps a standing agenda of things worth
       saying, at every cadence, and the loudest one is put in front of her
       whether or not she asked. Each entry carries a scope so the app can
       show that it is watching the day, the week, the month and the year
       at the same time. */


    /* --- the agenda, richest first ------------------------------------- */
    const agenda = [];
    /* The fourth argument used to be silently dropped, so one call site that
       meant `admin: true` was never marked as admin. `lead` is new: it is how
       something claims the coach's opening line regardless of tone. */
    const raise = (scope, tone, text, opts) => {
      const o = opts === true ? { admin: true } : (opts || {});
      agenda.push({ scope, tone, text, ...o });
    };

    /* Admin belongs to the measurement card, which is permanent and escalates
       on its own. The coach's one line should be worth reading. */
    nudges.filter((n) => !n.admin).forEach((n) => raise("day", n.tone, n.text));

    /* CALIBRATION — for the first block the coach's job is the logging.
       It leads with what's missing, because without it nothing else works. */
    /* One thing, said once, in a sentence. Not the row label, not the
       explanation behind the circled i, and never both stapled together. The
       calibration tail is added only while there is a real backlog — said
       every single day it becomes wallpaper. */
    if (capture.due.length) {
      const first = capture.due.find((r) => r.say) || capture.due[0];
      const tail = calibrating && capture.due.length > 3
        ? " This first month is me learning you — everything I design in September comes out of what you put in now."
        : "";
      raise("day", capture.due.length > 3 ? "firm" : "push",
        (first.say || `${first.label} is still open.`) + tail,
        { capture: first.id });
    }
    if (calibrating && capture.complete)
      raise("day", "warm", "Everything logged today. That is the whole job this month — you're building the evidence the next block gets designed from.");

    /* DAY — what a coach would actually lead with: the session in front of
       her, what it's for, and what it would move. Never the paperwork. */
    if (!loggedToday && !restDay && prescribed)
      raise("day", recovery?.key === "green" ? "push" : "warm",
        recovery?.key === "green"
          ? `${prescribed.name} today, and you've woken up better recovered than usual. Green mornings are the ones to spend — go at this properly rather than politely.`
          : `${prescribed.name} today. ${prescribed.reason ? prescribed.reason.charAt(0).toUpperCase() + prescribed.reason.slice(1) + "." : ""} Start it and the rest looks after itself.`);

    if (!loggedToday && !restDay && weekDone === seasonTarget - 1)
      raise("day", "push", `One session short of the week. If today works, it rounds it off — and if it doesn't, the week still counted.`);

    if (!loggedToday && !restDay && thinnest.length && hasLoad)
      raise("day", "push", `${thinnest[0].label} has taken the smallest share of your work this week. If you add anything on the end today, make it that — ${thinnest[0].note.toLowerCase()}`);

    /* The capture line above may already have said this. Two agenda items
       about the same missing number is how the coach starts sounding like a
       form rather than a person. */
    if (loggedToday?.completed && !loggedToday.rpe && capture.due[0]?.id !== "rpe")
      raise("day", "push", "Session's in — it needs an effort score to count properly. The tap is on this screen, just below; guessing at it tomorrow isn't the same thing.");

    if (loggedToday?.completed && loggedToday.rpe)
      raise("day", "warm", `Logged at ${loggedToday.rpe} out of 10. That's ${Math.round(Number(loggedToday.minutes || 0) * Number(loggedToday.rpe))} of load on the board, and it counts whether or not it felt like much at the time.`);

    if (restDay && !loggedToday)
      raise("day", "warm", "Rest day, and it's doing work. Adaptation happens between sessions, not during them — the training only becomes fitness on days like this one.");

    if (!hasLoad && totalSessions >= 2)
      raise("day", "push", "Start tapping an effort score after each session. One number, one second, and within a week the app can tell you whether you're training too little, too much, or about right — which it currently can't.");

    /* WEEK */
    if (dormant.length && totalSessions >= 6)
      raise("week", "firm", `Nothing for ${dormant.map(goalLabel).join(" or ")} in a fortnight. That's the part that quietly disappears — put one in this week and it stops being a gap.`);
    if (rhrDrift !== null && rhrDrift >= 3)
      raise("week", "firm", `Your resting heart rate has sat about ${Math.round(rhrDrift)} beats above your month's normal for a week. That's usually sleep, stress or a bug — not training. Go easier until it settles.`);
    if (rhrDrift !== null && rhrDrift <= -2)
      raise("week", "warm", `Resting heart rate is running ${Math.abs(Math.round(rhrDrift))} beats below your own month-long average. That is your heart getting better at its job, and it is the least arguable evidence you have.`);
    if (rhrDrift !== null && Math.abs(rhrDrift) < 2 && rhr28 !== null && rhr28 >= 60)
      raise("month", "push", `Your resting heart rate is holding around ${Math.round(rhr28)}. That's your baseline, and it's the number cardio moves — it is the single clearest return on the cardio days in your block.`);
    if (hrvDrift !== null && hrvDrift <= -10)
      raise("week", "firm", "Your heart rate variability has been about a tenth below normal all week. One low morning is noise; a week of them isn't. Take the easy version of whatever comes next.");
    if (slp7 && slp28 && slp7 < slp28 - 45)
      raise("week", "firm", `You're sleeping roughly ${Math.round((slp28 - slp7) / 60 * 10) / 10} hours less than your usual this week. Fix that before you worry about anything in the gym.`);
    if (weekDone >= seasonTarget && !restDay)
      raise("week", "warm", `Week's target already met — ${weekDone} of ${seasonTarget}. Anything else is profit, so choose it because you want it.`);

    if (setsShort.length && setsTotal > 0 && setsShort[0].sets < 3)
      raise("week", "firm", `${setsShort[0].label} has had ${setsShort[0].sets} working sets this week against a target of six. That gap is the one that decides whether you hold muscle, and no amount of showing up fixes it — it needs sets.`);
    if (setsMet >= 5)
      raise("week", "warm", `${setsMet} of seven regions are at the six-set mark. That's the dose the research actually calls for, and most people training four days a week never reach it.`);
    if (timingSpread !== null && timingSpread >= 75)
      raise("week", "push", `Your sleep timing swings by about ${Math.round(timingSpread / 6) / 10} hours night to night. Regularity predicts more than duration does — and you already have the hours. Pulling bedtime into a narrower window is the cheapest gain available to you.`);
    /* One switch, and it means it. "Track shoulder comfort" off must remove
       the shoulder as a READING everywhere — no comfort score, no morning
       reading, no verdict, no trend, no headline number, no line from the
       coach about it. It used to only hide the inputs while the outputs kept
       talking, which is why turning it off did nothing visible.
       Her words, 8 August: "I will tell the coach about anything that is
       annoying me. Remove the shoulder from the app as a reading."
       Everything already recorded is kept (rule 20) and comes straight back
       if she ever turns it on again (rule 19). */
    if (settings.shoulderInjury && shoulderVerdict?.key === "back")
      raise("day", "firm", "Your shoulder woke up worse than it started yesterday. That's the one signal worth acting on immediately — step the overhead work back a level today rather than testing it again.");
    if (settings.shoulderInjury && shoulderVerdict?.key === "clear")
      raise("day", "warm", "Shoulder was back to baseline this morning after training. That's a green light: the load you used was right, and it can go up a step next time.");


    if (importGap === null && settings.whoopConnected)
      raise("week", "push", "Import your WHOOP export and about a third of what I can tell you switches on — recovery bands against your own median, resting heart rate trend, sleep regularity, and how much a hard day costs you.");
    else if (importGap !== null && importGap >= 14)
      raise("week", "firm", `Your WHOOP data stops ${importGap} days ago. Everything I say about recovery, sleep and adaptation is running on stale numbers until you import again — it takes two minutes and one export covers the whole gap.`);
    else if (importGap !== null && importGap >= 7)
      raise("week", "push", `WHOOP import is due — last data is from ${importGap} days ago. One export backfills the lot, so a weekly habit loses nothing.`);

    if (reviewDue && proposal)
      raise("month", "push", `Your ${blockReview.name} block is done — ${blockReview.sessions} sessions, ${consistency}% consistency. I've read the month and drawn up the next one: ${proposal.name.toLowerCase()}. Look it over and change anything you don't like.`);
    else if (livePhase && blockWeeksLeft === 1)
      raise("month", "warm", `Last week of ${livePhase.name}. At the end of it I'll read the whole block — your sessions, load, measurements and WHOOP — and design the next one from what actually happened rather than from a plan written a month ago.`);

    if (settings.shoulderInjury && shoulderAMTrend !== null && shoulderAMTrend >= 4.5 && amRecent.length >= 10)
      raise("month", "warm", `Your shoulder has woken up at ${shoulderAMTrend} out of 5 for ten straight readings. That's a joint that has stopped being a constraint. When you're ready, turn the shoulder tracking off in Settings — you shouldn't have to answer for it forever, and I'll stop restricting overhead work.`);

    if (illnessFlags.length >= 2)
      raise("day", "firm", `Two of your early-warning signals are moving together — ${illnessFlags.join(" and ")}. That usually shows up a day or two before you feel it. Take the easy version today; resting at the start of something costs less than pushing through it does.`);
    if (debtNow !== null && debtNow >= 90)
      raise("week", "push", `You're carrying about ${Math.round(debtNow / 6) / 10} hours of sleep debt. That's the most likely explanation for any flat day this week, and an earlier bedtime clears it faster than any change to your training would.`);
    if (restorativePct !== null && restorativePct < 30 && asleepNow > 420)
      raise("week", "push", `You're sleeping plenty — about ${Math.round(asleepNow / 6) / 10} hours — but only ${restorativePct}% of it is deep or REM. Long and light does less repair than shorter and deeper. Worth looking at room temperature, alcohol and screen time before adding any training.`);
    if (cardiacDrift !== null && cardiacDrift <= -3)
      raise("month", "warm", `Your average daily heart rate is ${Math.abs(cardiacDrift)} beats lower than last month. Same life, fewer beats — that is a heart that has got better at its job, and it is the clearest return your cardio days have produced.`);

    if (bodywork.reactive && !loggedToday)
      raise("day", "firm", `You had ${bodywork.reactive.label.toLowerCase()} in the last day or two. ${bodywork.reactive.why} Today is the lighter version — that isn't caution, it's how you get the benefit of the session you paid for.`);
    if (bodywork.guided)
      raise("day", "warm", `Physio in the last day. Whatever they've asked you to do takes priority over anything I set — tell me what they said and I'll build around it.`);
    if (bodywork.support && !loggedToday && recovery?.key !== "rest")
      raise("day", "push", `${bodywork.support.label} yesterday. ${bodywork.support.why} If you were going to push a session this week, today is the day for it.`);
    if (supportResponse !== null && supportResponse >= 4)
      raise("month", "warm", `Your recovery score comes in about ${supportResponse} points higher the morning after restorative body work. That's your own data, not a claim — worth booking those before the weeks you know will be heavy.`);
    if (reactiveResponse !== null && reactiveResponse <= -5)
      raise("month", "push", `Deep body work costs you about ${Math.abs(reactiveResponse)} recovery points the next morning. Not a reason to stop — a reason to put it the day before a rest day rather than the day before a hard one.`);

    if (!loggedToday && !restDay && prescribed && (prescribed.id === "wod" || prescribed.name === "CrossFit-style WOD"))
      raise("day", "firm", "A WOD is the highest-cost session in your library and the easiest one to overreach on. Take the scaled version, keep overhead work off it unless the shoulder woke up clear, and stop a round early rather than a round late.");
    if (!loggedToday && !restDay && prescribed && prescribed.name === "Functional Circuit")
      raise("day", "push", "Circuit work covers push, pull, squat, hinge and carry in one session — it's the most efficient thing in your library for whole-body coverage. Move well before you move fast; the clock isn't the point.");

    /* MOOD LEADS. If she has said she's struggling, nothing about training
       goes first. The session can wait; being heard cannot. */
    const moodToday = logs[t]?.mood || null;
    if (moodToday && moodToday !== "good") {
      const lines = {
        flat: "You said you're flat today. That's worth taking at face value rather than pushing against — flat usually has a reason even when it won't name itself. Nothing is required of you today. If you want to talk it through rather than train, I'm here for that.",
        low: "You said today's a bad one. I'm not going to sell you a session. Whatever's underneath it is the more interesting thing right now, and I'd rather hear about that. If movement helps later, it'll still be here.",
        tired: "Tired in yourself rather than sore is different, and it usually means something needs rest that isn't muscle. A day off taken deliberately costs you nothing — it's the ones taken guiltily that turn into three.",
        frustrated: "You said you're frustrated with this. Say it properly if you want to — I'd genuinely rather hear it than have you go quiet on the app. Most of what makes people stop is unsaid.",
      };
      /* Rule 4: when she arrives flat, frustrated or unable to face it, the
         coach starts with the feeling — not a number, not a plan. This has to
         outrank tone, because every compassionate line here is "warm" and
         every chase is "firm", so sorting by tone put her mood third, behind
         "your WHOOP recovery is still open". */
      raise("day", "warm", lines[moodToday] || lines.flat, { lead: 1 });
    }

    /* Rule 3: the coach leads. It should not wait in Settings for her to find
       the one setting every other number depends on. */
    if (!scheduleSet(settings))
      raise("block", "warm", `I am counting your consistency against ${scheduleSummary(schedule)}, because that is the default — not because you told me. How often do you actually want to train, and in what pattern? Settings, then Training. Everything I say about how you are doing is a share of that number, so it is worth two minutes.`);

    if (mobDue && mobDaysAgo !== null && mobDaysAgo >= 10)
      raise("week", "push", `${mobDaysAgo} days since your mobility tests. They set what your daily ten minutes should be, so when they go stale the drills stop being aimed at anything.`, true);
    if (mobAsym.length)
      raise("month", "push", `Your ${mobAsym[0].label.toLowerCase()} is ${mobAsym[0].gapPct}% apart between sides. Asymmetry is worth more attention than either side's absolute number — the tight side is doing less and something else is compensating. Work the restricted side twice for every once on the free side until it closes.`);
    if (mobWeakest.length && mobScore !== null && mobScore < 60)
      raise("month", "warm", `${mobWeakest[0].label} is the shortest thing you have. ${mobWeakest[0].why} That's what your daily ten minutes is aimed at, and range usually moves faster than strength does — expect something visible inside a month.`);
    goalCheckDue.forEach((g) => {
      if (goalCheckDue.indexOf(g) > 0) return;
      const last = (g.scores || []).slice(-1)[0];
      raise("week", "push", last
        ? `Time to try "${g.text}" again — you were at ${last.value} out of ten last week. Try it now while you're thinking about it and tell me what happened, including what stopped you if something did. That's the bit that tells me what to change.`
        : `You said you want to be able to ${g.text.toLowerCase().replace(/^i want to /, "")}. Try it once today and score it out of ten, so we have a starting point to move from.`);
    });
    openGoals.forEach((g) => {
      const sc = g.scores || [];
      if (sc.length < 3) return;
      const moved = sc.slice(-1)[0].value - sc[0].value;
      if (moved >= 2 && goalCheckDue.length === 0)
        raise("month", "warm", `"${g.text}" has gone from ${sc[0].value} to ${sc.slice(-1)[0].value} out of ten since you started tracking it. That is the kind of change you'd never notice day to day, which is exactly why it's worth writing down.`);
    });

    if (writing !== null && writing.drop <= -50 && consistency >= 60)
      raise("week", "warm", `You've written a lot less these last two weeks than the fortnight before. Sessions are still happening, so nothing is wrong on paper — but that drop usually comes before the sessions do, so I'd rather ask now. How are you finding it?`);
    if (swaps && swaps.pct < 60 && swaps.avoided)
      raise("month", "push", `You keep my pick about ${swaps.pct}% of the time, and ${swaps.avoided[0]} is what you swap out of most${swaps.chosen ? `, usually for ${swaps.chosen[0]}` : ""}. That's information, not disobedience. Do you want it out of the rotation, or is there a version of it you'd actually do?`);
    if (restarts && restarts.improving && restarts.runs >= 4)
      raise("month", "warm", `Your runs are lasting longer than they used to — averaging ${restarts.lateAvg} sessions now against ${restarts.earlyAvg} earlier on. Everyone stops sometimes; what decides the year is whether each restart holds longer than the last. Yours are.`);
    if (blockCurve && blockCurve.spread >= 25)
      raise("month", "warm", `Week ${blockCurve.worst.week} of a block is where your sessions go missing — ${blockCurve.worst.pct}% against ${blockCurve.best.pct}% in your best week. That's consistent enough to design around rather than fight: the next block puts the easier week there deliberately.`);
    if (domsLag && domsLag.worst === 2)
      raise("week", "warm", `Hard sessions catch up with you on the second morning, not the first — you drop about ${Math.abs(domsLag.d2)} recovery points on day two against ${Math.abs(domsLag.d1)} on day one. Worth knowing when you're spacing the heavy days; the day after is not the one to protect.`);
    if (byDuration && byDuration.favourite.share >= 55 && byDuration.favourite.k === "short")
      raise("month", "warm", `Most of what you finish is thirty minutes or under. That's not a limitation — it's the length you'll actually do, and a block built out of it beats a better one built out of sessions you skip.`);
    if (byTimeOfDay && byTimeOfDay.best.share >= 60)
      raise("month", "warm", `${byTimeOfDay.best.slot.charAt(0).toUpperCase() + byTimeOfDay.best.slot.slice(1)} is where ${byTimeOfDay.best.share}% of your sessions happen. A consistent time is the strongest cue there is for making this automatic — protecting that slot is worth more than any change to the training.`);
    if (costByClass && costByClass.length >= 3)
      raise("month", "warm", `Measured rather than assumed: ${costByClass[0].name} costs you ${Math.abs(costByClass[0].delta)} recovery points the next morning, more than anything else you do. ${costByClass[costByClass.length - 1].name} costs ${costByClass[costByClass.length - 1].delta > 0 ? "nothing — you wake up better after it" : `only ${Math.abs(costByClass[costByClass.length - 1].delta)}`}. That's your data, not the library's rating.`);

    /* Weekly import means today's recovery is often not in yet. Say so
       rather than quietly prescribing as though it were. */
    if (!recValue && !restDay && !loggedToday)
      raise("day", "warm", `I don't have your recovery for this morning, so today's pick is coming from your programme, what you did yesterday and your shoulder — not from how you actually slept. If you want it sharper, the number is one tap into the morning card; the weekly import will overwrite it with the exact value when it lands.`);
    if (!recValue && importGap !== null && importGap >= 5 && illnessFlags.length)
      raise("day", "warm", `Worth knowing that the early-warning signals I have are ${importGap} days old — skin temperature and breathing rate can't be typed in by hand, so they only arrive with the export. If you feel something coming on, a fresh import today would make that reading current rather than historical.`);

    /* PATTERNS SHE COULDN'T SEE HERSELF. These only surface once, gently —
       they are observations, not accusations. */
    if (voicePatterns.length) {
      const p0 = voicePatterns[0];
      raise(p0.kind === "season" ? "year" : p0.kind === "trend" ? "month" : "week", "warm",
        `${p0.text} That's from what you've written rather than anything I've measured — worth knowing about yourself, and worth planning around rather than being surprised by each time.`);
    }
    if (thisSeason && seasonPast.length >= 6) {
      const low = seasonPast.filter((x) => x.tags.includes("low") || x.tags.includes("reluctance")).length;
      if (low / seasonPast.length >= 0.3)
        raise("month", "warm", `We're into ${thisSeason.label.toLowerCase()} — the stretch where you've historically written most about finding it hard. Nothing is wrong; it's just the time of year that has cost you before. Worth deciding now what the minimum looks like, while it's still a decision rather than a struggle.`);
    }

    /* THE RECORD follows up. Asking once and never again is how a niggle
       becomes an injury nobody noticed forming. */
    issueFollowUp.slice(0, 2).forEach((iss, n) => {
      const h = historyFor(iss);
      const last = (iss.tried || []).slice(-1)[0];
      const days = Math.round((parse(t) - parse(last ? last.date : iss.date)) / 86400000);
      raise("day", n === 0 ? "push" : "warm",
        last
          ? `How is "${iss.text}" now? You tried ${last.what} ${days} days ago and said it ${last.helped >= 4 ? "helped" : "didn't do much"}. Tell me where it's at and I'll adjust today around it.`
          : `You mentioned "${iss.text}" ${days} days ago. How is it now? If it's settled I'll close it off; if it isn't, that changes what today should be.`);
    });
    recurring.slice(0, 1).forEach((r) => {
      const bits = [`This is the ${r.occurrences === 2 ? "second" : r.occurrences === 3 ? "third" : `${r.occurrences}th`} time you've told me about this`];
      if (r.gapDays) bits.push(`the last one was ${r.gapDays} days ago`);
      if (r.helped.length) bits.push(`what shifted it before was ${r.helped[0].what}`);
      if (r.suspects.length) bits.push(`and ${r.suspects[0].type} was in the few days before ${r.suspects[0].n} of them — worth treating as a suspect rather than a coincidence`);
      raise("month", "firm", `${bits.join(", ")}. Recurring is different from a one-off: something is causing it rather than it just happening.`);
    });

    /* THE RETURN. This is the most important thing the coach does. The
       evidence is consistent: what determines whether a lapse becomes a
       dropout is the response to it. Self-compassion predicts re-engagement;
       shame predicts the spiral. So no guilt, no accounting, no catch-up. */
    if (lapseState === "away")
      raise("day", "warm", `${daysSinceSession} days. That happens to everyone who trains for years — the people who keep going are not the ones who never stop, they're the ones who start again without making it mean something. Nothing to make up. Pick the easiest thing on the list and do that; the rest follows on its own.`, { lead: 2 });
    else if (lapseState === "drifting")
      raise("day", "push", `Two weeks running where more than a couple of sessions slipped. Not a verdict — a pattern worth naming while it's small. Usually it means the plan stopped fitting the week rather than anything about you. Tell me what's actually in the way and I'll build around it.`, { lead: 2 });
    else if (lapseState === "wobble")
      raise("day", "warm", `A couple missed this week. Genuinely fine — the habit research found missing one opportunity does nothing measurable to the process. It's the repeated weeks that count, and this is one week.`, { lead: 2 });

    if (habitStrength !== null && habitStrength < 45 && weeksTraining >= 3)
      raise("week", "warm", `You're ${weeksTraining} weeks in. Exercise takes around three months to stop being a decision — so if it still takes effort to start, that is the normal timeline rather than a sign of anything. Keep the days consistent and it gets cheaper on its own.`);
    if (cueConsistency !== null && cueConsistency < 60 && weeksTraining >= 3)
      raise("week", "push", `Your sessions are landing on scattered days. That's still training, but it stays a decision every time — and decisions are what run out on the tired days. Same days each week is the cheapest change available to you: not more work, just more predictable work.`);
    if (barrierWins >= 3)
      raise("month", "warm", `${barrierWins} sessions this month on days when something was against you — low recovery, short sleep, or coming off a gap. That is the specific thing that predicts still training a year from now, more than any number in the strength battery.`);
    if (affectByClass.length >= 2 && affectByClass[0].score >= 1)
      raise("month", "warm", `${affectByClass[0].name} is the one that reliably feels good while you're doing it. That matters more than it sounds — how a session feels during is one of the better predictors of whether you'll do it again. Worth keeping it in the week even when it isn't the obvious training choice.`);
    if (givesBack !== null && givesBack < -0.5)
      raise("month", "push", "Your sessions have been feeling harder in the room than they leave you feeling afterwards. Training should give more back than it takes, on average — when it stops doing that it's usually intensity rather than anything about you. Worth dropping a notch for a fortnight and seeing if it turns around.");
    if (affectMean !== null && affectMean <= -1)
      raise("week", "firm", `Your sessions have been feeling hard in the room lately, not just afterwards. That's worth taking seriously rather than pushing through — it's an early dropout signal, and the usual cause is intensity creeping above where it needs to be. Let's drop it a notch and see if the feeling comes back.`);
    if (weeksTraining >= 14)
      raise("year", "warm", `${weeksTraining} weeks. Median dropout in beginner cohorts is around fourteen — you're past the point where most people stop, and women over fifty are the age group with the highest sustained-participation rate of all. This is the least arguable evidence in the app.`);

    /* MONTH */
    if (variety28 >= 5)
      raise("month", "warm", `${variety28} different classes this month. Variety is one of the few things that reliably predicts still being here next year, so this counts for more than it looks.`);
    if (variety28 <= 2 && totalSessions >= 12)
      raise("month", "push", "You've done the same one or two classes all month. Pick something you haven't touched — novelty is what stops this going stale.");
    if (monthDone >= monthTarget)
      raise("month", "warm", `${monthDone} sessions this month against a target of ${monthTarget}. That's a month you'd have found unimaginable a year ago.`);
    /* `weekRun` counts consecutive target-hitting weeks and resets to zero on
       one week below — which is a streak, and rule 25 forbids streaks because
       they punish a single bad week. `weeksHit` says the same encouraging
       thing without the reset, so that is what gets said. */
    if (weeksHit >= 3)
      raise("month", "warm", `${weeksHit} weeks where you hit your number. Weeks are the unit that matters — days are too small to mean much, and these ones don't expire.`);

    /* QUARTER + YEAR */
    if (totalSessions >= 25 && totalHours >= 10)
      raise("quarter", "warm", `${Math.round(totalHours)} hours of training banked, across ${totalSessions} sessions. That's the ledger, and it only goes up.`);
    if (weeksHit >= 12)
      raise("year", "warm", `${weeksHit} weeks where you did what you said you'd do. Most people who start something like this are gone inside four months.`);

    const nudge = nudges[0] || agenda[0] || null;
    const byScope = (sc) => agenda.filter((a) => a.scope === sc);
    if (!agenda.length)
      raise("day", "warm", totalSessions
        ? `${totalSessions} sessions behind you now. Nothing urgent from me today — which, if you think about it, is the goal.`
        : "Nothing to report yet. Log the first session and I'll have something to work with.");

    /* WHAT THE COACH SAYS FIRST.

       This used to be a tone sort: firm, then push, then warm. Since every
       chase is firm and every kind line is warm, the app opened with an
       accounting item even on the day she said she could not face it — and the
       chat opener is built from the same two lines.

       Anything carrying `lead` comes first. When something does, the rest of
       the opening is warm only: training becomes secondary when mood leads
       (rule 4), and a break is met with the easiest way back in and no
       accounting (rule 24). Admin never leads at all — the measurement card
       owns those. */
    const allLeads = agenda.filter((a) => a.lead && !a.admin).sort((a, b) => a.lead - b.lead);
    /* Only the most urgent kind of lead speaks. Mood (1) outranks a lapse (2)
       and excludes it: on a day she has said she cannot face this, following
       the feeling with "two weeks where sessions slipped" is still leading
       with training, just one line later. */
    const leads = allLeads.filter((a) => a.lead === (allLeads[0] || {}).lead);
    const rest = agenda.filter((a) => !a.lead && !a.admin);
    const leading = (leads.length
      ? [...leads, ...rest.filter((a) => a.tone === "warm")]
      : [rest.find((a) => a.tone === "firm"),
         rest.find((a) => a.tone === "push"),
         rest.find((a) => a.tone === "warm")]
    ).filter(Boolean).slice(0, 3);

    /* ---- trends across weeks, never across days ---- */
    const trendFor = (id) => trendOf(wKeys.map((k) => Number(weekly[k][id])));

    let message;
    if (loggedToday?.completed) message = `Logged. That's ${weekDone} of ${target} this week.`;
    else if (restDay) message = "Rest day. Recovery is part of the plan, not a gap in it.";
    else if (consistency >= 70) message = "You've been reliable this month. Keep the line moving.";
    else if (totalSessions === 0) message = "First session is the only hard one. Everything after is maintenance.";
    else message = "One session today puts the week back on track.";

    const mission = session?.cue || "";




    return {
      t, ws, mk, weekDays, done, isScheduled, consistency,
      weekDone, target, monthDone, monthTarget, totalSessions,
      weeksHit, weekRun, avgPerWeek, totalHours, totalMinutes,
      pbs,
      planned, session, hasPlan, pos, themes, prescribed, themeGoal, bet, betsWon, betsTaken, phase, season, seasonTarget, themesAuto, auto,
      verdict, confidence, health, recBaseline, analysis, improving, declining, holding, overall, nudge, nudges, agenda, block, bodywork, easiest, moodToday, learned, swaps, writing, restarts, byDuration, blockCurve, domsLag, costByClass, extraDays, byTimeOfDay, voice, voicePatterns, thisSeason, seasonPast, issues, openIssues, historyFor, priorSessions, issueFollowUp, recurring, tagIssue, goals, openGoals, mobRows, mobScored, mobWeakest, mobAsym, mobScore, mobDue, mobDaysAgo, dailyDrills, goalCheckDue, MOBILITY_TESTS: mobTests, DRILLS: drills, mobTests, drills, lapseState, daysSinceSession, missedThisWeek,
      ladder, ladderWhy, physicalSignal, smallerDoor, movedOn, touched,
      profile, profileBelieved, observed, whyEntries, confidenceOf, whyDue,
      WHY_TREES, whyTree, whyReason, whyLabel, whyTag,
      daysSinceMovement, movedDays28, touchedDays28, stillMoving, cueConsistency, habitStrength, weeksTraining, barrierWins, affectMean, afterMean, givesBack, affectByClass, therapy28, supportResponse, reactiveResponse, THERAPIES, importGap, importDue, lastImport, trainedYesterday, shoulderAM, shoulderVerdict, shoulderAMTrend, program, programPhases, livePhase, capture, calibrating, weeksIntoBlock, blockWeeksLeft, reviewDue, blockReview, proposal, DESIGN_RULES, allClasses, programWeek, programPhase, programDays, BLOCKS, vitals: vitalDefs, allMetrics, sets7, setsMet, setsShort, groupsOf, reading, bodyRows, acute, chronic, acwr, acwrBand, covered, hasLoad, loadOfDay, adaptation, leading, byScope, rhrDrift, hrvDrift, dormant, variety28, ctx, trendFor, shoulderFrozen, recValue, lowComfort, restDay, loggedToday, recovery, message, mission, weeklyDue, monthlyDue, weeklyToday, monthlyToday, weeklyLate, monthlyLate, weeklyAssessDay, monthlyAssessDay, nextAssessDay,
    };
  }, [data]);
}

/* ============================================================================
   6. UI PIECES
   ==========================================================================*/
const Card = ({ children, style = {}, ...p }) => (
  <div className="rise" style={{ background: C.card, borderRadius: 18, border: "none", boxShadow: "0 1px 2px rgba(43,27,46,0.05), 0 6px 20px rgba(43,27,46,0.04)", padding: 20, ...style }} {...p}>{children}</div>
);

const Eyebrow = ({ children, color = C.muted }) => (
  <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color, marginBottom: 8 }}>{children}</div>
);

const WeekSpine = ({ coach, big = false, selected, onPick }) => {
  const size = big ? 46 : 32;
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {coach.weekDays.map((d) => {
        const isDone = coach.done(d);
        const sched = coach.isScheduled(d);
        const isToday = d === coach.t;
        const isSel = selected === d;
        /* Rule 24: one missed session is invisible. Painting it in the alarm
           colour left a standing reproach at the top of the landing page for
           the rest of the week. A day she did not train reads as a day she did
           not train — nothing more. */
        const missed = false;
        const future = d > coach.t;
        const bg = isDone ? C.moss : missed ? "rgba(194,84,47,0.10)" : isSel ? C.pist : "transparent";
        const fg = isDone ? "#FFFFFF" : missed ? C.clay : isSel ? C.signal : C.muted;
        return (
          <button key={d} onClick={() => onPick && !future && onPick(d)} className="tap" style={{
            flex: 1, padding: 0, border: "none", background: "transparent",
            cursor: onPick && !future ? "pointer" : "default", opacity: future ? 0.4 : 1,
          }}>
            <div style={{
              height: size, borderRadius: 13, background: bg,
              border: isSel && !isDone ? `1.5px solid ${C.signal}` : isDone || missed ? "none" : `1px solid ${C.line}`,
              color: fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
            }}>
              <span className="mono" style={{ fontSize: big ? 10 : 11, fontWeight: 600 }}>{dayName(d)[0]}</span>
              {big && <span className="mono" style={{ fontSize: 9, opacity: 0.75 }}>{Number(d.slice(8))}</span>}
            </div>
            {isToday && <div style={{ height: 3, width: 3, borderRadius: 3, background: C.signal, margin: "5px auto 0" }} />}
          </button>
        );
      })}
    </div>
  );
};



/* Her question, 8 August: "Why can't I type? Why does it always have to be
   through the microphone?" — every one of these has always taken typing. But
   on a phone a pale hairline box next to a big round microphone reads as a
   label beside a button. A visible border and a little more height is the
   whole fix. The microphone is the alternative, not the requirement. */
const inputStyle = { width: "100%", padding: "12px 13px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: C.chalk, color: C.ink, minHeight: 44 };

/* shared chart styling — used by Progress and the WHOOP log */
const axis = { stroke: C.muted, fontSize: 10, tickLine: false, axisLine: false };
const chartBox = { fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" };
const tip = { borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 };


const Field = ({ label, unit, value, onChange, type = "number", pb }) => (
  <label style={{ display: "block", marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span className="mono" style={{ fontSize: 10, color: pb ? C.ochre : C.muted }}>{pb ? `PB ${pb}` : unit}</span>
    </div>
    <input type={type} inputMode={type === "number" ? "decimal" : "text"} value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, fontFamily: type === "number" ? "'IBM Plex Mono', monospace" : "'IBM Plex Sans', sans-serif" }} />
  </label>
);

const Scale = ({ label, value, onChange, max = 5, lo, hi, pb }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      {pb && <span className="mono" style={{ fontSize: 10, color: C.ochre }}>PB {pb}</span>}
    </div>
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button key={n} onClick={() => onChange(String(n))} className="tap mono" style={{
          flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer",
          border: `1.5px solid ${String(value) === String(n) ? C.ink : C.line}`,
          background: String(value) === String(n) ? C.ink : "transparent",
          color: String(value) === String(n) ? C.chalk : C.muted, fontSize: 12, fontWeight: 600,
        }}>{n}</button>
      ))}
    </div>
    {(lo || hi) && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: C.muted }}><span>{lo}</span><span>{hi}</span></div>}
  </div>
);

/* Rule 22: typing is friction, and friction is why people stop. Every box that
   takes her words takes her voice too. */
const Note = ({ label, value, onChange, hint }) => (
  <div style={{ display: "block", marginBottom: 12 }}>
    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>{label}</div>
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <textarea rows={2} value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder="Type here, or use the microphone"
        style={{ ...inputStyle, resize: "vertical", marginBottom: 0, fontFamily: "'IBM Plex Sans', sans-serif" }} />
      <MicButton onText={onChange} current={value || ""} />
    </div>
    {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 5, lineHeight: 1.45 }}>{hint}</div>}
  </div>
);

const Tag = ({ children, tone }) => (
  <span className="mono" style={{
    fontSize: 10, letterSpacing: "0.04em", padding: "4px 9px", borderRadius: 20,
    border: `1px solid ${tone === "warn" ? C.clay : C.line}`,
    color: tone === "warn" ? C.clay : C.muted, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Btn = ({ children, onClick, kind = "solid", style = {} }) => {
  const base = { width: "100%", padding: "14px 16px", borderRadius: 11, cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" };
  const kinds = {
    solid: { background: C.ink, color: C.chalk, border: `1px solid ${C.ink}` },
    signal: { background: C.signal, color: C.chalk, border: `1px solid ${C.signal}` },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.line}` },
    quiet: { background: "transparent", color: C.muted, border: "none", padding: "10px 0", fontSize: 13, fontWeight: 500 },
  };
  return <button onClick={onClick} className="tap" style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
};

/* renders one assessment field according to its type */
const RungPicker = ({ f, rung, onRung }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: "flex", gap: 4 }}>
      {f.rungs.map((r, i) => (
        <button key={r} onClick={() => onRung(i)} className="tap" style={{
          flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500, lineHeight: 1.2,
          border: `1.5px solid ${Number(rung) === i ? C.signal : C.line}`,
          background: Number(rung) === i ? C.signal : "transparent",
          color: Number(rung) === i ? C.chalk : C.muted,
        }}>{r}</button>
      ))}
    </div>
  </div>
);

const NumRow = ({ label, unit, cells, pb }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span className="mono" style={{ fontSize: 10, color: pb ? C.ochre : C.muted }}>{pb ? `PB ${pb}` : unit}</span>
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      {cells.map((c, i) => (
        <div key={i} style={{ flex: 1 }}>
          <input type="text" inputMode="decimal" placeholder={c.ph} value={c.value ?? ""}
            onChange={(e) => c.onChange(e.target.value)}
            style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} />
        </div>
      ))}
    </div>
  </div>
);

/* renders one battery exercise according to its shape */
const AssessInput = ({ f, form, set, pb, target }) => {
  if (f.type === "note") return <Note label={f.label} value={form[f.id]} onChange={(v) => set(f.id, v)} />;
  if (f.type === "scale") return <Scale label={f.label} value={form[f.id]} onChange={(v) => set(f.id, v)} max={f.max || 5} pb={pb} />;

  const rungKey = f.id + "__rung";
  const rung = form[rungKey] ?? f.rung ?? 0;
  const ladder = f.rungs?.length > 1;

  /* mobility ladder: the rung IS the result, no number to log */
  if (f.type === "rung") {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{f.label}</div>
        <RungPicker f={f} rung={rung} onRung={(i) => { set(rungKey, i); set(f.id, i + 1); }} />
      </div>
    );
  }

  const loadNow = f.type === "weightreps" ? loadOf(form, f) : NaN;
  const cells = f.type === "weightreps"
    ? (f.bilateral
        ? [{ ph: "kg", value: form[f.id + "__w"], onChange: (v) => set(f.id + "__w", v) },
           { ph: "L reps", value: form[f.id + "__L"], onChange: (v) => { set(f.id + "__L", v); set(f.id, v); } },
           { ph: "R reps", value: form[f.id + "__R"], onChange: (v) => set(f.id + "__R", v) }]
        : [{ ph: "kg", value: form[f.id + "__w"], onChange: (v) => set(f.id + "__w", v) },
           { ph: "reps", value: form[f.id], onChange: (v) => set(f.id, v) }])
    : f.bilateral
      ? [{ ph: "left", value: form[f.id + "__L"], onChange: (v) => { set(f.id + "__L", v); set(f.id, v); } },
         { ph: "right", value: form[f.id + "__R"], onChange: (v) => set(f.id + "__R", v) }]
      : [{ ph: f.type === "time" ? "mm:ss" : f.unit, value: form[f.id], onChange: (v) => set(f.id, v) }];

  return (
    <div style={{ marginBottom: 4 }}>
      {target && (
        <div className="mono" style={{ fontSize: 10, color: C.signal, marginBottom: 4, letterSpacing: "0.04em", lineHeight: 1.45 }}>
          last {target.last} → {f.type === "weightreps" ? target.aim : `aim for ${target.aim}`}
        </div>
      )}
      {f.type === "weightreps" && !isNaN(loadNow) && (
        <div className="mono" style={{ fontSize: 10.5, color: C.moss, marginTop: 5 }}>
          that's {Math.round(loadNow)} kg moved
        </div>
      )}
      {ladder && (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{f.label}</div>
          <RungPicker f={f} rung={rung} onRung={(i) => set(rungKey, i)} />
        </>
      )}
      <NumRow label={ladder ? f.rungs[rung] : f.label} unit={f.unit} cells={cells} pb={pb} />
    </div>
  );
};

/* ============================================================================
   7. SCREENS
   ==========================================================================*/

/* ---- one session, editable in place -------------------------------------
   The tags above the name are the class's own attributes, so editing them
   here edits the class everywhere. The note belongs to this session on this
   day only. Both go to the coach.
------------------------------------------------------------------------ */

/* ---- a row you open when you want it, closed the rest of the time ------- */
function Fold({ title, note, accent, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.card, borderRadius: 16, overflow: "hidden",
      boxShadow: "0 1px 2px rgba(43,27,46,0.05), 0 6px 20px rgba(43,27,46,0.04)" }}>
      <button onClick={() => setOpen(!open)} className="tap" style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "16px 18px",
        border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{title}</div>
          {note && <div style={{ fontSize: 12, color: accent || C.muted, marginTop: 3 }}>{note}</div>}
        </div>
        <span style={{ fontSize: 11, color: C.muted, transform: open ? "rotate(90deg)" : "none",
          transition: "transform .15s", display: "inline-block" }}>▸</span>
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

function SessionBlock({ cls, note, minutes, onNote, onMinutes, onClass, onRemove, primary,
                       custom, name, onName }) {
  const [editing, setEditing] = useState(false);
  const [showNote, setShowNote] = useState(!!note || custom);
  if (!cls && !custom) return null;

  return (
    <div style={{ paddingTop: primary ? 0 : 14, borderTop: primary ? "none" : `1px solid ${C.line}` }}>
      {!primary && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          {custom ? (
            <input type="text" value={name ?? ""} onChange={(e) => onName(e.target.value)}
              placeholder="What did you do?"
              style={{ ...inputStyle, flex: 1, padding: "8px 10px", marginBottom: 0, fontSize: 14, fontWeight: 500 }} />
          ) : (
            <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{cls.name}</div>
          )}
          <input type="text" inputMode="decimal" value={minutes ?? ""} onChange={(e) => onMinutes(e.target.value)}
            style={{ ...inputStyle, width: 60, padding: "7px 9px", marginBottom: 0, textAlign: "center",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }} />
          <span className="mono" style={{ fontSize: 10, color: C.muted }}>min</span>
          {onRemove && (
            <button onClick={onRemove} className="tap" aria-label="Remove this session" style={{
              border: `1px solid ${C.line}`, borderRadius: 8, background: "transparent", cursor: "pointer",
              color: C.clay, fontSize: 11, fontWeight: 600, padding: "6px 9px", fontFamily: "inherit",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>Remove</button>
          )}
        </div>
      )}

      {custom ? null : (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <Tag>{cls.goal}</Tag>
        <Tag>intensity {cls.intensity}/5</Tag>
        <Tag>recovery cost {cls.recoveryCost}/5</Tag>
        <Tag tone={cls.shoulderLoad === "high" ? "warn" : undefined}>{cls.shoulderLoad} shoulder load</Tag>
        <button onClick={() => setEditing(!editing)} className="tap" style={{
          border: "none", background: "transparent", cursor: "pointer", padding: "2px 4px",
          fontSize: 11, color: C.signal, fontWeight: 500,
        }}>{editing ? "done" : "edit"}</button>
      </div>
      )}

      {editing && !custom && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: C.chalk }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>Primary goal</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            {GOALS.map((g) => (
              <button key={g} onClick={() => onClass({ goal: g })} className="tap mono" style={{
                padding: "6px 10px", borderRadius: 7, cursor: "pointer", fontSize: 10.5, fontWeight: 500,
                border: `1.5px solid ${cls.goal === g ? C.signal : C.line}`,
                background: cls.goal === g ? C.signal : "transparent", color: cls.goal === g ? C.chalk : C.muted,
              }}>{g}</button>
            ))}
          </div>
          <Scale label="Intensity" value={cls.intensity} onChange={(v) => onClass({ intensity: Number(v) })} max={5} lo="very easy" hi="all out" />
          <Scale label="Recovery cost" value={cls.recoveryCost} onChange={(v) => onClass({ recoveryCost: Number(v) })} max={5} lo="none" hi="needs a day" />
          <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>Shoulder load</div>
          <div style={{ display: "flex", gap: 5 }}>
            {LOADS.map((l) => (
              <button key={l} onClick={() => onClass({ shoulderLoad: l })} className="tap mono" style={{
                flex: 1, padding: "8px 0", borderRadius: 7, cursor: "pointer", fontSize: 10.5, fontWeight: 500,
                border: `1.5px solid ${cls.shoulderLoad === l ? C.signal : C.line}`,
                background: cls.shoulderLoad === l ? C.signal : "transparent", color: cls.shoulderLoad === l ? C.chalk : C.muted,
              }}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.45 }}>
            These belong to the class, so the change sticks for every time you do it.
          </div>
        </div>
      )}

      {showNote ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea rows={2} value={note || ""} onChange={(e) => onNote(e.target.value)}
            placeholder="How it went, what you changed, what hurt"
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5, marginBottom: 0, fontSize: 13.5 }} />
            <MicButton onText={onNote} current={note || ""} />
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNote(true)} className="tap" style={{
          border: "none", background: "transparent", cursor: "pointer", padding: "10px 0 0",
          fontSize: 11.5, color: C.muted, fontWeight: 500,
        }}>+ note on this session</button>
      )}
    </div>
  );
}

/* Session load is minutes x effort. The app had minutes and no effort, which
   made forty-five minutes of stretching look identical to forty-five minutes
   of BODYPUMP. This is the missing half, and it costs one tap. */
const RPE_NOTE = {
  1: "barely registered", 2: "very easy", 3: "easy", 4: "comfortable", 5: "moderate",
  6: "working", 7: "hard", 8: "very hard", 9: "nearly everything", 10: "everything",
};
function RpeTap({ value, onChange }) {
  const v = Number(value) || 0;
  return (
    <div style={{ marginTop: 14, padding: "13px 15px", background: C.chalk, borderRadius: 12 }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 3 }}>
        how hard was that
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 10 }}>
        {v ? `${v} out of 10 — ${RPE_NOTE[v]}.` : "One tap. It's the number every other number is built on."}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button key={n} onClick={() => onChange(String(n))} className="tap" style={{
            flex: 1, padding: "10px 0", borderRadius: 9, cursor: "pointer",
            fontSize: 12.5, fontWeight: v === n ? 700 : 500,
            fontFamily: "'IBM Plex Mono', monospace",
            border: `1.5px solid ${v === n ? C.signal : C.line}`,
            background: v === n ? C.signal : "transparent",
            color: v === n ? "#fff" : C.muted,
          }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

/* Sets are the dose that actually decides whether muscle is held. Six to ten
   per muscle per week is the figure the research puts on it for a woman past
   menopause, and no amount of counting sessions can see it. One tap, and only
   on days where sets are a meaningful idea. */
function SetsTap({ value, onChange }) {
  const v = Number(value) || 0;
  return (
    <div style={{ marginTop: 10, padding: "13px 15px", background: C.chalk, borderRadius: 12 }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 3 }}>
        roughly how many working sets
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 10 }}>
        {v ? `${v} sets.` : "A rough count is fine. Skip it on classes where sets don't apply."}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {[0, 4, 6, 8, 10, 12, 16, 20].map((n) => (
          <button key={n} onClick={() => onChange(String(n))} className="tap" style={{
            flex: "1 1 20%", padding: "10px 0", borderRadius: 9, cursor: "pointer",
            fontSize: 12.5, fontWeight: v === n ? 700 : 500,
            fontFamily: "'IBM Plex Mono', monospace",
            border: `1.5px solid ${v === n ? C.moss : C.line}`,
            background: v === n ? C.moss : "transparent",
            color: v === n ? "#fff" : C.muted,
          }}>{n === 0 ? "n/a" : n}</button>
        ))}
      </div>
    </div>
  );
}

/* Body work she books herself. The coach never prescribes it, but it changes
   what the next session can be — so logging it has to be easy. */
/* How it felt DURING the session. Not afterwards — during is the one that
   predicts whether she does it again. */
/* Some mornings the obstacle isn't the training. This is the way in when
   that's the case — one tap, and the coach starts with the feeling rather
   than the plan. */
/* Things she wants to be able to do. Added in her own words, scored weekly,
   and fed into the monthly design — not a wish list, an input. */
/* The mobility battery. Every test carries its protocol and its reason, so
   she can do it properly without looking anything up. */
function MobilitySheet({ data, setData, coach, close }) {
  const wk = coach.ws;
  const [entry, setEntry] = useState(() => ({ ...(data.mobility?.[wk] || {}) }));
  const [open, setOpen] = useState(null);

  const put = (id, patch) => setEntry((e) => ({ ...e, [id]: { ...(e[id] || {}), ...patch } }));
  const save = () => {
    setData((d) => ({ ...d, mobility: { ...(d.mobility || {}), [wk]: entry } }));
    close();
  };

  return (
    <div>
      <Eyebrow color={C.signal}>Mobility & flexibility</Eyebrow>
      <h1 className="disp" style={{ fontSize: 26, fontWeight: 400, lineHeight: 1.15, margin: "2px 0 8px" }}>
        Where your body still goes
      </h1>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, marginBottom: 18 }}>
        Weekly, same day each time, unwarmed or lightly warmed — but consistently one or the other,
        or the numbers won't compare. Tap any test for how to do it and why it matters.
      </div>

      {(coach.mobTests || []).map((m) => {
        const e = entry[m.id] || {};
        const isOpen = open === m.id;
        return (
          <Card key={m.id} style={{ marginBottom: 11 }}>
            <button className="tap" onClick={() => setOpen(isOpen ? null : m.id)} style={{
              border: "none", background: "transparent", cursor: "pointer", padding: 0,
              width: "100%", textAlign: "left", display: "block", marginBottom: 10 }}>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{m.label}</span>
                <span className="mono" style={{ fontSize: 10.5, color: C.muted }}>
                  {m.unit}{m.side ? " · L/R" : ""} {isOpen ? "▴" : "▾"}
                </span>
              </span>
            </button>

            {isOpen && (
              <div style={{ marginBottom: 12, padding: "12px 14px", background: C.chalk, borderRadius: 11 }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink, marginBottom: 8 }}>{m.how}</div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted }}>{m.why}</div>
              </div>
            )}

            {m.side ? (
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ flex: 1 }}>
                  <Field label="Left" unit={m.unit.replace("/", "of ")} value={e.l || ""}
                    onChange={(v) => put(m.id, { l: v })} />
                </span>
                <span style={{ flex: 1 }}>
                  <Field label="Right" unit={m.unit.replace("/", "of ")} value={e.r || ""}
                    onChange={(v) => put(m.id, { r: v })} />
                </span>
              </div>
            ) : (
              <Field label="Score" unit={m.unit.replace("/", "of ")} value={e.v || ""}
                onChange={(v) => put(m.id, { v })} />
            )}
          </Card>
        );
      })}

      <Btn kind="signal" onClick={save}>Save this week</Btn>
      <div style={{ marginTop: 8 }}><Btn kind="quiet" onClick={close}>Close without saving</Btn></div>
    </div>
  );
}

/* Tell the coach anything. It writes it down, checks whether it has happened
   before, and asks again in a couple of days. */
function RecordCard({ data, setData, coach, setSheet }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [trying, setTrying] = useState(null);
  const [what, setWhat] = useState("");

  const add = () => {
    if (!text.trim()) return;
    const entry = { id: newId(), date: coach.t, text: text.trim(),
      tags: tagIssue(text), status: "open", tried: [] };
    setData((d) => ({ ...d, issues: [...(d.issues || []), entry] }));
    setText(""); setAdding(false);
    setSheet({ kind: "chat", about: "something I've noticed",
      seed: `${entry.text} — what should I do about it?` });
  };
  const logTried = (id, whatDone, helped) => setData((d) => ({ ...d,
    issues: (d.issues || []).map((i) => i.id === id
      ? { ...i, tried: [...(i.tried || []), { date: coach.t, what: whatDone, helped }] } : i) }));
  const close = (id) => setData((d) => ({ ...d,
    issues: (d.issues || []).map((i) => i.id === id ? { ...i, status: "closed", closedOn: coach.t } : i) }));

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <Eyebrow>Anything you've noticed</Eyebrow>
        {coach.issues.length > 0 && (
          <span className="mono" style={{ fontSize: 10, color: C.muted }}>{coach.issues.length} on record</span>
        )}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginBottom: coach.openIssues.length ? 12 : 14 }}>
        A tight back, a sore knee, a question, a bad night. Tell me and I'll write it down — then I'll
        ask how it is in a couple of days, and I'll remember if it comes back.
      </div>

      {coach.openIssues.map((iss) => {
        const h = coach.historyFor(iss);
        const last = (iss.tried || []).slice(-1)[0];
        return (
          <div key={iss.id} style={{ padding: "12px 0", borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.45, color: C.ink, fontWeight: 600 }}>{iss.text}</div>
            <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              {iss.date}{h.occurrences >= 2 ? ` · ${h.occurrences}th time` : ""}
            </div>

            {h.occurrences >= 2 && (
              <div style={{ marginTop: 9, padding: "11px 13px", background: C.pist, borderRadius: 10 }}>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: C.ink }}>
                  You've had this before{h.gapDays ? `, ${h.gapDays} days ago` : ""}.
                  {h.helped.length
                    ? ` What helped then: ${h.helped.slice(0, 2).map((x) => x.what).join(", ")}.`
                    : " Nothing was recorded as helping last time."}
                </div>
                {h.suspects.length > 0 && (
                  <div style={{ fontSize: 12, lineHeight: 1.55, color: C.ink, marginTop: 7 }}>
                    Both times, <strong style={{ fontWeight: 600 }}>{h.suspects[0].type}</strong> was in
                    the few days before. Worth a look — it may be nothing, but it's the pattern.
                  </div>
                )}
              </div>
            )}

            {last && (
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 7 }}>
                Last tried {last.what} — {last.helped >= 4 ? "helped" : last.helped >= 3 ? "some help" : "didn't help"}
              </div>
            )}

            {trying === iss.id ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
                  <textarea rows={2} value={what} onChange={(e) => setWhat(e.target.value)}
                    placeholder="What did you do about it?"
                    style={{ ...inputStyle, marginBottom: 0, resize: "none", lineHeight: 1.45 }} />
                  <MicButton onText={setWhat} current={what} />
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>Did it help?</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} className="tap"
                      onClick={() => { logTried(iss.id, what || "unspecified", n); setWhat(""); setTrying(null); }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9, cursor: "pointer", fontSize: 11,
                        border: `1.5px solid ${C.line}`, background: "transparent", color: C.muted }}>
                      {["no", "barely", "some", "yes", "gone"][n - 1]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, marginTop: 9, flexWrap: "wrap" }}>
                <button className="tap" onClick={() => setTrying(iss.id)} style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: "6px 0",
                  fontSize: 12, color: C.signal, fontWeight: 600 }}>What I tried</button>
                <button className="tap" onClick={() => setSheet({ kind: "chat", about: iss.text,
                  seed: `About "${iss.text}" — what should I be doing?` })} style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: "6px 0",
                  fontSize: 12, color: C.moss }}>Ask the coach</button>
                <button className="tap" onClick={() => close(iss.id)} style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: "6px 0",
                  fontSize: 12, color: C.muted }}>It's resolved</button>
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="My right lower back is tight again..."
              style={{ ...inputStyle, marginBottom: 0, resize: "none", lineHeight: 1.45 }} />
            <MicButton onText={setText} current={text} />
          </div>
          <Btn kind="signal" onClick={add}>Tell the coach</Btn>
          <div style={{ marginTop: 7 }}><Btn kind="quiet" onClick={() => setAdding(false)}>Cancel</Btn></div>
        </div>
      ) : (
        <div style={{ marginTop: coach.openIssues.length ? 12 : 0 }}>
          <Btn kind="ghost" onClick={() => setAdding(true)}>+ Tell me something</Btn>
        </div>
      )}
    </Card>
  );
}

function GoalsCard({ data, setData, coach, setSheet }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [scoring, setScoring] = useState(null);
  const goals = coach.openGoals;

  const add = () => {
    if (!text.trim()) return;
    setData((d) => ({ ...d, goals: [...(d.goals || []), {
      id: newId(), text: text.trim(), added: coach.t, status: "open", drills: [], scores: [],
    }] }));
    setText(""); setAdding(false);
  };
  const score = (id, value, note) => setData((d) => ({ ...d, goals: (d.goals || []).map((g) =>
    g.id === id ? { ...g, scores: [...(g.scores || []), { date: coach.t, value, note: note || "" }] } : g) }));
  const setStatus = (id, status) => setData((d) => ({ ...d, goals: (d.goals || []).map((g) =>
    g.id === id ? { ...g, status } : g) }));

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <Eyebrow color={C.signal}>Things you want to be able to do</Eyebrow>
        {coach.goalCheckDue.length > 0 && (
          <span style={{ fontSize: 10.5, color: C.signal }}>{coach.goalCheckDue.length} to check</span>
        )}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginBottom: goals.length ? 12 : 14 }}>
        Say it however it comes out — "get up from cross-legged without hands", "palms flat in a
        forward fold". I'll work out what it needs and build it into the month.
      </div>

      {goals.map((g) => {
        const last = (g.scores || []).slice(-1)[0];
        const first = (g.scores || [])[0];
        const due = coach.goalCheckDue.some((x) => x.id === g.id);
        return (
          <div key={g.id} style={{ padding: "12px 0", borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{g.text}</div>
            {last && (
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>
                Last tried: {last.value}/10{first && first !== last ? ` · started at ${first.value}` : ""}
                {last.note ? ` — "${last.note}"` : ""}
              </div>
            )}
            {scoring === g.id ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
                  Try it now. How close are you, out of ten?
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button key={n} className="tap" onClick={() => { score(g.id, n); setScoring(null); }}
                      style={{ flex: "1 1 8%", minWidth: 28, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                        fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
                        border: `1.5px solid ${C.line}`, background: "transparent", color: C.muted }}>{n}</button>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Btn kind="quiet" onClick={() => setScoring(null)}>Not now</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                <button className="tap" onClick={() => setScoring(g.id)} style={{
                  border: "none", background: due ? C.pist : "transparent", cursor: "pointer",
                  padding: due ? "7px 11px" : "7px 0", borderRadius: 8,
                  fontSize: 12, color: C.signal, fontWeight: 600 }}>
                  {due ? "Try it and score it" : "Score again"}
                </button>
                <button className="tap" onClick={() => setStatus(g.id, "won")} style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: "7px 0",
                  fontSize: 12, color: C.moss }}>I can do it</button>
                <button className="tap" onClick={() => setStatus(g.id, "retired")} style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: "7px 0",
                  fontSize: 12, color: C.muted }}>remove</button>
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="What do you want to be able to do?"
              style={{ ...inputStyle, marginBottom: 0, resize: "none", lineHeight: 1.45 }} />
            <MicButton onText={setText} current={text} />
          </div>
          <Btn kind="signal" onClick={add}>Add it</Btn>
          <div style={{ marginTop: 7 }}><Btn kind="quiet" onClick={() => setAdding(false)}>Cancel</Btn></div>
        </div>
      ) : (
        <div style={{ marginTop: goals.length ? 12 : 0 }}>
          <Btn kind="ghost" onClick={() => setAdding(true)}>+ Add something</Btn>
        </div>
      )}
    </Card>
  );
}

/* Ten minutes after a session, chosen by what the tests say is short. */
function DrillsCard({ coach, setSheet }) {
  if (!coach.dailyDrills.list.length) return null;
  return (
    <Card style={{ background: C.mint }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <Eyebrow color={C.moss}>Your ten minutes</Eyebrow>
        <span className="mono" style={{ fontSize: 10, color: C.muted }}>{coach.dailyDrills.mins} min</span>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginBottom: 12 }}>
        After whatever else you do today. These are chosen by what your mobility tests say is short —
        they change as the scores change.
      </div>
      {coach.dailyDrills.list.map((d, i) => (
        <div key={d.id} style={{ padding: "11px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{d.label}</span>
            <span className="mono" style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{d.mins}m</span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, marginTop: 4 }}>{d.how}</div>
          <div style={{ fontSize: 11, color: C.moss, marginTop: 4 }}>{d.targets}</div>
        </div>
      ))}
    </Card>
  );
}

function MoodCard({ log, write, setSheet, coach }) {
  const moods = [
    { v: "flat", label: "Flat", line: "I'm flat today and I don't know why." },
    { v: "low", label: "Low", line: "I'm in a bad mood and I can't face this." },
    { v: "tired", label: "Wiped", line: "I'm exhausted. Not sore — tired in myself." },
    { v: "frustrated", label: "Frustrated", line: "I'm frustrated with all of this." },
    { v: "good", label: "Good", line: "I feel good today." },
  ];
  const current = log?.mood;

  return (
    <Card>
      {/* Two words and five taps. Everything the card used to say out loud
          is behind the i — "I don't want too much writing on each card." */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <Eyebrow>How are you</Eyebrow>
        <InfoNote small why="Not your body — you. If today is hard, say so and we start there instead of with the session. Whatever you tap opens the coach on that, and it is remembered: over time it learns which days go well for you and which do not.">what this is</InfoNote>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {moods.map((m) => {
          const on = current === m.v;
          return (
            <button key={m.v} className="tap"
              onClick={() => { write({ mood: m.v }); setSheet({ kind: "chat", about: "how I'm feeling", seed: m.line }); }}
              style={{
                flex: "1 1 30%", padding: "11px 6px", borderRadius: 10, cursor: "pointer", fontSize: 12.5,
                border: `1.5px solid ${on ? C.ochre : C.line}`,
                background: on ? C.pist : "transparent",
                color: on ? C.ink : C.muted, fontWeight: on ? 600 : 400,
              }}>{m.label}</button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.5, color: C.muted, marginTop: 11 }}>
        Nothing here counts against you. A rest day you chose on purpose is a decision, not a miss.
      </div>
    </Card>
  );
}

/* When she trained. One tap, and it answers a question nothing else can:
   which part of the day actually produces sessions. */
function WhenTap({ value, onChange }) {
  const opts = [
    { v: "morning", label: "Morning" },
    { v: "midday", label: "Midday" },
    { v: "evening", label: "Evening" },
  ];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 7 }}>When did you do it?</div>
      <div style={{ display: "flex", gap: 5 }}>
        {opts.map((o) => {
          const on = value === o.v;
          return (
            <button key={o.v} onClick={() => onChange(o.v)} className="tap" style={{
              flex: 1, padding: "10px 0", borderRadius: 9, cursor: "pointer", fontSize: 11.5,
              border: `1.5px solid ${on ? C.moss : C.line}`,
              background: on ? C.moss : "transparent", color: on ? "#fff" : C.muted,
              fontWeight: on ? 600 : 400,
            }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function DuringTap({ value, onChange }) {
  const opts = [
    { v: 1, label: "grim" }, { v: 2, label: "hard" }, { v: 3, label: "fine" },
    { v: 4, label: "good" }, { v: 5, label: "great" },
  ];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 7, lineHeight: 1.4 }}>
        How did it feel <em>while you were doing it?</em>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {opts.map((o) => {
          const on = String(value) === String(o.v);
          return (
            <button key={o.v} onClick={() => onChange(String(o.v))} className="tap" style={{
              flex: 1, padding: "10px 0", borderRadius: 9, cursor: "pointer", fontSize: 11,
              border: `1.5px solid ${on ? C.moss : C.line}`,
              background: on ? C.moss : "transparent", color: on ? "#fff" : C.muted,
              fontWeight: on ? 600 : 400,
            }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function BodyWorkCard({ log, write, isToday }) {
  const [adding, setAdding] = useState(null);   /* therapy id being added */
  const [mins, setMins] = useState("60");
  const [note, setNote] = useState("");
  const entries = log?.therapy || [];

  const add = () => {
    if (!adding) return;
    write({ therapy: [...entries, { id: newId(), type: adding, minutes: mins, note }] });
    setAdding(null); setMins("60"); setNote("");
  };
  const remove = (id) => write({ therapy: entries.filter((x) => x.id !== id) });

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <Eyebrow>Body work</Eyebrow>
        <span style={{ fontSize: 10.5, color: C.muted }}>optional</span>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginBottom: entries.length ? 12 : 14 }}>
        Osteopathy, physio, massage, movement work, drainage. I never prescribe these — but tell me
        when you've had one and I'll set the next session around it.
      </div>

      {entries.map((e) => {
        const def = therapyById(e.type);
        return (
          <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start",
            padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.ink }}>
                {def?.label || e.type}{e.minutes ? ` · ${e.minutes} min` : ""}
              </span>
              <span style={{ display: "block", fontSize: 11.5, lineHeight: 1.45, color: C.muted, marginTop: 3 }}>
                {e.note || def?.why}
              </span>
            </span>
            <button onClick={() => remove(e.id)} className="tap" style={{
              border: "none", background: "transparent", cursor: "pointer",
              fontSize: 11, color: C.muted, padding: 0, flexShrink: 0 }}>remove</button>
          </div>
        );
      })}

      {adding ? (
        <div style={{ marginTop: 12, padding: "13px 14px", background: C.chalk, borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 3 }}>
            {therapyById(adding)?.label}
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.45, color: C.muted, marginBottom: 11 }}>
            {therapyById(adding)?.why}
          </div>
          <Field label="How long" unit="min" value={mins} onChange={setMins} />
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="What they worked on, how it felt — optional"
              style={{ ...inputStyle, marginBottom: 0, resize: "none", lineHeight: 1.45 }} />
            <MicButton onText={setNote} current={note} />
          </div>
          <Btn kind="signal" onClick={add}>Log it</Btn>
          <div style={{ marginTop: 7 }}>
            <Btn kind="quiet" onClick={() => setAdding(null)}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: entries.length ? 12 : 0 }}>
          {THERAPIES.map((th) => (
            <button key={th.id} onClick={() => setAdding(th.id)} className="tap" style={{
              padding: "9px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 500,
              border: `1.5px solid ${C.line}`, background: "transparent", color: C.muted,
            }}>+ {th.label}</button>
          ))}
        </div>
      )}
    </Card>
  );
}

function Today({ data, setData, coach, setSheet }) {
  /* one note a day, taken from the pool and never handed out twice */
  useEffect(() => {
    if (data.notes?.[coach.t]) return;
    const i = noteFor(coach.t, data.notesUsed || []);
    setData((d) => ({
      ...d,
      notes: { ...d.notes, [coach.t]: { text: NOTES[i], kept: false, source: "pool" } },
      notesUsed: [...(d.notesUsed || []), i],
    }));
  }, [coach.t]);

  const [editLoads, setEditLoads] = useState(false);
  const patchClass = (id, props) => setData((d) => ({
    ...d, library: d.library.map((w) => (w.id === id ? { ...w, ...props } : w)),
  }));
  const classByName = (n) => (data.library || []).find((w) => w.name === n) || null;

  const note = data.notes?.[coach.t];

  /* Which folded row is open. Lifted to here so that a row in "Needs you"
     can open the matching folded row rather than sending her hunting for
     it — the demand and the means to answer it stay one tap apart. */
  const [quietOpen, setQuietOpen] = useState(null);

  const [logDate, setLogDate] = useState(coach.t);
  const t = logDate;
  const isToday = logDate === coach.t;
  const log = data.logs[logDate] || null;
  /* WHAT THE COACH ASKED FOR, ALONGSIDE WHAT SHE DID.

     `prescribed` was written by exactly one control — the calibration
     checklist — which stops existing after block one. From block two onward
     nothing recorded the coach's pick, so "Coach vs you" could never gather
     data and the planned-vs-actual distinction quietly disappeared at the
     moment the coach started actually designing the training.

     It is stamped here instead, once, on the first write of the day, from
     whatever the coach proposed this morning. Stamped once and never
     overwritten: if she swaps class three times, the plan still says what was
     originally asked. The swap is the interesting part. */
  const write = (patch) => {
    const existing = data.logs[t] || {};
    /* Only ever stamp TODAY. Backfilling last Tuesday would otherwise record
       today's suggestion as what the coach asked for on Tuesday, which is not
       true and would quietly poison "coach vs you" with invented history. */
    const stamp = (t === coach.t && existing.prescribed === undefined && coach.prescribed?.name)
      ? { prescribed: coach.prescribed.name } : {};
    setData({ ...data, logs: { ...data.logs, [t]: { ...existing, ...stamp, ...patch } } });
  };
  const [open, setOpen] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [adding, setAdding] = useState(false);

  const remaining = Math.max(0, coach.seasonTarget - coach.weekDone);
  /* On the monthly benchmark day the battery IS the session — thirty-odd
     minutes of real work under load. The coach doesn't stack a class on top
     of it; it offers something gentle afterwards instead. */
  const benchmarkIsSession = isToday && coach.monthlyDue && !log?.type;
  /* One battery at a time. The monthly supersedes the weekly on a day they
     both land — it measures everything the weekly does and more. Neither
     appears on a day it isn't due; for that, Your numbers. */
  const showMonthlyCall = coach.monthlyDue && !benchmarkIsSession;
  const showWeeklyCall = coach.weeklyDue && !coach.monthlyDue;
  const measureDue = showWeeklyCall || showMonthlyCall;
  const rx = benchmarkIsSession
    ? {
        name: "Monthly benchmark",
        minutes: 30,
        equipment: "full battery",
        reason: "it's the first session of the month, and the battery is a session in itself — every lift, every hold, every distance, measured under load. Anything after it is yours to decide",
        addon: data.library.find((w) => w.addon && /stretch/i.test(w.name))
          || data.library.find((w) => w.addon && w.goal === "mobility")
          || null,
        benchmark: true,
      }
    : coach.prescribed;
  const s = classByName(log?.type) || (isToday ? coach.session : null);
  const restDay = !coach.isScheduled(logDate);

  const weekLine =
    remaining === 0 ? "Target hit. Anything more this week is a bonus."
    : remaining === 1 ? "One more class to go."
    : `${remaining} more classes to go.`;

  const choose = (w) => {
    write({ type: w.name, minutes: String(w.durations[0] || "") });
    setChoosing(false);
  };

  /* a Pilates class followed by stretching is two sessions, not one compromise */
  const extraSessions = log?.extraSessions || [];
  const addSession = (w) => {
    write({ extraSessions: [...extraSessions, { id: newId(), type: w.name, minutes: String(w.durations[0] || "") }] });
    setAdding(false);
  };
  const addCustom = () => {
    write({ extraSessions: [...extraSessions, { id: newId(), type: "", minutes: "", note: "", custom: true }] });
    setAdding(false);
  };
  const patchSession = (id, p) => write({ extraSessions: extraSessions.map((x) => x.id === id ? { ...x, ...p } : x) });
  const dropSession = (id) => write({ extraSessions: extraSessions.filter((x) => x.id !== id) });
  /* Clears the session and everything that belongs to it, and NOTHING else.
     Written as an explicit list rather than a wipe so that a field added
     later cannot start silently disappearing when she removes a class. */
  const clearSession = () => write({
    type: undefined, minutes: undefined, completed: false,
    rpe: undefined, sets: undefined, during: undefined,
    energyAfter: undefined, sessionNote: undefined, did: undefined, when: undefined,
  });
  const totalMinutes = [Number(log?.minutes) || 0, ...extraSessions.map((x) => Number(x.minutes) || 0)]
    .reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ---- the top of the page: what day, one line to read, two numbers ---- */}
      <div style={{ padding: "6px 4px 0" }}>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: C.muted }}>
          {prettyDate(coach.t)}
        </div>
      </div>

      {note && (
        <button onClick={() => setSheet({ kind: "notes" })} className="tap" style={{
          background: C.pist, borderRadius: 16, padding: "14px 16px", border: "none",
          cursor: "pointer", textAlign: "left", width: "100%", display: "block",
        }}>
          <span className="serif-it" style={{ fontSize: 15.5, lineHeight: 1.45, color: C.ink }}>
            {note.text}
          </span>
        </button>
      )}

      {/* the two numbers worth seeing without opening anything */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: C.card, borderRadius: 16, padding: "14px 16px",
          boxShadow: "0 1px 2px rgba(43,27,46,0.05)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span className="disp" style={{ fontSize: 30, fontWeight: 400, lineHeight: 1, color: C.ink }}>{coach.weekDone}</span>
            <span className="disp" style={{ fontSize: 15, fontWeight: 300, color: C.muted }}>/{coach.seasonTarget}</span>
          </div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase", color: C.muted, marginTop: 7 }}>
            sessions this week
          </div>
        </div>
        <div style={{ flex: 1, background: C.card, borderRadius: 16, padding: "14px 16px",
          boxShadow: "0 1px 2px rgba(43,27,46,0.05)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span className="disp" style={{ fontSize: 30, fontWeight: 400, lineHeight: 1, color: coach.totalSessions ? C.moss : C.muted }}>
              {coach.totalSessions ? coach.consistency : "—"}
            </span>
            {coach.totalSessions > 0 && <span className="disp" style={{ fontSize: 15, fontWeight: 300, color: C.muted }}>%</span>}
          </div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase", color: C.muted, marginTop: 7 }}>
            consistency
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 5, lineHeight: 1.3 }}>
            {coach.totalSessions ? "of the last 28 days you planned to train" : "starts with your first session"}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: C.muted, padding: "2px 4px", lineHeight: 1.5 }}>{weekLine}</div>

      <div style={{ padding: "0 2px" }}>
        <WeekSpine coach={coach} selected={logDate} onPick={setLogDate} />        {/* The strip is seven days. Anything older than that had nowhere to go
            — including sessions she did before this app could record them. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Or any earlier day</span>
          <input type="date" value={logDate} max={coach.t}
            onChange={(e) => { if (e.target.value) setLogDate(e.target.value); }}
            style={{ padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.line}`,
              background: C.card, fontSize: 12, fontFamily: "inherit", color: C.ink }} />
        </div>

        <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.45 }}>
          {isToday
            ? "Tap an earlier day to log or fix it."
            : `Logging ${parse(logDate).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}.`}
          {!isToday && (
            <button onClick={() => setLogDate(coach.t)} className="tap" style={{
              border: "none", background: "transparent", cursor: "pointer", padding: "0 0 0 6px",
              fontSize: 11, color: C.signal, fontWeight: 500,
            }}>back to today</button>
          )}
        </div>
      </div>

      {/* ---- what you need in the moment, nothing else ---- */}
      {/* ---- ZONE 1: HOW SHE IS, BEFORE ANYTHING ELSE --------------------
               Her instruction, and rule 4 in its plainest form: if she is
               flat, frustrated or wiped, the coach should know that BEFORE
               it tells her what to train, so it can offer something else
               rather than push the session it had in mind. It cannot answer
               a feeling it has not been told about yet. */}
      {isToday && <MoodCard log={log} write={write} setSheet={setSheet} coach={coach} />}

      {/* ---- ZONE 2: THE COACH SPEAKS ------------------------------
               Rule 3 says the coach leads and never waits. It used to be the
               tenth thing on this page, below ten cards of admin. */}
      {/* ---- THE COACH SPEAKS FIRST -------------------------------------
               Unprompted, every day, before she asks anything. The loudest
               item on the standing agenda, plus a way into the rest of it. */}
      {isToday && coach.leading.length > 0 && (
        <Card style={{
          background: coach.leading[0].tone === "firm" ? "rgba(194,84,47,0.07)"
            : coach.leading[0].tone === "warm" ? C.mint : C.pist,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <Eyebrow color={coach.leading[0].tone === "firm" ? C.clay
              : coach.leading[0].tone === "warm" ? C.moss : C.signal}>Your coach</Eyebrow>
            <span className="mono" style={{ fontSize: 9, letterSpacing: "0.11em",
              textTransform: "uppercase", color: C.muted }}>
              {SCOPE_LABEL[coach.leading[0].scope] || "today"}
            </span>
          </div>

          {/* ONE line, not three. The rest is behind the button — her words:
              "I just want a tab to talk to your coach. And if there is
              something that I need to see that the coach needs to tell me,
              that's when something comes up." */}
          <div style={{ fontSize: 15.5, lineHeight: 1.5, color: C.ink }}>{coach.leading[0].text}</div>

          <div style={{ marginTop: 14 }}>
            <Btn kind="signal" onClick={() => setSheet({ kind: "chat" })}>Talk to your coach</Btn>
          </div>
          {coach.agenda.length > 1 && (
            <div style={{ marginTop: 8 }}>
              <Btn kind="quiet" onClick={() => setSheet({ kind: "briefing" })}>
                Everything your coach is watching ({coach.agenda.length})
              </Btn>
            </div>
          )}
        </Card>
      )}


      {/* ---- THE SMALLER DOOR, WHERE SHE SAID SHE IS ---------------------
          Rule 4 as amended, and her instruction of 8 August: if she has just
          said she is flat, frustrated or wiped, the coach must not go on to
          announce a class. It offers something smaller instead, immediately,
          in the space between the mood and the session. Only while the day is
          still open, and never once she has logged something. */}
          does not accept that and stop — it walks down to something smaller.
          Only on a day still open, and never after she has already logged. */}
      {isToday && !log?.completed && log?.state !== "moved" && !restDay
        && coach.moodToday && coach.moodToday !== "good" && (
        <LadderCard data={data} setData={setData} coach={coach} />
      )}

      {/* ---- BENCHMARK DAY, BEFORE THE SESSION ---------------------------
               Her instruction: "then benchmark day before the sessions." On a
               day it is due it IS the session, so it has to be read first. */}
      {isToday && measureDue && (
        <Card style={{ background: C.pist }}>
          <Eyebrow color={C.signal}>
            {showMonthlyCall ? "Benchmark day" : "Measurement day"}
          </Eyebrow>
          <div className="disp" style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.2, margin: "2px 0 8px" }}>
            {(showMonthlyCall ? coach.monthlyLate : coach.weeklyLate)
              ? `Your numbers were due ${(showMonthlyCall ? coach.monthlyLate : coach.weeklyLate) === 1
                  ? "yesterday" : `${showMonthlyCall ? coach.monthlyLate : coach.weeklyLate} days ago`}`
              : showMonthlyCall
                ? "Full benchmark before today's session"
                : "Measurements before today's session"}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, marginBottom: 14 }}>
            {showMonthlyCall
              ? "Once a month, everything gets measured — body composition included. Thirty minutes, then you train."
              : "First session of the week, so you're already warm and it's done. Ten minutes, then you train."}
          </div>
          <Btn kind="signal" onClick={() => setSheet({ kind: showMonthlyCall ? "monthly" : "weekly",
            key: showMonthlyCall ? coach.mk : coach.ws })}>
            {showMonthlyCall ? "Start the benchmark" : "Take your measurements"}
          </Btn>
        </Card>
      )}


      {/* ---- ZONE 2: TODAY'S SESSION ------------------------------------
               Everything else on this page is derived from this one card, so
               it sits directly under the coach rather than at the bottom. In
               the calibration month it asks what she did; from block two it
               carries what the coach picked. */}
      {/* ---- 1. THE CLASS ---------------------------------------------
               One card, one decision. Either the coach's pick waiting to be
               accepted, or the class you're doing. Never both, never a menu
               unless you ask for one. */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <Eyebrow color={C.signal}>
                {benchmarkIsSession ? "Benchmark day"
                  : log?.type ? (log?.completed ? "Done" : "Your class")
                  : !isToday ? "That day"
                  : coach.calibrating ? "Today"
                  : restDay ? "Rest day" : "Your class"}
              </Eyebrow>
              {isToday && coach.block && (
                <button onClick={() => setSheet({ kind: "program" })} className="tap" style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: 0,
                  fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                  fontFamily: "'IBM Plex Mono', monospace", color: coach.block.color,
                }}>
                  {coach.block.label} · wk {coach.programWeek + 1} →
                </button>
              )}
            </div>

            <h1 className="disp" style={{ fontSize: 26, fontWeight: 400, lineHeight: 1.1, margin: "2px 0 0" }}>
              {log?.type
                || (isToday && rx ? rx.name
                  : isToday && coach.calibrating ? "What did you do today?"
                  : !isToday ? "What did you do that day?"
                  : restDay ? "Recovery day" : "Nothing logged")}
            </h1>

            <div className="mono" style={{ fontSize: 11.5, color: C.muted, marginTop: 7 }}>
              {log?.type
                ? `${log.minutes || "—"} min${s?.equipment ? " · " + s.equipment : ""}`
                : isToday && rx ? `${rx.minutes} min${rx.equipment ? " · " + rx.equipment : ""}` : ""}
            </div>

            {/* The explanation used to sit here in full. It is behind the i now
                — "If anything I want described or explained, I will click the
                info button." */}
            {isToday && !log?.type && (
              <div style={{ marginTop: 10 }}>
                <InfoNote why={coach.calibrating
                  ? "There is no plan this month on purpose. I have nothing of yours to design from yet, so you train what you want and tell me what it was. At the end of the month I design September out of what actually happened."
                  : (coach.block ? coach.block.label + " day. " + coach.block.why : "")}>
                  {coach.calibrating ? "No plan this month" : coach.block ? `${coach.block.label} day` : "Today"}
                </InfoNote>
              </div>
            )}

            {/* the coach's reasoning, only while it's still a suggestion */}
            {!log?.type && isToday && rx && (
              <>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.muted, marginTop: 14,
                  padding: "12px 14px", background: C.chalk, borderRadius: 12 }}>
                  <strong style={{ color: C.ink, fontWeight: 600 }}>Why this one:</strong> {rx.reason}.
                </div>
                {rx.addon && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12,
                    padding: "11px 14px", background: C.mint, borderRadius: 12 }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: C.moss }}>{rx.benchmark ? "if you're up for more" : "then"}</span>
                    <span style={{ flex: 1, fontSize: 13.5, color: C.ink }}>
                      {rx.addon.name} · {rx.addon.minutes} min
                      {rx.benchmark && (
                        <span style={{ color: C.muted }}> — or a full class, or nothing. Your call afterwards.</span>
                      )}
                    </span>
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <Btn kind="signal" onClick={() => {
                    if (rx.benchmark) setSheet({ kind: "monthly", key: coach.mk });
                    else write({ type: rx.name, minutes: String(rx.minutes) });
                  }}>
                    {rx.benchmark ? "Start the benchmark" : "Start this class"}
                  </Btn>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Btn kind="quiet" onClick={() => setChoosing(true)}>
                    {rx.benchmark ? "Skip it and train instead" : "I'd rather do something else"}
                  </Btn>
                </div>
              </>
            )}

            {/* once a class is chosen */}
            {log?.type && (
              <>
                {s && (
                  <div style={{ marginTop: 14 }}>
                    <SessionBlock primary cls={s} note={log?.sessionNote}
                      onNote={(v) => write({ sessionNote: v })}
                      onClass={(props) => patchClass(s.id, props)} />
                  </div>
                )}

                {/* how long it actually ran — suggestions plus a free number,
                    editable before and after you mark it done */}
                <div style={{ marginTop: 16 }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 7 }}>
                    how long
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {(s?.durations || []).map((m) => (
                      <button key={m} onClick={() => write({ minutes: String(m) })} className="tap mono" style={{
                        flex: 1, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${String(log.minutes) === String(m) ? C.ink : C.line}`,
                        background: String(log.minutes) === String(m) ? C.ink : "transparent",
                        color: String(log.minutes) === String(m) ? C.chalk : C.muted,
                      }}>{m}</button>
                    ))}
                    <input type="text" inputMode="numeric" value={log.minutes ?? ""}
                      onChange={(e) => write({ minutes: e.target.value })}
                      placeholder="any"
                      style={{ ...inputStyle, width: 66, padding: "10px 8px", marginBottom: 0, textAlign: "center",
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600,
                        border: `1.5px solid ${(s?.durations || []).map(String).includes(String(log.minutes)) ? C.line : C.ink}` }} />
                    <span className="mono" style={{ fontSize: 10, color: C.muted }}>min</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 7, lineHeight: 1.45 }}>
                    Type any number in the box if it ran longer or shorter than usual.
                  </div>
                </div>

                {/* ---- WHAT SHE ACTUALLY LIFTED, ON THIS DAY ---------------
                     The class carried one fixed line of loads and the app
                     showed it as though it were fact — "Dumbbells 4–8 kg ·
                     Kettlebell 8–12 kg" on a day she used neither. That is a
                     guess presented as a record, and it would be read back to
                     her months later as one. The class line is a reminder
                     now, clearly marked as last time's, and what she puts in
                     the box is what gets stored against THIS session. */}
                {(s?.resistance || s?.equipment || log?.loads) && (
                  <div style={{ marginTop: 14, padding: "12px 14px", background: C.chalk, borderRadius: 12 }}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: C.muted, marginBottom: 5 }}>
                      weights and kit you used
                    </div>
                    {s?.resistance && (
                      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: C.muted, marginBottom: 8 }}>
                        Usually: {s.resistance}
                        {!log?.loads && (
                          <button onClick={() => write({ loads: s.resistance })} className="tap" style={{
                            border: "none", background: "transparent", cursor: "pointer", padding: "0 0 0 6px",
                            fontSize: 11.5, color: C.signal, fontWeight: 600, fontFamily: "inherit" }}>
                            same today
                          </button>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <textarea rows={2} value={log?.loads ?? ""}
                        onChange={(e) => write({ loads: e.target.value })}
                        placeholder="8 kg kettlebell, 5 kg dumbbells — whatever you actually picked up"
                        style={{ ...inputStyle, marginBottom: 0, resize: "vertical", lineHeight: 1.45, fontSize: 13 }} />
                      <MicButton onText={(v) => write({ loads: v })} current={log?.loads || ""} />
                    </div>
                    <div style={{ marginTop: 7 }}>
                      <InfoNote small why="Leave it blank if there were no weights. What you put here is stored against this session on this date, not against the class — so next month you can see what actually moved rather than what the class usually calls for.">what this is for</InfoNote>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  {log?.completed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 15px", borderRadius: 12,
                      background: C.mint }}>
                      <span style={{ color: C.moss, fontSize: 17 }}>✓</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.moss }}>
                        Done — {coach.weekDone} of {coach.seasonTarget} this week
                      </span>
                    </div>
                  ) : (
                    <Btn kind="signal" onClick={() => { write({ completed: true }); }}>Mark it done</Btn>
                  )}
                  {/* everything the app wants to know about THIS session, under
                      THIS session, in the order it makes sense to answer */}
                  {log?.completed && (
                    <RpeTap value={log?.rpe} onChange={(v) => write({ rpe: v })} />
                  )}
                  {log?.completed && log?.rpe && (
                    <SetsTap value={log?.sets} onChange={(v) => write({ sets: v })} />
                  )}
                  {log?.completed && log?.rpe && (
                    <DuringTap value={log?.during} onChange={(v) => write({ during: v })} />
                  )}
                  {log?.completed && log?.during && (
                    <Scale label="How you felt afterwards" value={log?.energyAfter}
                      onChange={(v) => write({ energyAfter: v })} max={5} lo="wiped" hi="great" />
                  )}
                  {log?.completed && log?.during && (
                    <Note label="A line about how it went" value={log?.sessionNote}
                      onChange={(v) => write({ sessionNote: v })} />
                  )}
                </div>

                {!log?.completed && (
                  <div style={{ marginTop: 8 }}>
                    <Btn kind="quiet" onClick={() => setChoosing((c) => !c)}>{choosing ? "Keep this class" : "Change class"}</Btn>
                  </div>
                )}

                {/* ---- LOGGED THE WRONG THING ----------------------------
                     There was no way to undo this at all: the wrong class
                     could be swapped but never removed, and a session logged
                     by accident stayed on the record and in the count. Two
                     taps, because it deletes something (rule 20) — and it
                     only clears the session. The mood, the sleep, the
                     shoulder reading and anything else you added that day
                     are left exactly as they are. */}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                  {clearing ? (
                    <div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginBottom: 9 }}>
                        Remove <strong style={{ color: C.ink, fontWeight: 600 }}>{log.type}</strong> from
                        {isToday ? " today" : " that day"}? Everything else you logged stays.
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { clearSession(); setClearing(false); setChoosing(false); }}
                          className="tap" style={{ flex: 1, padding: "11px 0", borderRadius: 10, cursor: "pointer",
                            border: "none", background: C.clay, color: "#fff", fontSize: 13, fontWeight: 600,
                            fontFamily: "inherit" }}>Yes, remove it</button>
                        <button onClick={() => setClearing(false)} className="tap" style={{
                          flex: 1, padding: "11px 0", borderRadius: 10, cursor: "pointer",
                          border: `1.5px solid ${C.line}`, background: "transparent", color: C.muted,
                          fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Keep it</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setClearing(true)} className="tap" style={{
                      border: "none", background: "transparent", cursor: "pointer", padding: 0,
                      fontSize: 12, color: C.muted, fontFamily: "inherit" }}>
                      Remove this session
                    </button>
                  )}
                </div>
              </>
            )}

            {restDay && !log?.type && !choosing && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.muted, marginBottom: 12 }}>
                  Your cycle says rest. Recovery is what makes the next class count.
                </div>
                <Btn kind="quiet" onClick={() => setChoosing(true)}>Train anyway</Btn>
              </div>
            )}

            {/* ---- THE LIBRARY IS BEHIND A BUTTON --------------------------
                 I put the whole list on the landing page. She never asked for
                 that — she asked to be able to log her own classes. It only
                 opens when she taps for it. */}
            {!log?.type && !choosing && !log?.completed && (
              <div style={{ marginTop: 14 }}>
                <Btn kind="signal" onClick={() => setChoosing(true)}>Pick a session</Btn>
              </div>
            )}

            {/* the override menu */}
            {choosing && !log?.completed && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                  <Eyebrow>{!log?.type ? "Your library" : "Pick any class"}</Eyebrow>
                  <button onClick={() => setChoosing(false)} className="tap" style={{
                    border: "none", background: "transparent", cursor: "pointer", padding: 0,
                    fontSize: 11.5, color: C.muted, fontFamily: "inherit" }}>close</button>
                </div>
                {data.library.map((w) => (
                  <button key={w.id} onClick={() => choose(w)} className="tap" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%",
                    padding: "12px 2px", border: "none", borderBottom: `1px solid ${C.line}`,
                    background: "transparent", cursor: "pointer", textAlign: "left",
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{w.name}</div>
                      <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        {w.goal} · {w.durations.join("/")} min
                      </div>
                    </div>
                    <span style={{ color: C.signal, fontSize: 15, flexShrink: 0 }}>→</span>
                  </button>
                ))}
              </div>
            )}
          </Card>


      {/* ---- 2. EVERYTHING ELSE YOU DID -------------------------------
               Sits with the session rather than half a page below it. Her
               words: "if there is something decided by the coach and I add
               something else after it, this all should be at the beginning
               of the page." Whatever she did today is one block. */}
               Always here, always countable, always addable — whether or not
               the main class is finished. */}
          <Card>
            <Eyebrow>Everything you did {isToday ? "today" : "that day"}</Eyebrow>

            {!log?.type && extraSessions.length === 0 ? (
              <div style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, marginBottom: 14 }}>
                Nothing logged yet.
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                {log?.type && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "10px 0",
                    borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{log.type}</span>
                    <input type="text" inputMode="numeric" value={log.minutes ?? ""}
                      onChange={(e) => write({ minutes: e.target.value })}
                      style={{ ...inputStyle, width: 54, padding: "6px 6px", marginBottom: 0, textAlign: "center",
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }} />
                    <span className="mono" style={{ fontSize: 10, color: C.muted }}>min</span>
                    <span style={{ fontSize: 12, color: log.completed ? C.moss : C.muted }}>{log.completed ? "✓" : "…"}</span>
                  </div>
                )}
                {extraSessions.map((x) => {
                  const cls = classByName(x.type);
                  return (
                    <div key={x.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
                      <SessionBlock
                        custom={x.custom || !cls}
                        name={x.type} onName={(v) => patchSession(x.id, { type: v })}
                        cls={cls} note={x.note} minutes={x.minutes}
                        onNote={(v) => patchSession(x.id, { note: v })}
                        onMinutes={(v) => patchSession(x.id, { minutes: v })}
                        onClass={(props) => cls && patchClass(cls.id, props)}
                        onRemove={() => dropSession(x.id)} />
                      {/* Her point exactly: on a day with more than one class,
                          "how hard was it" has to say which one. So each
                          session carries its own, right underneath itself. */}
                      <RpeTap value={x.rpe} onChange={(v) => patchSession(x.id, { rpe: v })} />
                      {x.rpe && (
                        <SetsTap value={x.sets} onChange={(v) => patchSession(x.id, { sets: v })} />
                      )}
                      {x.rpe && (
                        <DuringTap value={x.during} onChange={(v) => patchSession(x.id, { during: v })} />
                      )}
                      {x.during && (
                        <Scale label="How you felt afterwards" value={x.energyAfter}
                          onChange={(v) => patchSession(x.id, { energyAfter: v })}
                          max={5} lo="wiped" hi="great" />
                      )}
                      {(cls?.resistance || cls?.equipment || x.loads) && (
                        <div style={{ marginTop: 10 }}>
                          <Note label="Weights and kit you used" value={x.loads}
                            onChange={(v) => patchSession(x.id, { loads: v })} />
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* THERE IS NO SAVE BUTTON, AND THAT WAS THE PROBLEM.
                    Everything here writes to the device the moment it is
                    typed or tapped — but nothing said so, so it read as
                    unsaved, and adding a second session looked like the thing
                    that committed the first. Saying it plainly costs one
                    line and removes the doubt. */}
                {(log?.type || extraSessions.length > 0) && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <span className="mono" style={{ fontSize: 10.5, color: C.muted }}>
                      {totalMinutes} min across {extraSessions.length + (log?.type ? 1 : 0)} session
                      {extraSessions.length + (log?.type ? 1 : 0) === 1 ? "" : "s"}
                    </span>
                    <span style={{ fontSize: 11, color: C.moss, fontWeight: 600 }}>
                      ✓ saved
                    </span>
                    <span style={{ flexBasis: "100%" }}>
                      <InfoNote small why="There is no save button because there is nothing to save. Every tap and every letter is written to this device as you make it. Add another session only if you actually did another one.">why there's no save button</InfoNote>
                    </span>
                  </div>
                )}
              </div>
            )}

            {isToday && log?.type === "Monthly benchmark" && !adding && extraSessions.length === 0 && (
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginBottom: 10 }}>
                That was the session. Whatever comes after is yours — a stretch, a full class, or nothing at all.
              </div>
            )}
            <Btn kind={adding ? "quiet" : "ghost"} onClick={() => setAdding((a) => !a)}>
              {adding ? "Never mind" : "+ Add another session"}
            </Btn>

            {adding && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: "0.11em",
                  textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
                  add-ons — short work you stack on a class
                </div>
                {[...data.library].sort((a, b) => (b.addon ? 1 : 0) - (a.addon ? 1 : 0)).map((w) => (
                  <button key={w.id} onClick={() => addSession(w)} className="tap" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%",
                    padding: "11px 2px", border: "none", borderBottom: `1px solid ${C.line}`,
                    background: "transparent", cursor: "pointer", textAlign: "left",
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{w.name}</div>
                      <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        {w.goal} · {w.durations.join("/")} min
                      </div>
                    </div>
                    <span style={{ color: C.signal, fontSize: 15, flexShrink: 0 }}>+</span>
                  </button>
                ))}
                <button onClick={addCustom} className="tap" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%",
                  padding: "13px 2px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.signal }}>Something else</div>
                    <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      not in the library — type it in yourself
                    </div>
                  </div>
                  <span style={{ color: C.signal, fontSize: 15, flexShrink: 0 }}>+</span>
                </button>
              </div>
            )}
          </Card>


      {/* ---- 3. THE FINISHER --------------------------------------------
               Straight after the sessions, while she is still standing there.
               At the bottom of the page it was an afterthought she read once
               the moment for it had passed. */}
      {isToday && coach.bet && (() => {
        const answered = log?.bet?.met === true || log?.bet?.met === false;
        const won = log?.bet?.met === true;
        return (
          <Card style={{ background: answered ? (won ? C.mint : C.card) : C.card,
            border: answered ? "none" : `1.5px dashed ${C.ochre}` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <Eyebrow color={C.ochre}>The finisher</Eyebrow>
              {coach.betsWon > 0 && (
                <span className="mono" style={{ fontSize: 10, color: C.muted }}>
                  {coach.betsWon} achieved
                </span>
              )}
            </div>

            <div className="serif-it" style={{ fontSize: 17, lineHeight: 1.45, color: C.ink, margin: "4px 0 0" }}>
              {log?.bet?.text || coach.bet.text}
            </div>
            {!answered && coach.bet.note && (
              <div className="mono" style={{ fontSize: 10.5, color: C.muted, marginTop: 8 }}>
                {coach.bet.note}
              </div>
            )}

            {!answered ? (
              <>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <div style={{ flex: 1 }}>
                    <Btn kind="signal" onClick={() => write({ bet: { id: coach.bet.id, text: coach.bet.text, target: coach.bet.target, met: true } })}>
                      Achieved
                    </Btn>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Btn kind="quiet" onClick={() => write({ bet: { id: coach.bet.id, text: coach.bet.text, target: coach.bet.target, met: false } })}>
                      Not achieved
                    </Btn>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <span style={{ fontSize: 15, color: won ? C.moss : C.muted }}>{won ? "✓" : "—"}</span>
                <span style={{ flex: 1, fontSize: 13, color: won ? C.moss : C.muted, fontWeight: won ? 600 : 400 }}>
                  {won ? "Achieved" : "Not achieved"}
                </span>
                <button onClick={() => write({ bet: { ...log.bet, met: null } })} className="tap" style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: 0,
                  fontSize: 11, color: C.muted,
                }}>undo</button>
              </div>
            )}
          </Card>
        );
      })()}


      {/* ---- ZONE 3: NEEDS YOU -------------------------------------------
               One block of rows in place of eight separate cards. A row is
               here only while it needs her; the block vanishes when nothing
               does. Every instruction those cards printed in full now waits
               behind its title. */}
      {isToday && <NeedsYou data={data} setData={setData} coach={coach} setSheet={setSheet} write={write} log={log} openQuiet={setQuietOpen} />}

      {/* ---- the one decision the app cannot explain ---- */}
      {isToday && <WhyCard data={data} setData={setData} coach={coach} setSheet={setSheet} />}

      {/* ---- ZONE 3: THIS MONTH, AND WHY IT LANDED THAT WAY ---- */}
      {isToday && <MonthPlanCard data={data} setData={setData} coach={coach} setSheet={setSheet} />}




      {/* THE RETURN. What determines whether a break becomes a dropout is the
          response to it — self-compassion predicts coming back, shame predicts
          the spiral. So this card offers one easy thing and no accounting. */}
      {isToday && (coach.lapseState === "away" || coach.lapseState === "drifting") && (
        <Card style={{ background: C.mint }}>
          <Eyebrow color={C.moss}>Starting again</Eyebrow>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: C.ink, marginBottom: 12 }}>
            {coach.lapseState === "away"
              ? `It's been ${coach.daysSinceSession} days. Nothing to make up and nothing to explain — people who train for years aren't the ones who never stop, they're the ones who restart without making it mean something.`
              : `A few sessions have slipped two weeks running. Worth naming while it's small — it usually means the plan stopped fitting the week, not anything about you.`}
          </div>
          <div style={{ padding: "13px 15px", background: C.card, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>The easiest way back in</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>
              {coach.easiest ? coach.easiest.name : "A twenty-minute walk"}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, marginTop: 5 }}>
              {coach.easiest
                ? `${coach.easiest.durations?.[0] || 20} minutes. Lowest cost thing in your library — the point today is the restart, not the session.`
                : "The point today is the restart, not the session."}
            </div>
          </div>
          <Btn kind="signal" onClick={() => write({ completed: true,
            type: coach.easiest ? coach.easiest.name : "Recovery walk",
            minutes: String(coach.easiest?.durations?.[0] || 20) })}>
            Done — I'm back
          </Btn>
          <div style={{ marginTop: 8 }}>
            <Btn kind="quiet" onClick={() => setSheet({ kind: "chat", about: "getting going again",
              seed: "I've been away from it. What's actually in the way, and what would make this week easier?" })}>
              Talk it through instead
            </Btn>
          </div>
        </Card>
      )}

      {/* ---- ZONE 5: THE QUIET THINGS ------------------------------------
               Four cards that used to sit open all day whether or not they
               had anything to say. Folded to one line each; the card itself
               is unchanged inside. Anything genuinely asking her something
               has already come up in "Needs you" above, and tapping it
               there opens the row here. */}
      {isToday && (
        <QuietRows open={quietOpen} setOpen={setQuietOpen} rows={[
          { id: "record", title: "Anything you've noticed", count: coach.openIssues.length,
            node: <RecordCard data={data} setData={setData} coach={coach} setSheet={setSheet} /> },
          { id: "goals", title: "What you want to be able to do", count: coach.openGoals.length,
            node: <GoalsCard data={data} setData={setData} coach={coach} setSheet={setSheet} /> },
          { id: "drills", title: "Today's ten minutes", count: coach.dailyDrills.list.length,
            node: coach.dailyDrills.list.length
              ? <DrillsCard coach={coach} setSheet={setSheet} /> : null },
          { id: "body", title: "Body work",
            node: <BodyWorkCard log={log} write={write} isToday={isToday} /> },
        ]} />
      )}

      {!isToday && <BodyWorkCard log={log} write={write} isToday={isToday} />}

      {/* ---- THE FIVE VITALS ---------------------------------------------
               Five numbers, always the same five, always in the same order.
               Tap any one for what it means and a way to ask about it. */}
      {isToday && (
        <Card>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 3 }}>
            <Eyebrow>Where you stand</Eyebrow>
            <button onClick={() => setSheet({ kind: "vitals" })} className="tap" style={{
              border: "none", background: "transparent", cursor: "pointer",
              fontSize: 11.5, color: C.signal, padding: 0 }}>All of it →</button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 14 }}>
            Tap any number to find out what it's telling you.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
            {coach.vitals.map((v) => (
              <button key={v.id} onClick={() => setSheet({ kind: "vital", id: v.id })} className="tap" style={{
                border: "none", background: C.chalk, borderRadius: 12, cursor: "pointer",
                padding: "12px 4px", textAlign: "center", display: "block",
              }}>
                <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: v.color, lineHeight: 1.1 }}>
                  {v.display}
                </div>
                <div style={{ fontSize: 9.5, color: C.muted, marginTop: 5, lineHeight: 1.2 }}>{v.label}</div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 13, paddingTop: 12, borderTop: `1px solid ${C.line}`,
            fontSize: 13, lineHeight: 1.55, color: C.ink }}>
            {coach.reading}
          </div>

          {/* THESE USED TO ASK FOR THE EFFORT SCORE TOO.
              Three places asked the same question — here, the session card,
              and a row in "Needs you" — and on a day with two classes none of
              them could say WHICH class they meant. Effort belongs to a
              session, not to a day. It is asked once, under the session it
              is about, and nowhere else. */}
          {!log?.completed && !restDay && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`,
              fontSize: 12, lineHeight: 1.5, color: C.muted }}>
              Log today's session and an effort score appears here — that's what these five are built on.
            </div>
          )}
        </Card>
      )}

      {/* ---- everything else, folded away until asked for ---- */}
      {/* ---- THE DAY ITSELF, AND NOTHING THAT BELONGS TO A SESSION -------
           This card used to hold "how you felt afterwards", "what you actually
           did", "notes" and a row of add-on chips — every one of them a
           session question, asked here a second time, with no way to say which
           session it meant. Those live under each session now. What is left is
           the short list of things that genuinely have no session attached:
           how the shoulder is, how she slept, what the strain was.
           Nothing has been deleted from her data — the fields still exist and
           anything already written to them is untouched and still read. */}
      <Fold title="The day itself" note="shoulder, sleep, strain">
        <Btn kind="quiet" onClick={() => setOpen((o) => !o)}>
              {open ? "Hide it" : "Shoulder, sleep, strain"}
            </Btn>
            {open && (
              <div style={{ marginTop: 16 }}>
                <>
                {data.settings.shoulderInjury && (
                  <Scale label="Shoulder comfort" value={log?.shoulder}
                    onChange={(v) => write({ shoulder: v })} max={5} lo="painful" hi="no issue" />
                )}
                <Field label="Sleep last night" unit="hours" value={log?.sleep} onChange={(v) => write({ sleep: v })} />
                {data.settings.whoopConnected && (
                  <Field label="WHOOP strain" unit="" value={log?.whoopStrain} onChange={(v) => write({ whoopStrain: v })} />
                )}
              </>
              </div>
            )}
            {!log?.completed && !log?.rest && (
              <div style={{ marginTop: 8 }}>
                <Btn kind="quiet" onClick={() => write({ rest: true, completed: false })}>Log this as a rest day</Btn>
              </div>
            )}
      </Fold>

      <Fold title="Where you stand this week"
        note={coach.verdict.label} accent={coach.verdict.key === "reduce" ? C.clay : C.signal}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

  {/* ---- what the week says to do next ---- */}
        <Card style={{ marginBottom: 12 }}>
          <Eyebrow>This week's call</Eyebrow>
          <div className="disp" style={{ fontSize: 17, marginBottom: 4,
            color: coach.verdict.key === "reduce" ? C.clay : coach.verdict.key === "advance" ? C.signal : C.ink }}>
            {coach.verdict.label}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: C.muted }}>{coach.verdict.line}</div>
          {coach.confidence && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
              {coach.confidence.line}
            </div>
          )}
          {coach.health && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="mono" style={{ fontSize: 22, color: C.ochre }}>{coach.health.score}</span>
              <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>
                week score{coach.health.partial ? " · built on partial data, treat it lightly" : ""}
              </span>
            </div>
          )}
        </Card>

        {(coach.themes.week || coach.themes.month || coach.themes.quarter) && (
          <Card>
            <Eyebrow>What you're working on</Eyebrow>
            {[["Week " + coach.pos.week, coach.themes.week],
              ["Month " + coach.pos.month, coach.themes.month],
              ["Quarter " + coach.pos.quarter, coach.themes.quarter]].map(([l, v]) => v ? (
              <div key={l} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.chalk}` }}>
                <span className="mono" style={{ fontSize: 10, color: C.muted, width: 74, flexShrink: 0, paddingTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{v}</span>
              </div>
            ) : null)}
          </Card>
        )}
  {/* ============ 3. WHAT YOU'RE WORKING ON ============ */}
        <Card style={{ marginBottom: 12, borderLeft: `3px solid ${coach.phase.key === "familiarise" ? C.ochre : C.signal}` }}>
          <Eyebrow>{coach.season.key === "maintain" ? coach.season.name : coach.phase.name}</Eyebrow>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: C.muted }}>
            {coach.season.key === "maintain" ? coach.season.line : coach.phase.line}
          </div>
        </Card>
  <Card style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Btn kind="ghost" onClick={() => setSheet({ kind: "analysis" })}>What's moving</Btn>
          </div>
          <div style={{ flex: 1 }}>
            <Btn kind="quiet" onClick={() => setSheet({ kind: "journal" })}>Your journal</Btn>
          </div>
        </Card>
        </div>
      </Fold>

      <Fold title="Your numbers"
        note={coach.weeklyDue
          ? (coach.weeklyLate ? `measurements ${coach.weeklyLate} days late` : "measurements due today")
          : `next measurement ${prettyShort(coach.nextAssessDay)}`}
        accent={coach.weeklyDue ? C.signal : undefined}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* ---- baseline: know where you're starting from ---- */}
        {Object.keys(data.weekly).length === 0 && Object.keys(data.monthly).length === 0 && (
          <Card style={{ marginBottom: 12, borderLeft: `3px solid ${C.ochre}` }}>
            <Eyebrow color={C.ochre}>Start here</Eyebrow>
            <div className="disp" style={{ fontSize: 17, marginBottom: 4 }}>Set your baseline</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: C.muted, marginBottom: 12 }}>
              Run the full battery once and every number after this has something to be measured against.
              Half an hour. Leave the cable row and elliptical blank until the gym exists — they'll start in September.
            </div>
            <Btn kind="solid" onClick={() => setSheet({ kind: "monthly", key: coach.mk })}>Run the baseline battery</Btn>
          </Card>
        )}
  {/* ============ 5. YOUR MEASUREMENTS ============
             Always visible. This is where numbers get entered, and it should
             never be something you have to go hunting for. */}
        <Card style={coach.weeklyDue ? { background: C.pist } : {}}>
          <Eyebrow color={coach.weeklyDue ? C.signal : C.muted}>Your measurements</Eyebrow>
          <div className="disp" style={{ fontSize: 18, fontWeight: 400, marginBottom: 6 }}>
            {coach.weeklyDue ? "This week's numbers are open" : "This week's numbers are in"}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, marginBottom: 14 }}>
            {coach.weeklyDue
              ? "Squat, push-up, cable row, plank, elliptical, reach, balance — about ten minutes. This is what every chart and every score is built from."
              : "You've filled in the weekly battery. Open it again any time to correct a number."}
          </div>
          <Btn kind={coach.weeklyDue ? "signal" : "ghost"} onClick={() => setSheet({ kind: "weekly", key: coach.ws })}>
            {coach.weeklyDue ? "Enter this week's measurements" : "Review this week's measurements"}
          </Btn>
          <div style={{ marginTop: 10 }}>
            <Btn kind="quiet" onClick={() => setSheet({ kind: "monthly", key: coach.mk })}>
              {coach.monthlyDue ? "Monthly benchmark — due now" : "Monthly benchmark — full battery + body composition"}
            </Btn>
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.5, color: C.muted, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
            Weekly takes about ten minutes and covers the anchors. Monthly takes about thirty and covers
            everything, including muscle and body fat percentage.
          </div>
        </Card>
  {/* ============ 4. WHAT YOU'VE BUILT ============ */}
        <Card>
          <Eyebrow>Where you stand</Eyebrow>
          <div style={{ marginBottom: 18 }}>
            {[["Sessions completed", coach.totalSessions, ""],
              ["Weeks on target", coach.weeksHit, coach.weeksHit === 1 ? "week" : "weeks"],
              ["Consistency", coach.consistency, "% of the last 28 days"]].map(([l, v, unit], i) => (
              <div key={l} style={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between",
                padding: "13px 0", borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
              }}>
                <span style={{ fontSize: 13.5, color: C.muted }}>{l}</span>
                <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <span className="disp" style={{ fontSize: 27, fontWeight: 400, lineHeight: 1, color: C.ink }}>{v}</span>
                  {unit && <span style={{ fontSize: 11, color: C.muted }}>{unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </Card>
        </div>
      </Fold>
    </div>
  );
}

/* ------------------------------------------------------------ WORKOUTS ---- */
const GOALS = ["strength", "cardio", "mobility", "core", "recovery"];
/* mobility and flexibility are the same work — one goal, labelled for what it is */
const GOAL_LABEL = { mobility: "mobility & flexibility" };
const goalLabel = (g) => GOAL_LABEL[g] || g;
const LOADS = ["low", "medium", "high"];

function Workouts({ data, setData, coach }) {
  const lib = data.library;
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [renameMsg, setRenameMsg] = useState("");

  const save = (next) => setData({ ...data, library: next });

  /* Sessions are logged against a class NAME, so renaming a class would orphan
     every session she ever did under the old one — the work would still be in
     the record but would stop counting towards coverage, sets, class cost and
     freshness. Nothing tells her that happened. So a rename carries the
     history with it: the same sessions, relabelled, never re-dated or deleted. */
  const patch = (id, p) => {
    const before = lib.find((w) => w.id === id);
    const nextLib = lib.map((w) => (w.id === id ? { ...w, ...p } : w));
    const renamed = before && p.name !== undefined && p.name !== before.name && before.name;
    if (!renamed) { save(nextLib); return; }
    const from = before.name, to = p.name;
    const logs = { ...data.logs };
    let moved = 0;
    Object.keys(logs).forEach((d) => {
      const l = logs[d];
      if (!l) return;
      let touched = false;
      let nl = l;
      if (l.type === from) { nl = { ...nl, type: to }; touched = true; }
      if (l.prescribed === from) { nl = { ...nl, prescribed: to }; touched = true; }
      if (Array.isArray(l.extraSessions) && l.extraSessions.some((x) => x.type === from)) {
        nl = { ...nl, extraSessions: l.extraSessions.map((x) => (x.type === from ? { ...x, type: to } : x)) };
        touched = true;
      }
      if (touched) { logs[d] = nl; moved++; }
    });
    setData({ ...data, library: nextLib, logs });
    if (moved) setRenameMsg(`Renamed. ${moved} logged session${moved === 1 ? "" : "s"} came with it.`);
  };

  /* Removing a class must not remove what she did with it. The library entry
     goes; the sessions stay exactly as logged. They keep their name, so the
     record still reads true — they simply stop being offered. */
  const remove = (id) => {
    const w = lib.find((x) => x.id === id);
    const used = w ? Object.values(data.logs || {}).filter((l) => l?.type === w.name).length : 0;
    save(lib.filter((x) => x.id !== id));
    if (used) setRenameMsg(`Removed from the library. The ${used} session${used === 1 ? "" : "s"} you did stay in your record.`);
  };
  const add = () => {
    const w = { id: newId(), name: "New class", goal: "strength", intensity: 3, recoveryCost: 3, home: false,
      shoulderLoad: "medium", durations: [30, 45], equipment: "", cue: "", resistance: "", structure: "", felt: "",
      /* Without this the class counts towards nothing — not Coverage, not
         weekly sets. A rough default by goal, tunable later. */
      body: { ...BODY_BY_GOAL.strength } };
    save([...lib, w]); setOpenId(w.id);
  };
  const move = (i, dir) => {
    const n = [...lib], j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]]; save(n);
  };
  const setDurations = (id, str) =>
    patch(id, { durations: str.split(",").map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x)) });

  const shown = filter === "all" ? lib.filter((w) => !w.addon)
    : filter === "addons" ? lib.filter((w) => w.addon)
    : lib.filter((w) => w.goal === filter && !w.addon);
  const plan = data.plan;
  const savePlan = (next) => setData({ ...data, plan: { ...plan, ...next } });
  const setTheme = (lvl, num, v) => savePlan({ themes: { ...plan.themes, [lvl]: { ...plan.themes[lvl], [num]: v } } });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <Card>
        <Eyebrow>Workout library</Eyebrow>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          {lib.filter((w) => !w.addon).length} classes and {lib.filter((w) => w.addon).length} add-ons.
          A class is your session for the day. An add-on is short work you stack on top of one —
          shoulder work, stretching, a few sets with the dumbbells. The coach only ever prescribes
          a class, never an add-on, and can suggest one to follow it.
          Tap any class to open it and change anything — name, intensity, recovery cost, shoulder load,
          durations, equipment. Delete what you don't do. Add your own at the bottom.
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
          The intensity, recovery cost and shoulder load figures are my rough estimates, not measurements —
          I've never seen your classes. If a class leaves you flatter than the number suggests, raise it.
          The engine is only as good as these numbers are honest.
        </div>
      </Card>

      <Card>
        <Eyebrow>Themes</Eyebrow>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginBottom: 12 }}>
          I set these from where you are in the plan and what the block is for. Overwrite any of them
          if you disagree — clear the box and I take it back over.
        </div>
        {[["week", coach.pos.week], ["month", coach.pos.month], ["quarter", coach.pos.quarter]].map(([lvl, num]) => (
          <div key={lvl} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{lvl} {num}</span>
              <span className="mono" style={{ fontSize: 10, color: coach.themesAuto[lvl] ? C.moss : C.ochre }}>
                {coach.themesAuto[lvl] ? "set by coach" : "yours"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea rows={2} value={plan.themes[lvl][num] ?? coach.auto[lvl]}
                onChange={(e) => setTheme(lvl, num, e.target.value)}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45, marginBottom: 0,
                  color: coach.themesAuto[lvl] ? C.muted : C.ink }} />
              <MicButton onText={(v) => setTheme(lvl, num, v)} current={plan.themes[lvl][num] ?? ""} />
            </div>
          </div>
        ))}
        <Field label="Training started on" unit="" type="date" value={plan.startDate}
          onChange={(v) => savePlan({ startDate: v || today() })} />
      </Card>

      <Card>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {["all", ...GOALS, "addons"].map((g) => (
            <button key={g} onClick={() => setFilter(g)} className="tap mono" style={{
              padding: "6px 11px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", fontSize: 11, fontWeight: 500,
              border: `1px solid ${filter === g ? C.signal : C.line}`,
              background: filter === g ? C.signal : "transparent",
              color: filter === g ? C.chalk : C.muted,
            }}>{g === "addons" ? "add-ons" : goalLabel(g)}</button>
          ))}
        </div>
      </Card>

      {shown.map((w) => {
        const i = lib.indexOf(w);
        return (
          <Card key={w.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[[-1, "▲"], [1, "▼"]].map(([d, ch]) => (
                  <button key={d} onClick={() => move(i, d)} className="tap" style={{
                    border: "none", background: "transparent", cursor: "pointer", color: C.muted, fontSize: 8, lineHeight: 1, padding: "2px 3px",
                  }}>{ch}</button>
                ))}
              </div>
              <button onClick={() => setOpenId(openId === w.id ? null : w.id)} style={{
                flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0, minWidth: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{w.name}</span>
                  <span style={{ fontSize: 10, color: C.muted, transition: "transform .15s",
                    transform: openId === w.id ? "rotate(90deg)" : "none", display: "inline-block" }}>▸</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                  {w.goal} · int {w.intensity}/5 · rec {w.recoveryCost}/5 · {w.shoulderLoad} shoulder · {w.durations.join("/")} min
                </div>
                <div style={{ fontSize: 10.5, color: C.signal, marginTop: 4, fontWeight: 500 }}>
                  {openId === w.id ? "Close" : "Tap to edit these numbers"}
                </div>
              </button>
              <button onClick={() => remove(w.id)} className="tap" style={{
                border: "none", background: "transparent", cursor: "pointer", color: C.clay, fontSize: 16, padding: "4px 2px",
              }}>×</button>
            </div>

            {openId === w.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                <Field label="Name" unit="" type="text" value={w.name} onChange={(v) => patch(w.id, { name: v })} />

                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Primary goal</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                  {GOALS.map((g) => (
                    <button key={g} onClick={() => patch(w.id, { goal: g })} className="tap mono" style={{
                      padding: "7px 11px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500,
                      border: `1.5px solid ${w.goal === g ? C.ink : C.line}`,
                      background: w.goal === g ? C.ink : "transparent", color: w.goal === g ? C.chalk : C.muted,
                    }}>{g}</button>
                  ))}
                </div>

                <Scale label="Intensity" value={w.intensity} onChange={(v) => patch(w.id, { intensity: Number(v) })} max={5} lo="very easy" hi="all out" />
                <Scale label="Recovery cost" value={w.recoveryCost} onChange={(v) => patch(w.id, { recoveryCost: Number(v) })} max={5} lo="none" hi="needs a day" />

                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Shoulder load</div>
                <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
                  {LOADS.map((l) => (
                    <button key={l} onClick={() => patch(w.id, { shoulderLoad: l })} className="tap mono" style={{
                      flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500,
                      border: `1.5px solid ${w.shoulderLoad === l ? C.ink : C.line}`,
                      background: w.shoulderLoad === l ? C.ink : "transparent", color: w.shoulderLoad === l ? C.chalk : C.muted,
                    }}>{l}</button>
                  ))}
                </div>

                <Field label="Duration options" unit="comma separated" type="text"
                  value={w.durations.join(", ")} onChange={(v) => setDurations(w.id, v)} />
                <Field label="Equipment" unit="" type="text" value={w.equipment} onChange={(v) => patch(w.id, { equipment: v })} />
                <Field label="Mission cue" unit="shown on Today" type="text" value={w.cue} onChange={(v) => patch(w.id, { cue: v })} />

                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Resistance / loads</div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                  <textarea rows={3} value={w.resistance || ""} onChange={(e) => patch(w.id, { resistance: e.target.value })}
                    placeholder="Plate weights, band strength, machine settings"
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45, marginBottom: 0 }} />
                  <MicButton onText={(v) => patch(w.id, { resistance: v })} current={w.resistance || ""} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: -8, marginBottom: 14, lineHeight: 1.45 }}>
                  Starting points from the published class formats, not prescriptions. Overwrite them with
                  what you actually lift.
                </div>

                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>How the class runs</div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                  <textarea rows={3} value={w.structure || ""} onChange={(e) => patch(w.id, { structure: e.target.value })}
                    placeholder="Tracks, sections, how the effort is distributed"
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45, marginBottom: 0 }} />
                  <MicButton onText={(v) => patch(w.id, { structure: v })} current={w.structure || ""} />
                </div>

                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>How it feels to you</div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                  <textarea rows={3} value={w.felt || ""} onChange={(e) => patch(w.id, { felt: e.target.value })}
                    placeholder="What's hard, what your shoulder does, what you change"
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45, marginBottom: 0 }} />
                  <MicButton onText={(v) => patch(w.id, { felt: v })} current={w.felt || ""} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: -8, marginBottom: 4, lineHeight: 1.45 }}>
                  Your coach reads this. It outranks anything I guessed.
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {renameMsg && (
        <div style={{ fontSize: 12.5, color: C.moss, lineHeight: 1.5, marginBottom: 10,
                      background: C.mint, borderRadius: 12, padding: "10px 12px" }}>
          {renameMsg}
        </div>
      )}
      <Btn kind="ghost" onClick={add}>+ Add a class</Btn>
      <Btn kind="quiet" onClick={() => save(SEED_LIBRARY)}>Reset library to the original list</Btn>
    </div>
  );
}

/* ------------------------------------------------------------ PROGRESS ---- */
const weekLabel = (ws) => {
  const a = parse(ws), b = parse(addDays(ws, 6));
  const m = (d) => d.toLocaleDateString(undefined, { month: "short" });
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${m(a)}`
    : `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`;
};
const monthLabel = (mk) => parse(mk + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" });

const Explain = ({ children }) => (
  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 12 }}>{children}</div>
);

const Blank = ({ text, action, onAction }) => (
  <div style={{ padding: "20px 0 8px", textAlign: "center" }}>
    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: action ? 12 : 0 }}>{text}</div>
    {action && <Btn kind="ghost" onClick={onAction}>{action}</Btn>}
  </div>
);

function Progress({ data, setData, coach, setSheet }) {
  const wKeys = Object.keys(data.weekly).sort();
  const numeric = data.fields.weekly.filter((f) => f.type !== "note");
  const trendLabel = (id) => coach.trendFor(id);
  const hasValue = (entry, f) => {
    if (!entry) return false;
    if (f.rungs?.length > 1 && entry[f.id + "__rung"] !== undefined) return true;
    if (f.bilateral && (entry[f.id + "__L"] !== undefined || entry[f.id + "__R"] !== undefined)) return true;
    if (f.type === "weightreps" && entry[f.id + "__w"] !== undefined) return true;
    return !isNaN(readMeasure(entry, f));
  };
  const charted = numeric.filter(
    (f) => wKeys.filter((k) => hasValue(data.weekly[k], f)).length >= 2
  );
  const [pick, setPick] = useState(null);
  const sel = charted.find((f) => f.id === pick) || charted[0] || null;
  const fmtY = (v) => (sel?.type === "time"
    ? `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}`
    : v);

  /* mm:ss and weight-carrying measures don't survive a bare Number() */
  const num = (v) => (v === "" || v === undefined || v === null || isNaN(Number(v)) ? null : Number(v));

  /* A measure can hold more than one variant — weight and reps, left and
     right, rung and value. Plot all of them or the chart tells half a story. */
  const variantsOf = (f) => {
    if (!f) return [];
    const out = [];
    if (f.type === "weightreps") {
      out.push({ key: "w", name: "total load", unit: "kg lifted", kind: "bar", axis: "left",
                 read: (e) => { const v = loadOf(e || {}, f); return isNaN(v) ? null : Math.round(v); } });
      out.push({ key: "kg", name: "weight", unit: "kg", kind: "line", axis: "right",
                 read: (e) => num(e?.[f.id + "__w"]) });
      if (f.bilateral) {
        out.push({ key: "L", name: "reps left", unit: "reps", kind: "line", axis: "right", read: (e) => num(e?.[f.id + "__L"]) });
        out.push({ key: "R", name: "reps right", unit: "reps", kind: "line", axis: "right", read: (e) => num(e?.[f.id + "__R"]) });
      } else {
        out.push({ key: "a", name: "reps", unit: "reps", kind: "line", axis: "right", read: (e) => num(e?.[f.id]) });
      }
      return out;
    }
    if (f.rungs?.length > 1) {
      out.push({ key: "w", name: "level", unit: "rung", kind: "bar", axis: "left",
                 read: (e) => (e?.[f.id + "__rung"] === undefined ? null : Number(e[f.id + "__rung"]) + 1) });
    }
    if (f.bilateral) {
      out.push({ key: "L", name: "left", unit: f.unit, kind: "line", axis: "right", read: (e) => num(e?.[f.id + "__L"]) });
      out.push({ key: "R", name: "right", unit: f.unit, kind: "line", axis: "right", read: (e) => num(e?.[f.id + "__R"]) });
    } else if (f.type !== "rung") {
      out.push({ key: "a", name: f.label, unit: f.unit, kind: "line",
                 axis: f.rungs?.length > 1 ? "right" : "left",
                 read: (e) => { const v = readMeasure(e, f); return isNaN(v) ? null : v; } });
    }
    /* with no bars there is no second scale — everything belongs on the left */
    if (!out.some((v) => v.kind === "bar")) out.forEach((v) => { v.axis = "left"; });
    return out;
  };

  const variants = variantsOf(sel);
  const bars = variants.filter((v) => v.kind === "bar");
  const lines = variants.filter((v) => v.kind === "line");

  const series = sel
    ? wKeys.map((k) => {
        const row = { x: weekLabel(k).split("–")[0] };
        variants.forEach((v) => { row[v.key] = v.read(data.weekly[k]); });
        return row;
      }).filter((r) => variants.some((v) => r[v.key] !== null))
    : [];

  const volume = useMemo(() => {
    const out = [];
    for (let i = 7; i >= 0; i--) {
      const ws = weekStart(addDays(coach.t, -i * 7));
      out.push({ x: weekLabel(ws).split("–")[0], v: Array.from({ length: 7 }, (_, j) => addDays(ws, j)).filter(coach.done).length });
    }
    return out;
  }, [data, coach]);

  const mKeys = Object.keys(data.monthly).sort();

  /* --- editing past days: tap cycles nothing → trained → rest → nothing --- */
  const cycleDay = (d) => {
    const cur = data.logs[d];
    const logs = { ...data.logs };
    if (!cur || (!cur.completed && !cur.rest)) logs[d] = { ...(cur || {}), completed: true, rest: false };
    else if (cur.completed) logs[d] = { ...cur, completed: false, rest: true };
    else { const { [d]: _drop, ...rest } = logs; return setData({ ...data, logs: rest }); }
    setData({ ...data, logs });
  };

  const recentDays = Array.from({ length: 14 }, (_, i) => addDays(coach.t, -i));
  const recentWeeks = Array.from({ length: 8 }, (_, i) => weekStart(addDays(coach.t, -i * 7)));
  const recentMonths = Array.from({ length: 6 }, (_, i) => {
    const d = parse(coach.t + "");
    d.setMonth(d.getMonth() - i);
    return iso(d).slice(0, 7);
  });

  const filledCount = (obj, fields) => fields.filter((f) => obj[f.id] !== undefined && obj[f.id] !== "").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* EVERY calculation, on the screen that exists for them. They used to
          sit behind a button, which meant she never found them. */}
      <Card style={{ marginBottom: 14 }}>
        <Eyebrow color={C.signal}>Your five numbers</Eyebrow>
        <div style={{ display: "flex", gap: 5, marginTop: 10, marginBottom: 12 }}>
          {coach.vitals.map((v) => (
            <button key={v.id} onClick={() => setSheet({ kind: "vital", id: v.id })} className="tap" style={{
              flex: 1, border: "none", background: C.chalk, borderRadius: 11, cursor: "pointer", padding: "11px 3px" }}>
              <div className="mono" style={{ fontSize: 15.5, fontWeight: 600, color: v.color }}>{v.display}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{v.label}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: C.ink }}>{coach.reading}</div>
      </Card>

      {[["day", "Every day"], ["week", "Every week"], ["month", "Every month"],
        ["quarter", "Every quarter"], ["year", "Every year"]].map(([g, title]) => {
        const items = coach.groupsOf(g);
        if (!items.length) return null;
        return (
          <Card key={g} style={{ marginBottom: 14 }}>
            <Eyebrow>{title}</Eyebrow>
            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45, marginBottom: 12 }}>
              Tap any one for how it's worked out and what it means for you.
            </div>
            {items.map((v, n) => (
              <button key={v.id} onClick={() => setSheet({ kind: "vital", id: v.id })} className="tap" style={{
                width: "100%", border: "none", background: "transparent", cursor: "pointer",
                textAlign: "left", padding: "11px 0", display: "block",
                borderTop: n ? `1px solid ${C.line}` : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.ink }}>
                      {v.key && <span style={{ color: C.signal }}>● </span>}{v.label}
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 2 }}>{v.scope}</span>
                  </span>
                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <span className="mono" style={{ display: "block", fontSize: 17, fontWeight: 600, color: v.color }}>
                      {v.display}
                    </span>
                    <span style={{ display: "block", fontSize: 9.5, color: C.muted, marginTop: 2 }}>{v.sub}</span>
                  </span>
                </div>
              </button>
            ))}
          </Card>
        );
      })}

      <Card style={{ background: coach.weeklyDue ? C.pist : C.card }}>
        <Eyebrow color={C.signal}>{coach.weeklyDue ? "Due now" : "Your measurements"}</Eyebrow>
        <div className="disp" style={{ fontSize: 19, fontWeight: 400, margin: "2px 0 6px" }}>
          {coach.weeklyDue ? "This week's numbers aren't in yet" : "This week's numbers are in"}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, marginBottom: 14 }}>
          Everything on this screen is drawn from the weekly battery. Nothing here fills itself.
        </div>
        <Btn kind="signal" onClick={() => setSheet({ kind: "weekly", key: coach.ws })}>
          {coach.weeklyDue ? "Enter this week's measurements" : "Review this week's measurements"}
        </Btn>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1 }}><Btn kind="ghost" onClick={() => setSheet({ kind: "monthly", key: coach.mk })}>Monthly benchmark</Btn></div>
          <div style={{ flex: 1 }}><Btn kind="quiet" onClick={() => setSheet({ kind: "analysis" })}>What's moving</Btn></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1 }}><Btn kind="quiet" onClick={() => setSheet({ kind: "journal" })}>Journal</Btn></div>
          <div style={{ flex: 1 }}><Btn kind="quiet" onClick={() => setSheet({ kind: "whooplog" })}>WHOOP log</Btn></div>
        </div>
      </Card>

      {/* ---------- headline numbers ---------- */}
      <Card>
        <Eyebrow>Where you stand</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center", marginBottom: 12 }}>
          {[["Sessions", coach.totalSessions, "logged, all time"],
            ["Per week", coach.avgPerWeek, "sessions on average"],
            ["Consistency", coach.consistency + "%", "of training days hit"]].map(([l, v, sub]) => (
            <div key={l}>
              <div className="mono disp" style={{ fontSize: 24, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{l}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1, lineHeight: 1.3 }}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <strong style={{ color: C.ink, fontWeight: 600 }}>Consistency</strong> looks at the last 28 days.
          It counts the days your cycle called for training, then how many of those you actually did —
          so {coach.consistency}% means you did {coach.consistency} out of every 100 sessions you were down for.
          Rest days aren't counted against you, and one missed day dents it rather than wiping it out.
          <br /><br />
          <strong style={{ color: C.ink, fontWeight: 600 }}>Per week</strong> is your true average across
          every week you've logged — the honest answer to "how often do I actually train?"
          You've hit your weekly target in {coach.weeksHit} week{coach.weeksHit === 1 ? "" : "s"}
.
        </div>
      </Card>



      {/* ---------- editable history: days ---------- */}
      <Fold title="Last two weeks" note="day by day, editable">
        <Explain>Tap any day to change it: empty → trained → rest → empty. Use this to fix a mistake or fill in a day you forgot.</Explain>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentDays.map((d) => {
            const l = data.logs[d];
            const state = l?.completed ? "trained" : l?.rest ? "rest" : coach.isScheduled(d) && d < coach.t ? "missed" : "—";
            /* Same rule: a missed day is stated, not alarmed. */
            const col = state === "trained" ? C.ink : state === "rest" ? C.moss : state === "missed" ? C.muted : "#9FB39C";
            return (
              <button key={d} onClick={() => cycleDay(d)} className="tap" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                padding: "10px 2px", border: "none", borderBottom: `1px solid ${C.chalk}`,
                background: "transparent", cursor: "pointer", textAlign: "left",
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: d === coach.t ? 600 : 400 }}>
                    {parse(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  {d === coach.t && <span className="mono" style={{ fontSize: 10, color: C.signal, marginLeft: 8 }}>TODAY</span>}
                  {l?.type && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{l.type}{l.minutes ? ` · ${l.minutes} min` : ""}</div>}
                </div>
                <span className="mono" style={{
                  fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: col,
                  border: `1px solid ${state === "—" ? C.line : col}`, borderRadius: 20, padding: "3px 9px",
                }}>{state}</span>
              </button>
            );
          })}
        </div>
            </Fold>

      {/* ---------- editable history: weekly checks ---------- */}
      <Fold title="Weekly checks" note="every battery you have filled in">
        <Explain>Tap a week to fill it in or change what you entered. Past weeks stay open — you can always go back.</Explain>
        {recentWeeks.map((ws) => {
          const entry = data.weekly[ws];
          const wkFields = data.fields.weekly.filter((f) => f.inWeekly !== false);
          const n = entry ? filledCount(entry, wkFields) : 0;
          return (
            <button key={ws} onClick={() => setSheet({ kind: "weekly", key: ws })} className="tap" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
              padding: "11px 2px", border: "none", borderBottom: `1px solid ${C.chalk}`,
              background: "transparent", cursor: "pointer", textAlign: "left",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: ws === coach.ws ? 600 : 400 }}>{weekLabel(ws)}</div>
                <div style={{ fontSize: 11, color: entry ? C.muted : "#9FB39C", marginTop: 2 }}>
                  {entry ? `${n} of ${wkFields.length} measures filled` : "Not filled in"}
                </div>
              </div>
              <span className="mono" style={{ fontSize: 15, color: entry ? C.ochre : C.line }}>{entry ? "✓" : "+"}</span>
            </button>
          );
        })}
            </Fold>

      {/* ---------- charts ---------- */}
      <Fold title="Sessions per week" note="eight week bar chart">
        <Explain>Each bar is one week. Your target is {coach.target} — bars at or above that line are weeks you hit it.</Explain>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={volume} style={chartBox} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="x" {...axis} /><YAxis {...axis} allowDecimals={false} />
            <Tooltip cursor={{ fill: C.chalk }} contentStyle={tip} />
            <Bar dataKey="v" radius={[3, 3, 0, 0]}>
              {volume.map((d, i) => <Cell key={i} fill={d.v >= coach.target ? C.moss : C.ink} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
            </Fold>

      <Fold title="How each measure is changing" note="weight, reps, left and right">
        {charted.length ? (
          <>
            <Explain>Tap a measure below to plot it.</Explain>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
              {charted.map((f) => (
                <button key={f.id} onClick={() => setPick(f.id)} className="tap mono" style={{
                  padding: "6px 11px", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", fontSize: 11, fontWeight: 500,
                  border: `1px solid ${sel?.id === f.id ? C.ink : C.line}`,
                  background: sel?.id === f.id ? C.ink : "transparent",
                  color: sel?.id === f.id ? C.chalk : C.muted,
                }}>{f.label}{f.type === "weightreps" ? " (load)" : ""}</button>
              ))}
            </div>
            {sel && (
              <div style={{ padding: "12px 14px", borderRadius: 12, background: C.chalk, marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{sel.label}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.muted }}>
                  Going across the bottom: <strong style={{ color: C.ink, fontWeight: 600 }}>the week</strong>,
                  oldest on the left, this week on the right.
                  <br />
                  {bars.length > 0 ? (
                    <>
                      The <strong style={{ color: C.ink, fontWeight: 600 }}>pink bars</strong> are
                      {" "}{bars[0].name === "weight" ? "the weight you lifted, read on the left" : "which level of the exercise you were on, read on the left"}.
                      <br />
                      The <strong style={{ color: C.ink, fontWeight: 600 }}>line{lines.length > 1 ? "s" : ""}</strong> {lines.length > 1 ? "are" : "is"}
                      {" "}{lines.map((l) => l.name).join(" and ")}, read on the right.
                    </>
                  ) : (
                    <>
                      Going up the side: <strong style={{ color: C.ink, fontWeight: 600 }}>
                        {sel.type === "time" ? "how long it took, in minutes and seconds"
                          : sel.unit === "sec" ? "how many seconds you held it"
                          : sel.unit === "reps" ? "how many repetitions you did"
                          : sel.unit || "the value you recorded"}
                      </strong>.
                    </>
                  )}
                  {" "}{sel.better === "down" ? "Going down is progress here — you want the number smaller."
                    : "Going up is progress."}
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={series} style={chartBox} margin={{ top: 10, right: bars.length && lines.length ? 8 : 4, bottom: 26, left: -12 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="x" {...axis}
                  label={{ value: "week beginning", position: "insideBottom", offset: -16,
                    style: { fontSize: 9.5, fill: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" } }} />

                {/* left axis carries the bars when there are any, otherwise the line */}
                <YAxis yAxisId="left" {...axis} domain={["auto", "auto"]}
                  tickFormatter={bars.length ? undefined : fmtY}
                  label={{ value: (bars.length ? bars[0] : lines[0])?.unit || "",
                    angle: -90, position: "insideLeft", offset: 22,
                    style: { fontSize: 9.5, fill: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" } }} />

                {/* right axis only exists when something is plotted against it */}
                {lines.some((v) => v.axis === "right") && (
                  <YAxis yAxisId="right" orientation="right" {...axis} domain={["auto", "auto"]}
                    label={{ value: lines.find((v) => v.axis === "right")?.unit || "",
                      angle: 90, position: "insideRight", offset: 18,
                      style: { fontSize: 9.5, fill: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" } }} />
                )}

                <Tooltip contentStyle={tip} />
                {variants.length > 1 && (
                  <Legend wrapperStyle={{ fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", paddingTop: 10 }} />
                )}

                {bars.map((v) => (
                  <Bar key={v.key} yAxisId={v.axis} name={`${v.name} (${v.unit})`} dataKey={v.key}
                    fill="#F0C4D2" radius={[5, 5, 0, 0]} barSize={20} />
                ))}
                {lines.map((v, i) => (
                  <Line key={v.key} yAxisId={v.axis} name={`${v.name} (${v.unit})`} dataKey={v.key} connectNulls
                    stroke={i === 0 ? C.signal : C.moss} strokeWidth={2.5}
                    dot={{ r: 4, fill: i === 0 ? C.signal : C.moss, strokeWidth: 0 }}
                    activeDot={{ r: 6 }} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        ) : (
          <Blank
            text="Nothing to plot yet. Fill in two weekly checks and every measure you've entered twice will show up here as a line."
            action="Fill in this week"
            onAction={() => setSheet({ kind: "weekly", key: coach.ws })}
          />
        )}
            </Fold>

      <Fold title="Personal bests" note="your best result in each measure">
        {Object.keys(coach.pbs).length ? (
          <>
            <Explain>Your best result on every measure — the whole result, not one half of it.</Explain>
            {data.fields.weekly.map((f) => {
              const b = bestEntryFor(f, [data.weekly, data.monthly]);
              if (!b) return null;
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  gap: 10, padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{f.label}</div>
                    <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                      week of {b.when}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="disp" style={{ fontSize: 20, fontWeight: 400, color: C.ochre, lineHeight: 1.1 }}>{b.main}</div>
                    {b.sub && <div className="mono" style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>{b.sub}</div>}
                  </div>
                </div>
              );
            })}
          </>
        ) : <Blank text="Your first weekly check sets the baseline. Everything after that is measured against it." />}
            </Fold>

      {/* ---------- editable history: monthly ---------- */}
      <Fold title="Monthly benchmarks" note="body composition over time">
        <Explain>The slow-moving numbers — body composition, mobility, the walk test. Tap a month to fill it in or edit it.</Explain>
        {recentMonths.map((mk) => {
          const entry = data.monthly[mk];
          const moFields = [...data.fields.monthly, ...data.fields.weekly];
          const n = entry ? filledCount(entry, moFields) : 0;
          return (
            <button key={mk} onClick={() => setSheet({ kind: "monthly", key: mk })} className="tap" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
              padding: "11px 2px", border: "none", borderBottom: `1px solid ${C.chalk}`,
              background: "transparent", cursor: "pointer", textAlign: "left",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: mk === coach.mk ? 600 : 400 }}>{monthLabel(mk)}</div>
                <div style={{ fontSize: 11, color: entry ? C.muted : "#9FB39C", marginTop: 2 }}>
                  {entry ? `${n} of ${moFields.length} measures filled` : "Not filled in"}
                </div>
              </div>
              <span className="mono" style={{ fontSize: 15, color: entry ? C.ochre : C.line }}>{entry ? "✓" : "+"}</span>
            </button>
          );
        })}

        {mKeys.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <table className="mono" style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ textAlign: "left", padding: "6px 8px 6px 0", color: C.muted, fontWeight: 500 }}>Measure</th>
                {mKeys.slice(-4).map((k) => <th key={k} style={{ padding: 6, color: C.muted, fontWeight: 500 }}>{k.slice(5)}</th>)}
              </tr></thead>
              <tbody>
                {[...data.fields.monthly, ...data.fields.weekly].filter((f) => f.type !== "note").map((f) => (
                  <tr key={f.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: "7px 8px 7px 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>{f.label}</td>
                    {mKeys.slice(-4).map((k) => <td key={k} style={{ padding: 7, textAlign: "center" }}>{data.monthly[k][f.id] || "–"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
            </Fold>

    </div>
  );
}

/* ------------------------------------------------------------ SETTINGS ---- */
function Settings({ data, setData, setSheet }) {
  const s = data.settings;
  const set = (k, v) => setData({ ...data, settings: { ...s, [k]: v } });

  /* A file download navigates this frame away and lands on a blank page, so
     the export is shown on screen instead — copy it and paste it anywhere. */
  const [exportText, setExportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [fillArmed, setFillArmed] = useState(false);
  const sched = scheduleOf(s);
  const setSchedule = (patch) => set("schedule", { ...sched, ...patch });
  /* Days of her own training on this device — zero while sample data is loaded. */
  const realHistory = data.sample ? 0 : Object.keys(data.logs || {}).length;

  /* backup: folder grant, status line, snapshot list */
  const [folderName, setFolderName] = useState(null);
  const [backupMsg, setBackupMsg] = useState("");
  const [snaps, setSnaps] = useState([]);
  const ageDays = backupAgeDays();

  useEffect(() => {
    let alive = true;
    dirLoad().then((h) => { if (alive && h) setFolderName(h.name || "your folder"); });
    try { setSnaps(snapRead()); } catch (e) {}
    return () => { alive = false; };
  }, []);

  const pickFolder = async () => {
    try {
      const h = await window.showDirectoryPicker({ mode: "readwrite", startIn: "documents" });
      await dirSave(h);
      setFolderName(h.name || "your folder");
      const r = await writeToFolder(data);
      setBackupMsg(r === "ok"
        ? `Saved into ${h.name}. From now on a fresh copy lands there every time you open the app.`
        : "Folder remembered, but the first write didn't go through. Try Back up now.");
    } catch (e) {
      if (e && e.name !== "AbortError") setBackupMsg("Couldn't open the folder picker on this browser.");
    }
  };

  const backupNow = async () => {
    setBackupMsg("");
    if (folderName) {
      const r = await writeToFolder(data);
      if (r === "ok") { setBackupMsg(`Copy written into ${folderName}.`); return; }
      if (r === "denied") { setBackupMsg("The browser needs permission again — pick the folder once more."); return; }
    }
    if (canShareFiles()) {
      const r = await shareBackup(data);
      if (r === "ok") { setBackupMsg("Sent. Choose OneDrive or Drive to keep it off this device."); return; }
      if (r === "cancelled") { setBackupMsg(""); return; }
    }
    setBackupMsg(downloadBackup(data)
      ? "Downloaded. Move it into OneDrive or Drive so it isn't only on this device."
      : "That didn't work — use Show my data below and copy it by hand.");
  };

  const restoreSnapshot = (snap) => {
    try {
      const incoming = JSON.parse(snap.json);
      let added = 0;
      setData((prev) => {
        const next = mergeInto(prev, incoming);
        added = (next.issues.length - (prev.issues || []).length)
              + (next.goals.length - (prev.goals || []).length)
              + (next.chats.length - (prev.chats || []).length);
        return next;
      });
      setBackupMsg(`Put back the copy from ${prettyShort(snap.day)}${added ? `, which brought back ${added} item${added === 1 ? "" : "s"}` : ""}. Nothing already here was removed.`);
      setSnaps(snapRead());
    } catch (e) { setBackupMsg("That snapshot couldn't be read."); }
  };
  const exportData = () => {
    setExportText(JSON.stringify(data, null, 2));
    setCopied(false);
  };
  const [restoring, setRestoring] = useState(false);
  const [restoreText, setRestoreText] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");

  /* ONE MERGE, USED BY BOTH RESTORE PATHS.

     `{ ...prev, ...incoming }` looks like a merge and is not: it replaces
     whole branches, so every list the spread does not explicitly name is
     overwritten by the older copy. Restoring a nine-day-old snapshot silently
     cost her every goal, conversation, journal entry, kept note, class and
     tuned threshold added since — while the message said nothing was removed.

     Lists merge by id so restoring twice cannot duplicate. Objects merge
     key-by-key. What is on this device always survives. Rule 20. */
  const mergeById = (mine, theirs, key = "id") => {
    const out = [...(mine || [])];
    (theirs || []).forEach((x) => {
      if (out.findIndex((y) => y && x && y[key] === x[key]) === -1) out.push(x);
    });
    return out;
  };
  const mergeInto = (prev, incoming) => ({
    ...prev,
    ...incoming,
    settings: { ...prev.settings, ...(incoming.settings || {}) },
    logs:     { ...prev.logs,     ...(incoming.logs || {}) },
    morning:  { ...prev.morning,  ...(incoming.morning || {}) },
    weekly:   { ...prev.weekly,   ...(incoming.weekly || {}) },
    monthly:  { ...prev.monthly,  ...(incoming.monthly || {}) },
    mobility: { ...prev.mobility, ...(incoming.mobility || {}) },
    notes:    { ...prev.notes,    ...(incoming.notes || {}) },
    plan:     { ...prev.plan,     ...(incoming.plan || {}) },
    journal: [...(prev.journal || []), ...((incoming.journal || []).filter(
      (j) => !(prev.journal || []).some((p) => p.date === j.date && p.text === j.text)))],
    issues: mergeById(prev.issues, incoming.issues),
    goals:  mergeById(prev.goals,  incoming.goals),
    chats:  mergeById(prev.chats,  incoming.chats),
    profile: mergeById(prev.profile, incoming.profile),
    /* Her library and her programme are current state, not history: keep what
       is on the device unless this copy is the only one that has any. */
    library: (prev.library && prev.library.length) ? prev.library : incoming.library,
    fields:  prev.fields || incoming.fields,
    program: (prev.program?.phases?.length) ? prev.program : incoming.program,
    sample: false,
  });

  const restoreData = () => {
    try {
      const incoming = JSON.parse(restoreText);
      if (!incoming || typeof incoming !== "object" || !incoming.logs) {
        setRestoreMsg("That doesn't look like a backup — it should start with a curly brace.");
        return;
      }
      /* Same merge as the snapshot path — see mergeInto above. */
      let added = { issues: 0, goals: 0, chats: 0 };
      setData((prev) => {
        const next = mergeInto(prev, incoming);
        added = {
          issues: next.issues.length - (prev.issues || []).length,
          goals: next.goals.length - (prev.goals || []).length,
          chats: next.chats.length - (prev.chats || []).length,
        };
        return next;
      });
      const days = Object.keys(incoming.morning || {}).length;
      const extra = [added.issues && `${added.issues} to the record`,
                     added.goals && `${added.goals} goal${added.goals === 1 ? "" : "s"}`,
                     added.chats && `${added.chats} conversation${added.chats === 1 ? "" : "s"}`]
                    .filter(Boolean).join(", ");
      setRestoreMsg(`Restored. ${Object.keys(incoming.logs || {}).length} days of training and ${days} days of WHOOP data${extra ? `, plus ${extra}` : ""}. Nothing already here was removed.`);
      setRestoreText("");
    } catch {
      setRestoreMsg("Couldn't read that. Make sure you copied the whole thing.");
    }
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
    } catch {
      const el = document.getElementById("coach-export");
      if (el) { el.select(); document.execCommand("copy"); setCopied(true); }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Fold title="You" note="name, age, height, goal">
        <Field label="Name" unit="" type="text" value={s.name} onChange={(v) => set("name", v)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Age" unit="yrs" value={s.age} onChange={(v) => set("age", v)} />
          <Field label="Height" unit="cm" value={s.height} onChange={(v) => set("height", v)} />
        </div>
        <Field label="Primary goal" unit="" type="text" value={s.primaryGoal} onChange={(v) => set("primaryGoal", v)} />
            </Fold>

      <Card style={{ background: data.sample ? C.pist : C.card }}>
        <Eyebrow>Sample data</Eyebrow>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, marginBottom: 12 }}>
          {data.sample
            ? "The app is currently filled with ten weeks of made-up history so you can see every calculation working. Clear it before you start logging for real."
            : "Fills the app with ten weeks of plausible history — sessions, recovery, batteries, notes — so you can see every chart, verdict and calculation with data behind it."}
        </div>
        {/* Filling with sample data overwrites logs, WHOOP, batteries,
            benchmarks and the journal wholesale. On an app holding real
            training that is destruction on one tap, so it asks first — and
            only when there is something to destroy. Rule 20. */}
        {!data.sample && realHistory > 0 && !fillArmed ? (
          <>
            <Btn kind="ghost" onClick={() => setFillArmed(true)}>Fill with sample data</Btn>
            <div style={{ fontSize: 11.5, color: C.clay, lineHeight: 1.5, marginTop: 8 }}>
              You have {realHistory} day{realHistory === 1 ? "" : "s"} of your own logged. Sample data would
              replace them.
            </div>
          </>
        ) : !data.sample && fillArmed ? (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: C.clay, marginBottom: 10 }}>
              This replaces your {realHistory} logged day{realHistory === 1 ? "" : "s"}, your WHOOP history,
              your batteries and your journal with invented ones. Take a backup first if you want them.
            </div>
            <Btn kind="signal" onClick={() => {
              setData((d) => ({ ...d, ...buildSample(d.fields, d.library) }));
              setFillArmed(false);
            }}>Yes, replace my data with samples</Btn>
            <div style={{ marginTop: 8 }}>
              <Btn kind="quiet" onClick={() => setFillArmed(false)}>Never mind</Btn>
            </div>
          </>
        ) : (
          <Btn kind={data.sample ? "quiet" : "ghost"} onClick={() => {
            if (data.sample) {
              setData((d) => ({ ...d, logs: {}, morning: {}, weekly: {}, monthly: {}, journal: [], sample: false }));
            } else {
              setData((d) => ({ ...d, ...buildSample(d.fields, d.library) }));
            }
          }}>{data.sample ? "Clear the sample data" : "Fill with sample data"}</Btn>
        )}
      </Card>

      <Fold title="Training" note="rhythm, weekly number, gym date">
        {!scheduleSet(s) && (
          <Field label="Weekly target" unit="sessions" value={s.weeklyTarget} onChange={(v) => set("weeklyTarget", v)} />
        )}
        <Field label="Recovery baseline" unit="% — where your normal sits" value={s.recoveryBaseline}
          onChange={(v) => set("recoveryBaseline", v)} />
        <div style={{ fontSize: 11, color: C.muted, marginTop: -8, marginBottom: 14, lineHeight: 1.45 }}>
          Only used until there are thirty days of scores to read it from. After that I take the median
          of your own last month, so the bar rises as you do.
        </div>
        <Field label="Home gym available from" unit="unlocks the gym classes" type="date" value={s.gymDate}
          onChange={(v) => set("gymDate", v)} />
        {/* HER RHYTHM. Driven by SCHEDULE_MODES, so adding a new way of
            training means adding a list entry at the top of the file and
            nothing here changes. */}
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>How often you train</div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
          Whatever you choose here is what the coach counts against — nothing else. Change it whenever
          it stops fitting; nothing you have already done is affected.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {SCHEDULE_MODES.map((m) => {
            const on = sched.mode === m.id;
            return (
              <button key={m.id} onClick={() => setSchedule({ mode: m.id })} className="tap" style={{
                textAlign: "left", padding: "11px 13px", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${on ? C.signal : C.line}`,
                background: on ? C.pist : "transparent", color: C.ink, fontFamily: "inherit",
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2, lineHeight: 1.45 }}>{m.blurb}</div>
              </button>
            );
          })}
        </div>

        {sched.mode === "cycle" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field label="Train" unit="days" value={sched.on ?? 2} onChange={(v) => setSchedule({ on: Number(v) || 1 })} />
              <Field label="Then rest" unit="days" value={sched.off ?? 1} onChange={(v) => setSchedule({ off: Number(v) || 1 })} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.45 }}>
              The rhythm turns with you rather than with the calendar — train a day late and it simply
              moves. That works out at roughly {Math.round((7 * (Number(sched.on) || 2)) / ((Number(sched.on) || 2) + (Number(sched.off) || 1)) * 10) / 10} sessions a week.
            </div>
          </>
        )}

        {sched.mode === "days" && (
          <>
            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => {
                const on = (sched.days || []).includes(d);
                return (
                  <button key={d} onClick={() => setSchedule({
                    days: on ? (sched.days || []).filter((x) => x !== d) : [...(sched.days || []), d],
                  })} className="tap mono" style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600,
                    border: `1.5px ${on ? "solid" : "dashed"} ${on ? C.ink : C.line}`,
                    background: on ? C.ink : "transparent", color: on ? C.chalk : C.muted,
                  }}>{d[0]}</button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.45 }}>
              {(sched.days || []).length ? `${(sched.days || []).length} days a week.` : "Pick the days that actually work."}
            </div>
          </>
        )}

        {sched.mode === "count" && (
          <>
            <Field label="Times a week" unit="sessions" value={sched.perWeek ?? 4}
              onChange={(v) => setSchedule({ perWeek: Number(v) || 1 })} />
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.45 }}>
              You choose the days as you go. Nothing counts as missed until the week is over — and if the
              week comes up short, that is all it is.
            </div>
          </>
        )}

        {scheduleSet(s) && (
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Sessions a week</span>
              <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{weeklyTargetOf(s)}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>
              Read straight off the rhythm above &mdash; {scheduleSummary(sched)}. There is only ever one
              number, so change the rhythm and everything that counts weeks follows it.
            </div>
          </div>
        )}

        <Field label="This month's theme" unit="" type="text" value={s.monthTheme} onChange={(v) => set("monthTheme", v)} />
            </Fold>

      <Fold title="Assessments" note="edit both batteries and the formulas">
        <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>
          Both batteries are yours. Add a measure, drop one, change the reps, the weights, the units,
          what counts as progress. Strength, cardio and mobility all work the same way.
        </div>
        <Btn kind="ghost" onClick={() => setSheet({ kind: "edit-mobility" })}>Edit the mobility battery</Btn>
        <div style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.45 }}>
          Rename exercises, change units, reorder, or add your own. Renaming keeps the history — the chart just picks up the new name.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn kind="ghost" onClick={() => setSheet({ kind: "edit-weekly" })}>Weekly · {data.fields.weekly.length}</Btn>
          <Btn kind="ghost" onClick={() => setSheet({ kind: "edit-monthly" })}>Monthly · {data.fields.monthly.length}</Btn>
          <Btn kind="ghost" onClick={() => setSheet({ kind: "formulas" })}>Formulas &amp; scoring</Btn>
        </div>
            </Fold>

      <Fold title="Inputs" note="WHOOP and shoulder tracking">
        <div style={{ paddingBottom: 4 }}>
          <Btn kind="signal" onClick={() => setSheet({ kind: "whoop" })}>Import WHOOP data</Btn>
          <div style={{ marginTop: 8 }}>
            <Btn kind="quiet" onClick={() => setSheet({ kind: "whooplog" })}>See everything WHOOP has sent</Btn>
          </div>
        </div>
        {[["shoulderInjury", "Track the shoulder as a number",
           "Off: the app never asks about your shoulder and never reports on it — tell the coach in your own words instead, and it will remember. On: a comfort score each day, a morning-after reading, and a headline number. Anything already recorded is kept either way."],
          ["whoopConnected", "Enter WHOOP data", "Adds recovery, strain and sleep. The coach reads recovery."]].map(([k, label, hint]) => (
          <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{hint}</div>
            </div>
            <button onClick={() => set(k, !s[k])} className="tap" style={{
              width: 46, height: 27, borderRadius: 14, flexShrink: 0, cursor: "pointer", position: "relative",
              border: `1px solid ${s[k] ? C.ink : C.line}`, background: s[k] ? C.ink : "transparent",
            }}>
              <div style={{ width: 19, height: 19, borderRadius: 10, background: s[k] ? C.chalk : C.muted, position: "absolute", top: 3, left: s[k] ? 23 : 3, transition: "left 160ms ease" }} />
            </button>
          </div>
        ))}
            </Fold>

      <Fold title="Your data" note="backups, export and reset">
        <VersionRow />
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.45 }}>
          Everything lives in this browser, on this device. A copy kept somewhere else is
          what makes that safe rather than fragile.
        </div>

        {/* where it stands, said plainly */}
        <div style={{ background: C.chalk, borderRadius: 12, padding: "11px 13px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            {ageDays === null
              ? "No copy has left this device yet."
              : ageDays === 0 ? "A copy left this device today."
              : `Last copy off this device: ${ageDays} day${ageDays === 1 ? "" : "s"} ago.`}
          </div>
          {folderName && (
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>
              Writing automatically into <strong>{folderName}</strong> each time the app opens.
            </div>
          )}
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>
            {snaps.length
              ? `${snaps.length} daily snapshot${snaps.length === 1 ? "" : "s"} kept on the device as well.`
              : "Daily snapshots start once you log something."}
          </div>
        </div>

        <Btn kind="signal" onClick={backupNow}>Back up now</Btn>

        {canPickFolder() && (
          <div style={{ marginTop: 10 }}>
            <Btn kind="ghost" onClick={pickFolder}>
              {folderName ? `Change the folder (now: ${folderName})` : "Choose a folder to back up into"}
            </Btn>
            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginTop: 8 }}>
              Pick your OneDrive or Google Drive folder and the app writes a dated copy into it
              every time it opens — OneDrive syncs it up from there. You grant this once.
            </div>
          </div>
        )}
        {!canPickFolder() && (
          <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginTop: 8 }}>
            {canShareFiles()
              ? "On a phone, Back up now opens the share sheet — send it to OneDrive or Drive. Automatic folder backup needs a desktop browser."
              : "This browser can't write to a folder on its own. Back up now saves a file you can move into OneDrive."}
          </div>
        )}
        {backupMsg && (
          <div style={{ fontSize: 12.5, color: C.moss, marginTop: 10, lineHeight: 1.5 }}>{backupMsg}</div>
        )}

        {snaps.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <Eyebrow>Snapshots on this device</Eyebrow>
            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>
              Taken automatically, one a day. Putting one back merges it in — nothing already
              here is removed.
            </div>
            {snaps.map((sn) => (
              <div key={sn.day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 0", borderBottom: `1px solid ${C.chalk}` }}>
                <div>
                  <div style={{ fontSize: 13 }}>{prettyShort(sn.day)}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{sn.days} day{sn.days === 1 ? "" : "s"} of training</div>
                </div>
                <button onClick={() => restoreSnapshot(sn)}
                  style={{ border: `1px solid ${C.line}`, background: C.card, color: C.ink, borderRadius: 10,
                           padding: "6px 11px", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                  Put this back
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <Btn kind="quiet" onClick={exportData}>Show my data as text</Btn>
        </div>
        {!insideClaude() && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <Field label="Anthropic API key" unit="" type="text" value={s.apiKey || ""}
              onChange={(v) => set("apiKey", v)} />
            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginTop: -6 }}>
              Only needed when the app runs on its own hosting — it's what lets the coach talk back.
              Stays on this device, never sent anywhere except to Anthropic.
            </div>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <Btn kind="quiet" onClick={() => setRestoring((v) => !v)}>
            {restoring ? "Never mind" : "Restore from a backup"}
          </Btn>
        </div>

        {restoring && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>
              Moving between your laptop and your phone: back up on one, copy it, paste it here on
              the other. Nothing already on this device is lost — the two are merged.
            </div>
            <textarea value={restoreText} onChange={(e) => setRestoreText(e.target.value)}
              placeholder="Paste the backup here"
              style={{ ...inputStyle, minHeight: 110, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }} />
            <Btn kind="signal" onClick={restoreData}>Restore it</Btn>
            {restoreMsg && (
              <div style={{ fontSize: 12.5, color: restoreMsg.startsWith("Restored") ? C.moss : C.clay,
                marginTop: 10, lineHeight: 1.5 }}>{restoreMsg}</div>
            )}
          </div>
        )}

        {exportText && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>
              A copy of everything you've logged, in case you ever need to restore it.
              Nothing to do with WHOOP.
            </div>
            <textarea id="coach-export" readOnly value={exportText}
              onFocus={(e) => e.target.select()}
              style={{ ...inputStyle, minHeight: 130, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }} />
            <Btn kind={copied ? "quiet" : "signal"} onClick={copyExport}>
              {copied ? "Copied" : "Copy all of it"}
            </Btn>
          </div>
        )}
            </Fold>
    </div>
  );
}

/* ------------------------------------------------------------ VERSION ----
   Closing the app and opening it again is supposed to be enough. When it is
   not, this asks the browser directly, and either finds something or says
   plainly that there is nothing to find — which is the part that was missing.
   It never touches stored data. */
function VersionRow() {
  const [state, setState] = useState("idle");   /* idle | checking | fresh | found | cannot */

  const check = async () => {
    setState("checking");
    try {
      if (!("serviceWorker" in navigator)) { setState("cannot"); return; }
      const regs = await navigator.serviceWorker.getRegistrations();
      if (!regs.length) { setState("cannot"); return; }
      let found = false;
      for (const r of regs) {
        await r.update();
        if (r.installing || r.waiting) found = true;
      }
      if (found) {
        setState("found");
        setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 900);
      } else {
        setState("fresh");
      }
    } catch (e) { setState("cannot"); }
  };

  const line = {
    idle: null,
    checking: "Asking…",
    fresh: "This is the newest version. Nothing to fetch.",
    found: "A newer version is here — reloading into it now.",
    cannot: "Could not ask from here. Open the app in Chrome and add ?v=2 to the address; that forces a fresh copy without touching your data.",
  }[state];

  return (
    <div style={{ background: C.chalk, borderRadius: 12, padding: "11px 13px", marginBottom: 12 }}>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        This phone is running <strong style={{ fontWeight: 600 }}>{BUILD}</strong>.
      </div>
      <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>
        The app updates itself in the background and usually needs two opens to change over.
      </div>
      <div style={{ marginTop: 10 }}>
        <Btn kind="ghost" onClick={check}>
          {state === "checking" ? "Checking…" : "Check for a newer version"}
        </Btn>
      </div>
      {line && (
        <div style={{ fontSize: 12, color: state === "cannot" ? C.clay : C.moss,
          marginTop: 9, lineHeight: 1.5 }}>{line}</div>
      )}
    </div>
  );
}

/* -------------------------------------------------------- FIELD EDITOR ---- */
function FieldEditor({ which, data, setData, close }) {
  const [list, setList] = useState(data.fields[which]);
  const [openId, setOpenId] = useState(null);

  const patch = (id, p) => setList((l) => l.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const move = (i, dir) => setList((l) => {
    const n = [...l], j = i + dir;
    if (j < 0 || j >= n.length) return n;
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const remove = (id) => setList((l) => l.filter((f) => f.id !== id));
  const add = () => {
    const f = { id: newId(), label: "New measure", unit: "reps", type: "number", better: "up",
      cap: "", role: "rotating", inWeekly: true, rungs: [] };
    setList((l) => [...l, f]); setOpenId(f.id);
  };
  const save = () => { setData({ ...data, fields: { ...data.fields, [which]: list } }); close(); };

  const TYPES = [["number", "Number"], ["weightreps", "Weight x reps"], ["time", "Time"], ["rung", "Ladder only"], ["scale", "Scale"], ["note", "Note"]];
  const BETTER = [["up", "Higher is better"], ["down", "Lower is better"], [null, "Neither"]];

  return (
    <>
      <Eyebrow color={C.ochre}>{which === "weekly" ? "Weekly check" : "Monthly benchmark"} fields</Eyebrow>
      <h2 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>What do you want to measure?</h2>
      <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px", lineHeight: 1.45 }}>
        Tap a row to edit it. Deleting a measure hides it from the form but leaves past entries untouched.
      </p>

      <Card style={{ padding: 8 }}>
        {list.map((f, i) => (
          <div key={f.id} style={{ borderBottom: i < list.length - 1 ? `1px solid ${C.chalk}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 6px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[[-1, "▲"], [1, "▼"]].map(([d, ch]) => (
                  <button key={d} onClick={() => move(i, d)} className="tap" style={{
                    border: "none", background: "transparent", cursor: "pointer", color: C.muted,
                    fontSize: 8, lineHeight: 1, padding: "2px 3px",
                  }}>{ch}</button>
                ))}
              </div>
              <button onClick={() => setOpenId(openId === f.id ? null : f.id)} style={{
                flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "2px 0",
              }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{f.label || "Untitled"}</div>
                <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                  {f.cap ? f.cap + " · " : ""}{f.role === "anchor" ? "anchor" : "rotating"}
                  {f.inWeekly !== false ? " · weekly" : " · monthly"}
                  {f.rungs?.length > 1 ? ` · ${f.rungs.length} rungs` : ""}
                </div>
              </button>
              <button onClick={() => remove(f.id)} className="tap" style={{
                border: "none", background: "transparent", cursor: "pointer", color: C.clay, fontSize: 16, padding: "4px 6px",
              }}>×</button>
            </div>

            {openId === f.id && (
              <div style={{ padding: "4px 6px 14px" }}>
                <Field label="Name" unit="" type="text" value={f.label} onChange={(v) => patch(f.id, { label: v })} />
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Input type</div>
                <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                  {TYPES.map(([v, l]) => (
                    <button key={v} onClick={() => patch(f.id, { type: v })} className="tap" style={{
                      flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
                      border: `1.5px solid ${f.type === v ? C.ink : C.line}`,
                      background: f.type === v ? C.ink : "transparent", color: f.type === v ? C.chalk : C.muted,
                    }}>{l}</button>
                  ))}
                </div>
                {(f.type === "number" || f.type === "weightreps" || f.type === "time") &&
                  <Field label="Unit" unit="" type="text" value={f.unit} onChange={(v) => patch(f.id, { unit: v })} />}

                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Capability</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                  {[...CAPS, ""].map((c) => (
                    <button key={c || "none"} onClick={() => patch(f.id, { cap: c })} className="tap mono" style={{
                      padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500,
                      border: `1.5px solid ${(f.cap || "") === c ? C.ink : C.line}`,
                      background: (f.cap || "") === c ? C.ink : "transparent",
                      color: (f.cap || "") === c ? C.chalk : C.muted,
                    }}>{c || "none"}</button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[["role", f.role === "anchor", "Anchor", () => patch(f.id, { role: f.role === "anchor" ? "rotating" : "anchor" })],
                    ["wk", f.inWeekly !== false, "In weekly", () => patch(f.id, { inWeekly: f.inWeekly === false })]].map(([k, on, label, fn]) => (
                    <button key={k} onClick={fn} className="tap" style={{
                      flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
                      border: `1.5px solid ${on ? C.signal : C.line}`,
                      background: on ? C.signal : "transparent", color: on ? C.chalk : C.muted,
                    }}>{label}{on ? " ✓" : ""}</button>
                  ))}
                </div>

                <Field label="Ladder rungs" unit="comma separated, blank for none" type="text"
                  value={(f.rungs || []).join(", ")}
                  onChange={(v) => patch(f.id, { rungs: v.split(",").map((x) => x.trim()).filter(Boolean) })} />

                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button onClick={() => patch(f.id, { bilateral: !f.bilateral })} className="tap" style={{
                    flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
                    border: `1.5px solid ${f.bilateral ? C.signal : C.line}`,
                    background: f.bilateral ? C.signal : "transparent", color: f.bilateral ? C.chalk : C.muted,
                  }}>Left / right separately{f.bilateral ? " ✓" : ""}</button>
                </div>
                {f.type === "scale" && <Field label="Highest value" unit="" value={f.max || 5} onChange={(v) => patch(f.id, { max: Number(v) || 5 })} />}
                {f.type !== "note" && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Direction of progress</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {BETTER.map(([v, l]) => (
                        <button key={String(v)} onClick={() => patch(f.id, { better: v })} className="tap" style={{
                          flex: 1, padding: "9px 4px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500, lineHeight: 1.2,
                          border: `1.5px solid ${f.better === v ? C.ink : C.line}`,
                          background: f.better === v ? C.ink : "transparent", color: f.better === v ? C.chalk : C.muted,
                        }}>{l}</button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>
                      "Higher is better" makes this measure eligible for personal bests.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </Card>

      <div style={{ marginTop: 10 }}><Btn kind="ghost" onClick={add}>+ Add a measure</Btn></div>
      <div style={{ marginTop: 14 }}>
        <Btn kind="signal" onClick={save}>Save fields</Btn>
        <Btn kind="quiet" onClick={close}>Cancel</Btn>
      </div>
    </>
  );
}

/* ------------------------------------------------------ ASSESSMENT SHEET -- */

/* ============================================================================
   COACH CHAT
   The part that makes this a coach rather than a scoreboard. It gets the same
   picture the engine has — phase, themes, this week's call, recent sessions,
   the shoulder situation — so you can argue with a decision and get a real
   answer rather than a canned one.
========================================================================== */

/* ---- everything the coach has ever said to her, kept ---------------------- */

/* ============================================================================
   WHOOP IMPORT
   Reads the CSV export straight from the app. The important subtlety: a WHOOP
   cycle starts the evening before, so the recovery score attached to a cycle
   beginning Tuesday night is the number she sees on Wednesday morning. We file
   everything under the wake date, which is the day it actually describes.
========================================================================== */
const parseCSV = (text) => {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() || [];
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
};

const dayOf = (stamp) => (stamp || "").slice(0, 10);

/* the day a cycle describes is the morning it ends on */
const wakeDay = (row) => {
  const wake = dayOf(row["Wake onset"]);
  if (wake) return wake;
  const start = row["Cycle start time"] || "";
  const hour = Number((start.slice(11, 13)) || 0);
  return hour >= 18 ? addDays(dayOf(start), 1) : dayOf(start);
};


/* ---- the journal: everything you've written, in one place ----------------
   Session notes are the most human data in the app. They were being saved and
   then buried. This is where you read them back.
------------------------------------------------------------------------ */

/* ---- the read-out: what moved, why, and what to do about it -------------- */

/* ---- every number the engine uses, exposed and editable ------------------ */
function Formulas({ data, setData, close }) {
  const F = formulas(data.settings);
  const set = (k, v) => setData((d) => ({
    ...d, settings: { ...d.settings, formulas: { ...(d.settings.formulas || {}), [k]: Number(v) || 0 } },
  }));
  const reset = () => setData((d) => ({ ...d, settings: { ...d.settings, formulas: {} } }));

  const groups = [
    { title: "Recovery bands", note: "Set relative to your own baseline, not WHOOP's scale. Positive means above your normal.",
      rows: [["bandGreen", "Progress at baseline +"], ["bandSteady", "Train as planned at baseline +"],
             ["bandEasy", "Ease off at baseline +"]] },
    { title: "Weekly health score", note: "Weights are renormalised over whatever data exists, so they needn't total 100.",
      rows: [["wCompletion", "Sessions completed"], ["wRecovery", "Recovery"], ["wSleep", "Sleep"],
             ["wStrength", "Strength"], ["wMobility", "Mobility"], ["wBalance", "Balance"]] },
    { title: "Consistency", note: "How far back the consistency percentage looks.",
      rows: [["consistencyWindow", "Days counted"]] },
    { title: "Load balance", note: "Acute against chronic workload. Inside the corridor is where training is productive; above the spike line is where injuries come from — not from hard training, but from sudden training.",
      rows: [["acwrLow", "Below this: doing less than you're built for"],
             ["acwrHigh", "Above this: pushing"],
             ["acwrSpike", "Above this: a spike"]] },
    { title: "Weekly sets", note: "Sets per body region per week. Six to ten is what governs holding muscle at your age — this is the floor the coach measures against.",
      rows: [["setTarget", "Sets a region needs each week"]] },
    { title: "Body coverage", note: "How big a share of the week's work a region needs before it counts as covered rather than thin. Shares, so 0.07 means 7%.",
      rows: [["coverMin", "Counts as covered above"], ["coverStrong", "Counts as a real share above"]] },
    { title: "Real change, not noise", note: "Every measurement carries error. A change is only called real above these thresholds — below them the word is holding, never declining. Percentages.",
      rows: [["mdcLoad", "Weight × reps"], ["mdcTime", "Timed holds"],
             ["mdcReps", "Rep counts"], ["mdcBalance", "Balance"],
             ["asymmetryPct", "Left-right gap worth naming (mobility)"],
             ["bilateralPct", "Left-right gap worth naming (strength)"]] },
  ];

  return (
    <div>
      <Eyebrow color={C.signal}>Formulas</Eyebrow>
      <h1 className="disp" style={{ fontSize: 25, fontWeight: 400, lineHeight: 1.12, margin: "0 0 8px" }}>
        Every number the coach uses
      </h1>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.muted, marginBottom: 20 }}>
        Nothing here is fixed. Change anything and the whole app recalculates from it — scores, levels,
        the recovery prescription, the weekly verdict.
      </div>

      {groups.map((g) => (
        <Card key={g.title} style={{ marginBottom: 12 }}>
          <Eyebrow>{g.title}</Eyebrow>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, marginBottom: 14 }}>{g.note}</div>
          {g.rows.map(([k, label]) => (
            <Field key={k} label={label} unit="" value={F[k]} onChange={(v) => set(k, v)} />
          ))}
        </Card>
      ))}

      <Btn kind="quiet" onClick={reset}>Reset every formula to its original value</Btn>
      <div style={{ marginTop: 12 }}><Btn kind="quiet" onClick={close}>Back</Btn></div>
    </div>
  );
}

function Analysis({ coach, close, setSheet }) {
  const groups = [
    { key: "up", label: "Improving", items: coach.improving, tint: C.mint, tone: C.moss },
    { key: "flat", label: "Holding", items: coach.holding, tint: C.chalk, tone: C.muted },
    { key: "down", label: "Needs attention", items: coach.declining, tint: "rgba(194,84,47,0.08)", tone: C.clay },
  ];

  return (
    <div>
      <Eyebrow color={C.signal}>Analysis</Eyebrow>
      <h1 className="disp" style={{ fontSize: 25, fontWeight: 400, lineHeight: 1.12, margin: "0 0 8px" }}>
        What's actually moving
      </h1>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.muted, marginBottom: 20 }}>
        Every measure compared with your last reading and your own best. Nothing here is an absolute
        number — a result only means something against another result.
      </div>

      {coach.overall !== null && (
        <Card style={{ marginBottom: 16, background: C.pist }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="disp" style={{ fontSize: 40, fontWeight: 300, lineHeight: 1, color: C.ink }}>{coach.overall}</span>
            <span style={{ fontSize: 14, color: C.muted }}>out of 10</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: C.muted, marginTop: 8 }}>
            Where you're sitting right now against your own personal bests, averaged across every measure.
            Ten would mean every single measure is at its all-time best on the same day.
          </div>
        </Card>
      )}

      {coach.analysis.length === 0 && (
        <Card>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.muted }}>
            Nothing to compare yet. Run the battery twice and this fills up — the first reading is the
            baseline, the second is the first real comparison.
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn kind="signal" onClick={() => setSheet({ kind: "weekly", key: coach.ws })}>Run the weekly battery</Btn>
          </div>
        </Card>
      )}

      {groups.map((g) => g.items.length > 0 && (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: g.tone, marginBottom: 10 }}>
            {g.label} · {g.items.length}
          </div>
          {g.items.map((m) => (
            <Card key={m.id} style={{ marginBottom: 8, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{m.label}</span>
                <span style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="disp" style={{ fontSize: 21, fontWeight: 400, color: C.ink, display: "block", lineHeight: 1.15 }}>
                    {m.reading ? m.reading.main : m.now}
                  </span>
                  {m.reading?.sub && (
                    <span className="mono" style={{ fontSize: 10.5, color: C.muted, display: "block", marginTop: 3 }}>
                      {m.reading.sub}
                    </span>
                  )}
                </span>
              </div>

              <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                {[[m.type === "weightreps" ? "total load vs last" : "vs last",
                   m.pct === null ? "—" : `${m.pct > 0 ? "+" : ""}${m.pct.toFixed(1)}%`],
                  ["since start", m.sinceStart === null ? "—" : `${m.sinceStart > 0 ? "+" : ""}${m.sinceStart.toFixed(0)}%`],
                  ["vs your best", m.outOf10 === null ? "—" : `${m.outOf10}/10`]].map(([l, v]) => (
                  <div key={l}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>{l}</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 600, marginTop: 3,
                      /* Colour by the VERDICT, not the raw percentage. A -5%
                         wobble in a rep count is inside the error floor and the
                         verdict says "holding" — painting it in the alarm colour
                         beside that sentence contradicted it (rule 24). */
                      color: l === "vs last" && m.pct !== null
                        ? (m.direction === "up" ? C.moss : m.direction === "down" ? C.clay : C.muted)
                        : C.ink }}>{v}</div>
                  </div>
                ))}
                {m.isBest && (
                  <div style={{ alignSelf: "flex-end" }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: C.ochre, background: C.pist, borderRadius: 20, padding: "4px 9px" }}>personal best</span>
                  </div>
                )}
              </div>

              {m.prevReading && (
                <div className="mono" style={{ fontSize: 10.5, color: C.muted, marginTop: 10 }}>
                  last time: {m.prevReading.main}{m.prevReading.sub ? ` · ${m.prevReading.sub}` : ""}
                </div>
              )}
              <div style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, marginTop: 14,
                paddingTop: 12, borderTop: `1px solid ${C.line}` }}>{m.why}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: C.signal, marginTop: 8, fontWeight: 500 }}>{m.next}</div>
            </Card>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 8 }}><Btn kind="quiet" onClick={close}>Back</Btn></div>
    </div>
  );
}

function Journal({ data, setData, coach, close }) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const entries = data.journal || [];
  const saveEntry = () => {
    const text = draft.trim();
    if (!text) return;
    setData((d) => ({ ...d, journal: [...(d.journal || []), { id: newId(), date: coach.t, text }] }));
    setDraft("");
  };
  const editEntry = (id, text) => setData((d) => ({
    ...d, journal: d.journal.map((e) => (e.id === id ? { ...e, text } : e)),
  }));
  const dropEntry = (id) => setData((d) => ({ ...d, journal: d.journal.filter((e) => e.id !== id) }));

  const days = Object.keys(data.logs || {}).sort().reverse().map((d) => {
    const l = data.logs[d];
    const items = [];
    if (l.type || l.sessionNote) items.push({ name: l.type || "Session", minutes: l.minutes, note: l.sessionNote });
    (l.extraSessions || []).forEach((x) => items.push({ name: x.type || "Untitled", minutes: x.minutes, note: x.note }));
    return { d, l, items };
  });

  const allDates = Array.from(new Set([
    ...days.map((x) => x.d),
    ...entries.map((e) => e.date),
  ])).sort().reverse();

  const rows = allDates.map((d) => {
    const found = days.find((x) => x.d === d) || { d, l: data.logs[d] || {}, items: [] };
    return { ...found, free: entries.filter((e) => e.date === d) };
  }).filter(({ items, l, free }) => free.length || items.some((i) => i.note) || l.did || l.notes);

  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter(({ d, l, items, free }) =>
    d.includes(q) || (l.did || "").toLowerCase().includes(q) || (l.notes || "").toLowerCase().includes(q) ||
    free.some((e) => e.text.toLowerCase().includes(q)) ||
    items.some((i) => (i.note || "").toLowerCase().includes(q) || (i.name || "").toLowerCase().includes(q))
  ) : rows;

  const total = rows.reduce((a, { items, l, free }) =>
    a + free.length + items.filter((i) => i.note).length + (l.did ? 1 : 0) + (l.notes ? 1 : 0), 0);

  return (
    <div>
      <Eyebrow color={C.ochre}>Journal</Eyebrow>
      <h1 className="disp" style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.15, margin: "0 0 6px" }}>
        Everything you've written
      </h1>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: C.muted, marginBottom: 16 }}>
        {total} entr{total === 1 ? "y" : "ies"} across {rows.length} day{rows.length === 1 ? "" : "s"}. Your coach reads these too.
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Eyebrow>Write something</Eyebrow>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder="Anything at all — how the week is going, what you noticed, what you want to change"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55, fontSize: 14.5, marginBottom: 10 }} />
          <MicButton onText={setDraft} current={draft} />
        </div>
        <Btn kind={draft.trim() ? "signal" : "quiet"} onClick={saveEntry}>Save to today</Btn>
      </Card>

      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your notes"
        style={{ ...inputStyle, marginBottom: 16 }} />

      {shown.length === 0 && (
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          {q ? "Nothing matches that." : "No notes yet. Write one under any session on the Today screen."}
        </div>
      )}

      {shown.map(({ d, l, items, free }) => (
        <Card key={d} style={{ marginBottom: 10, padding: 16 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
            {parse(d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </div>

          {free.map((e) => (
            <div key={e.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea rows={3} value={e.text} onChange={(ev) => editEntry(e.id, ev.target.value)}
                className="serif-it"
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55, fontSize: 15.5, marginBottom: 6,
                  background: "transparent", border: "none", borderLeft: `2px solid ${C.signal}`,
                  borderRadius: 0, padding: "0 0 0 12px" }} />
                <MicButton onText={(v) => editEntry(e.id, v)} current={e.text} />
              </div>
              <button onClick={() => dropEntry(e.id)} className="tap" style={{
                border: "none", background: "transparent", cursor: "pointer", padding: "2px 0 0 12px",
                fontSize: 10.5, color: C.muted,
              }}>delete</button>
            </div>
          ))}

          {items.map((i, k) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 4 }}>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{i.name}</span>
                {i.minutes && <span className="mono" style={{ fontSize: 10, color: C.muted }}>{i.minutes} min</span>}
              </div>
              {i.note && (
                <div className="serif-it" style={{ fontSize: 15, lineHeight: 1.5, color: C.ink,
                  paddingLeft: 12, borderLeft: `2px solid ${C.line}` }}>{i.note}</div>
              )}
            </div>
          ))}

          {l.did && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>what you did</span>
              <div style={{ marginTop: 3 }}>{l.did}</div>
            </div>
          )}
          {l.notes && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginTop: 10 }}>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>notes</span>
              <div style={{ marginTop: 3 }}>{l.notes}</div>
            </div>
          )}
        </Card>
      ))}

      <div style={{ marginTop: 20 }}><Btn kind="quiet" onClick={close}>Back</Btn></div>
    </div>
  );
}


/* ---- everything WHOOP has given you, in one place ---------------------- */
const WHOOP_FIELDS = [
  { k: "recovery",    label: "Recovery",          unit: "%",   group: "Recovery" },
  { k: "rhr",         label: "Resting heart rate", unit: "bpm", group: "Recovery" },
  { k: "hrv",         label: "Heart rate variability", unit: "ms", group: "Recovery" },
  { k: "respiratory", label: "Respiratory rate",  unit: "rpm", group: "Recovery" },
  { k: "spo2",        label: "Blood oxygen",      unit: "%",   group: "Recovery" },
  { k: "skinTemp",    label: "Skin temperature",  unit: "°C",  group: "Recovery" },

  { k: "strain",      label: "Day strain",        unit: "",    group: "Strain" },
  { k: "avgHr",       label: "Average heart rate", unit: "bpm", group: "Strain" },
  { k: "maxHr",       label: "Max heart rate",    unit: "bpm", group: "Strain" },
  { k: "calories",    label: "Energy burned",     unit: "cal", group: "Strain" },

  { k: "asleep",      label: "Asleep",            unit: "min", group: "Sleep" },
  { k: "inBed",       label: "In bed",            unit: "min", group: "Sleep" },
  { k: "sleepPerf",   label: "Sleep performance", unit: "%",   group: "Sleep" },
  { k: "sleepEff",    label: "Sleep efficiency",  unit: "%",   group: "Sleep" },
  { k: "sleepDebt",   label: "Sleep debt",        unit: "min", group: "Sleep" },
  { k: "deep",        label: "Deep sleep",        unit: "min", group: "Sleep" },
  { k: "rem",         label: "REM sleep",         unit: "min", group: "Sleep" },
  { k: "light",       label: "Light sleep",       unit: "min", group: "Sleep" },
  { k: "awake",       label: "Awake",             unit: "min", group: "Sleep" },
  { k: "cycles",      label: "Sleep cycles",      unit: "",    group: "Sleep" },
  { k: "disturbances", label: "Disturbances",     unit: "",    group: "Sleep" },
];

function WhoopLog({ data, setSheet, close }) {
  const morning = data.morning || {};
  const days = Object.keys(morning).sort().reverse();
  const [pick, setPick] = useState(null);

  const present = WHOOP_FIELDS.filter((f) => days.some((d) => morning[d]?.[f.k] !== undefined));
  const groups = ["Recovery", "Strain", "Sleep"];

  const stat = (k) => {
    const vals = days.map((d) => Number(morning[d]?.[k])).filter((v) => !isNaN(v));
    if (!vals.length) return null;
    const recent = vals.slice(0, 30);
    const sorted = [...recent].sort((a, b) => a - b);
    return {
      last: vals[0],
      median: sorted[Math.floor(sorted.length / 2)],
      low: Math.min(...recent), high: Math.max(...recent), n: vals.length,
    };
  };

  const sel = pick || (present[0]?.k ?? null);
  const selField = present.find((f) => f.k === sel);
  const series = days.slice(0, 60).reverse()
    .map((d) => ({ x: d.slice(5), v: Number(morning[d]?.[sel]) }))
    .filter((r) => !isNaN(r.v));

  return (
    <div>
      <Eyebrow color={C.ochre}>WHOOP</Eyebrow>
      <h1 className="disp" style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.1, margin: "0 0 6px" }}>
        Your body's log
      </h1>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted, marginBottom: 18 }}>
        {days.length
          ? `${days.length} days on file, ${present.length} measures. Everything WHOOP has sent across, kept here so it sits beside your training.`
          : "Nothing imported yet."}
      </div>

      {!days.length ? (
        <Card>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted, marginBottom: 14 }}>
            Import your WHOOP export and this fills with your recovery, heart rate, sleep and strain history.
          </div>
          <Btn kind="signal" onClick={() => setSheet({ kind: "whoop" })}>Import WHOOP data</Btn>
        </Card>
      ) : (
        <>
          {/* pick a measure and see it drawn */}
          <Card style={{ marginBottom: 12 }}>
            <Eyebrow>{selField?.label || "Pick a measure"}</Eyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
              {present.map((f) => (
                <button key={f.k} onClick={() => setPick(f.k)} className="tap" style={{
                  padding: "7px 11px", borderRadius: 999, cursor: "pointer", fontSize: 11.5, fontWeight: 500,
                  border: `1.5px solid ${sel === f.k ? C.signal : C.line}`,
                  background: sel === f.k ? C.signal : "transparent",
                  color: sel === f.k ? C.chalk : C.muted,
                }}>{f.label}</button>
              ))}
            </div>
            {series.length > 1 && (
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={series} style={chartBox} margin={{ top: 8, right: 4, bottom: 20, left: -14 }}>
                  <CartesianGrid stroke={C.line} vertical={false} />
                  <XAxis dataKey="x" {...axis} minTickGap={26} />
                  <YAxis {...axis} domain={["auto", "auto"]}
                    label={{ value: selField?.unit || "", angle: -90, position: "insideLeft", offset: 22,
                      style: { fontSize: 9.5, fill: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" } }} />
                  <Tooltip contentStyle={tip} />
                  <Line dataKey="v" name={selField?.label} stroke={C.signal} strokeWidth={2}
                    dot={false} activeDot={{ r: 5 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            {(() => {
              const st = stat(sel);
              if (!st) return null;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center",
                  borderTop: `1px solid ${C.line}`, paddingTop: 12, marginTop: 6 }}>
                  {[["Latest", st.last], ["Your normal", st.median], ["Range", `${st.low}–${st.high}`]].map(([l, v]) => (
                    <div key={l}>
                      <div className="mono disp" style={{ fontSize: 17, fontWeight: 600 }}>{v}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{l}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>

          {/* the whole table, day by day */}
          {groups.map((g) => {
            const fs = present.filter((f) => f.group === g);
            if (!fs.length) return null;
            return (
              <Fold key={g} title={g} note={fs.map((f) => f.label).join(" · ")}>
                <div style={{ overflowX: "auto", marginTop: 4 }}>
                  <table style={{ borderCollapse: "collapse", fontSize: 11.5, minWidth: "100%" }}>
                    <thead>
                      <tr>
                        <th className="mono" style={{ textAlign: "left", padding: "6px 10px 8px 0", color: C.muted,
                          fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", position: "sticky", left: 0, background: C.card }}>day</th>
                        {fs.map((f) => (
                          <th key={f.k} className="mono" style={{ textAlign: "right", padding: "6px 0 8px 14px",
                            color: C.muted, fontSize: 9.5, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                            {f.label}{f.unit ? ` (${f.unit})` : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {days.slice(0, 45).map((d) => (
                        <tr key={d} style={{ borderTop: `1px solid ${C.line}` }}>
                          <td className="mono" style={{ padding: "8px 10px 8px 0", whiteSpace: "nowrap",
                            position: "sticky", left: 0, background: C.card, color: C.muted }}>{d.slice(5)}</td>
                          {fs.map((f) => (
                            <td key={f.k} className="mono" style={{ textAlign: "right", padding: "8px 0 8px 14px", whiteSpace: "nowrap" }}>
                              {morning[d]?.[f.k] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {days.length > 45 && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
                    Showing the last 45 days. Everything else is in your export from Settings.
                  </div>
                )}
              </Fold>
            );
          })}

          <div style={{ marginTop: 12 }}>
            <Btn kind="ghost" onClick={() => setSheet({ kind: "whoop" })}>Import more WHOOP data</Btn>
          </div>
        </>
      )}

      <div style={{ marginTop: 20 }}><Btn kind="quiet" onClick={close}>Back</Btn></div>
    </div>
  );
}

function WhoopImport({ data, setData, close }) {
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [makeSessions, setMakeSessions] = useState(true);

  const [pasting, setPasting] = useState(false);
  const [pasteKind, setPasteKind] = useState("physiological_cycles");
  const [pasteText, setPasteText] = useState("");

  const handleText = (text, name) => {
    if (!text.trim()) return;
    handle([{ name: name + ".csv", text: async () => text }]);
    setPasteText("");
  };

  const handle = async (files) => {
    setBusy(true);
    const found = { morning: {}, logs: {}, days: new Set(), workouts: 0 };
    const seen = [], matched = [];
    try {
      for (const file of Array.from(files)) {
        const text = await file.text();
        const rows = parseCSV(text);
        const name = file.name.toLowerCase();
        const head = (text.split("\n")[0] || "").toLowerCase();
        seen.push(file.name);

        /* Name first, contents second. A file called "Untitled 2.csv" that
           contains a Recovery score column is still the cycles file. */
        const isCycles = name.includes("physiological") || name.includes("cycle")
          || (head.includes("recovery score") && head.includes("day strain"));
        const isSleep = name.includes("sleep")
          || (head.includes("asleep duration") && !head.includes("day strain"));
        const isWorkout = name.includes("workout")
          || (head.includes("activity name") && head.includes("workout start"));
        if (isCycles || isSleep || isWorkout) matched.push(file.name);

        if (isCycles) {
          rows.forEach((r) => {
            const d = wakeDay(r);
            if (!d) return;
            /* keep everything WHOOP gives, not just the five the coach uses */
            const m = {};
            const put = (k, v) => { if (v !== undefined && v !== "") m[k] = v; };
            put("recovery",   r["Recovery score %"]);
            put("rhr",        r["Resting heart rate (bpm)"]);
            put("hrv",        r["Heart rate variability (ms)"]);
            put("strain",     r["Day Strain"]);
            put("calories",   r["Energy burned (cal)"]);
            put("maxHr",      r["Max HR (bpm)"]);
            put("avgHr",      r["Average HR (bpm)"]);
            put("spo2",       r["Blood oxygen %"]);
            put("skinTemp",   r["Skin temp (celsius)"]);
            put("respiratory", r["Respiratory rate (rpm)"]);
            put("sleepPerf",  r["Sleep performance %"]);
            put("sleepEff",   r["Sleep efficiency %"]);
            put("sleepDebt",  r["Sleep debt (min)"]);
            put("inBed",      r["In bed duration (min)"]);
            /* the clock times themselves — sleep regularity needs when, not
               just how long. Stored as minutes past midnight. */
            const clockMin = (stamp) => {
              const hhmm = String(stamp || "").slice(11, 16);
              if (!/^\d\d:\d\d$/.test(hhmm)) return "";
              return String(Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)));
            };
            put("wakeAt", clockMin(r["Wake onset"]));
            put("bedAt",  clockMin(r["Sleep onset"] || r["Cycle start time"]));
            put("awake",      r["Awake duration (min)"]);
            put("light",      r["Light sleep duration (min)"]);
            put("deep",       r["Deep (SWS) duration (min)"]);
            put("rem",        r["REM duration (min)"]);
            put("cycles",     r["Sleep cycle count"]);
            put("disturbances", r["Disturbances"]);
            const asleep = r["Asleep duration (min)"];
            put("asleep", asleep);
            if (Object.keys(m).length) found.morning[d] = { ...(found.morning[d] || {}), ...m };

            const log = { ...(found.logs[d] || {}) };
            if (asleep) log.sleep = (Number(asleep) / 60).toFixed(1);
            if (m.strain) log.whoopStrain = m.strain;
            if (m.recovery) log.whoopRecovery = m.recovery;
            if (Object.keys(log).length) found.logs[d] = log;
            found.days.add(d);
          });
        }

        if (isSleep) {
          rows.forEach((r) => {
            const d = wakeDay(r);
            const asleep = r["Asleep duration (min)"];
            if (!d || !asleep || r["Nap"] === "true") return;
            found.logs[d] = { ...(found.logs[d] || {}), sleep: (Number(asleep) / 60).toFixed(1) };
            found.days.add(d);
          });
        }

        if (isWorkout) {
          const byDay = {};
          rows.forEach((r) => {
            const d = dayOf(r["Workout start time"]);
            if (!d) return;
            (byDay[d] = byDay[d] || []).push({
              name: r["Activity name"], min: Number(r["Duration (min)"]) || 0,
              strain: r["Activity Strain"], hr: r["Average HR (bpm)"],
              maxHr: r["Max HR (bpm)"], cal: r["Energy burned (cal)"],
              zone3: r["HR Zone 3 %"], zone4: r["HR Zone 4 %"], zone5: r["HR Zone 5 %"],
            });
            found.workouts++;
          });
          Object.entries(byDay).forEach(([d, list]) => {
            const main = [...list].sort((a, b) => b.min - a.min)[0];
            const total = list.reduce((a, b) => a + b.min, 0);
            found.logs[d] = {
              ...(found.logs[d] || {}),
              whoopWorkouts: list,
              _session: { type: main.name, minutes: String(total),
                did: list.map((w) => `${w.name} ${w.min} min`).join(", ") },
            };
            found.days.add(d);
          });
        }
      }

      setData((prev) => {
        const morning = { ...prev.morning };
        Object.entries(found.morning).forEach(([d, v]) => { morning[d] = { ...(morning[d] || {}), ...v }; });
        const logs = { ...prev.logs };
        Object.entries(found.logs).forEach(([d, v]) => {
          const { _session, ...rest } = v;
          logs[d] = { ...(logs[d] || {}), ...rest };
          if (_session && makeSessions && !logs[d]?.completed) {
            logs[d] = { ...logs[d], completed: true, ..._session };
          }
        });
        return { ...prev, morning, logs };
      });

      const fieldsSeen = new Set();
      Object.values(found.morning).forEach((v) => Object.keys(v).forEach((k) => fieldsSeen.add(k)));
      if (!found.days.size) {
        setReport({ error: seen.length
          ? `Read ${seen.length} file${seen.length > 1 ? "s" : ""} — ${seen.join(", ")} — but found no WHOOP data in ${matched.length ? "them" : "any of them"}. If you picked the .zip rather than the CSVs inside it, unzip it first and choose the files from the folder. Or use the paste route below, which always works.`
          : "No files came through. On iPhone that usually means the picker was cancelled, or the zip hasn't been unzipped yet." });
      } else {
        setReport({ days: found.days.size, workouts: found.workouts,
          fields: fieldsSeen.size, files: matched.length,
          recoveries: Object.values(found.morning).filter((m) => m.recovery).length });
      }
    } catch (e) {
      setReport({ error: `Couldn't read those files — ${e?.message || "unknown error"}. If they came from the zip without being unzipped, that's the usual cause. The paste route below works regardless.` });
    } finally { setBusy(false); }
  };

  return (
    <div>
      <Eyebrow color={C.ochre}>WHOOP</Eyebrow>
      <h1 className="disp" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, margin: "0 0 6px" }}>Import your export</h1>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted, marginBottom: 18 }}>
        Three steps, about five minutes, most of it waiting for the email. Everything in the
        export is kept — recovery, resting heart rate, HRV, respiratory rate, blood oxygen, skin
        temperature, strain, calories, average and max heart rate, and the full sleep breakdown.
      </div>

      <Card style={{ marginBottom: 12 }}>
        {[["1", "Ask WHOOP for your data",
           "Open the WHOOP app. Tap your profile picture, then Settings, then Account, then Data Export. Choose Create Export."],
          ["2", "Wait for the email, then unzip it",
           "WHOOP emails a .zip file, usually within a few minutes. Save it to your phone and open it — on iPhone, tap it in Files and it unzips into a folder of its own."],
          ["3", "Come back here and pick the files",
           "Tap the button below and select these three: physiological_cycles.csv, sleeps.csv and workouts.csv. You can select all three at once. Anything else in the folder is ignored."],
        ].map(([n, title, body]) => (
          <div key={n} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            <div className="mono" style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: 26, background: C.pist, color: C.signal,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
            }}>{n}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: C.muted }}>{body}</div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.muted, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
          <strong style={{ color: C.ink, fontWeight: 600 }}>What comes across:</strong> recovery score,
          resting heart rate, heart rate variability, sleep hours and day strain — filed under the morning
          each one describes, not the night before. Workouts come across as logged sessions if you leave
          that switched on below.
        </div>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <button onClick={() => setMakeSessions(!makeSessions)} className="tap" style={{
          width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 500,
          border: `1.5px solid ${makeSessions ? C.signal : C.line}`,
          background: makeSessions ? C.signal : "transparent", color: makeSessions ? C.chalk : C.muted,
        }}>{makeSessions ? "✓ " : ""}Also log the workouts as completed sessions</button>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.45 }}>
          Days you've already logged by hand are never overwritten.
        </div>
      </Card>

      {/* the browser's own control, shown rather than hidden — a hidden input
          triggered through a label doesn't reliably open the picker here */}
      <Card style={{ marginBottom: 10, background: C.pist }}>
        <Eyebrow color={C.signal}>Pick your files</Eyebrow>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, margin: "2px 0 12px" }}>
          Tap below, then choose all three CSVs from the unzipped WHOOP folder.
        </div>
        <input type="file" multiple
          onChange={(e) => handle(e.target.files)}
          style={{
            width: "100%", fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif",
            padding: "14px 12px", borderRadius: 12, background: C.card,
            border: `1.5px dashed ${C.signal}`, color: C.ink, cursor: "pointer",
          }} />
        {busy && (
          <div style={{ fontSize: 12.5, color: C.signal, marginTop: 10, fontWeight: 500 }}>Reading…</div>
        )}
      </Card>

      {/* the phone route. The old copy said phone browsers block this, which
          isn't true — the real culprit was a restrictive accept attribute
          greying the CSVs out in the iOS Files picker. */}
      <Card style={{ marginBottom: 12 }}>
        <Eyebrow>On your phone</Eyebrow>
        <div style={{ fontSize: 12.5, lineHeight: 1.65, color: C.muted }}>
          It does work on a phone, but the zip has to be unzipped first — you can't pick files
          out of a zip.
          <br /><br />
          <strong style={{ color: C.ink, fontWeight: 600 }}>On iPhone:</strong> save the emailed zip
          to Files. Tap it once and it expands into a folder beside it. Open that folder, then come
          back here, tap the picker, browse to the folder, tap <em>Select</em> top-right, choose the
          three CSVs, then <em>Open</em>.
          <br /><br />
          <strong style={{ color: C.ink, fontWeight: 600 }}>If the files look greyed out</strong>,
          they were being filtered by type — that's now fixed, but if it happens again use the paste
          route below, which never fails.
          <br /><br />
          <strong style={{ color: C.ink, fontWeight: 600 }}>Or do it once on a laptop</strong> and
          carry it over: Settings → Your data → Back up my data, copy, then paste into Restore on
          your phone.
        </div>
      </Card>

      <Card style={{ marginBottom: 12, background: C.mint }}>
        <Eyebrow color={C.moss}>How often</Eyebrow>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: C.ink }}>
          Once a week. Every export contains your whole history, so a weekly import loses nothing —
          it just backfills the days since the last one. Sunday, alongside your measurements, is the
          natural slot.
          <br /><br />
          <span style={{ color: C.muted }}>
            The only thing that wants to be current is this morning's recovery, and you already type
            that in by hand each day. Everything else here — the autonomic trends, sleep regularity,
            adaptation — is measured over weeks and months, so importing more often would give you
            nothing but more admin.
          </span>
        </div>
      </Card>

      {/* last resort: paste the file's text straight in */}
      <Card style={{ marginBottom: 16 }}>
        <button onClick={() => setPasting((v) => !v)} className="tap" style={{
          width: "100%", border: "none", background: "transparent", cursor: "pointer",
          textAlign: "left", padding: 0, fontSize: 13, fontWeight: 600, color: C.signal,
        }}>{pasting ? "Never mind" : "Paste a file instead — always works"}</button>
        {pasting && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>
              Open the CSV, select everything, copy, and paste it here. One file at a time.
              Tell me which file it is so it reads the right columns.
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[["physiological_cycles", "Cycles"], ["sleeps", "Sleeps"], ["workouts", "Workouts"]].map(([k, l]) => (
                <button key={k} onClick={() => setPasteKind(k)} className="tap" style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${pasteKind === k ? C.signal : C.line}`,
                  background: pasteKind === k ? C.signal : "transparent",
                  color: pasteKind === k ? C.chalk : C.muted,
                }}>{l}</button>
              ))}
            </div>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the whole file here, including the first line of column names"
              style={{ ...inputStyle, minHeight: 110, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }} />
            <Btn kind="signal" onClick={() => handleText(pasteText, pasteKind)}>Read this</Btn>
          </div>
        )}
      </Card>

      {report && (
        <Card style={{ marginBottom: 16 }}>
          {report.error ? (
            <div style={{ fontSize: 13, lineHeight: 1.5, color: C.clay }}>{report.error}</div>
          ) : (
            <>
              <Eyebrow>Imported</Eyebrow>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                {report.days} days · {report.fields} measures · {report.recoveries} recovery scores · {report.workouts} workouts
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.muted, marginTop: 8 }}>
                Have a look at Progress and Today — the recovery card should now be showing a number
                and telling you how hard to go.
              </div>
            </>
          )}
        </Card>
      )}

      <div style={{ marginTop: 8 }}><Btn kind="quiet" onClick={close}>Back</Btn></div>
    </div>
  );
}

function NotesArchive({ data, setData, coach, close }) {
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const entries = Object.entries(data.notes || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const shown = filter === "kept" ? entries.filter(([, n]) => n.kept) : entries;
  const keptCount = entries.filter(([, n]) => n.kept).length;
  const left = NOTES.length - (data.notesUsed || []).length;

  const toggle = (d) => setData((x) => ({
    ...x, notes: { ...x.notes, [d]: { ...x.notes[d], kept: !x.notes[d].kept } },
  }));

  /* when the pool runs low the coach starts writing them from where she is */
  const writeOne = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const text = await askModel({
        apiKey: data.settings?.apiKey,
        maxTokens: 200,
        messages: [{ role: "user", content:
`Write one short line of encouragement for Nermeen.

Rules, all of them firm:
- Never mention her age, her body, her shoulder, an injury, a limitation, or anything she is recovering from.
- Never make the day conditional on exercising. It must land just as well on a day she does nothing.
- Not about fitness. About her — capability, self-possession, taste, presence, pleasure, momentum.
- Warm, dignified, a little dry. No exclamation marks, no cheerleading, no therapy-speak, no clichés.
- One or two sentences. Return only the line, nothing else.

Avoid anything close to these: ${(Object.values(data.notes || {}).slice(-12).map((n) => n.text)).join(" / ")}` }],
      });
      if (text) setData((x) => ({
        ...x, notes: { ...x.notes, [coach.t]: { text, kept: false, source: "written" } },
      }));
    } catch (e) { /* pool note stays */ } finally { setBusy(false); }
  };

  return (
    <div>
      <Eyebrow color={C.ochre}>Kept words</Eyebrow>
      <h1 className="disp" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, margin: "0 0 6px" }}>
        {entries.length} note{entries.length === 1 ? "" : "s"} so far
      </h1>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: C.muted, marginBottom: 16 }}>
        One a day, never repeated. {left > 0 ? `${left} left in the collection before I start writing new ones.`
          : "The collection is spent — from here I write them for you."}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["all", `All ${entries.length}`], ["kept", `Starred ${keptCount}`]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className="tap" style={{
            flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
            border: `1.5px solid ${filter === k ? C.signal : C.line}`,
            background: filter === k ? C.signal : "transparent", color: filter === k ? C.chalk : C.muted,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <Btn kind="ghost" onClick={writeOne}>{busy ? "Writing…" : "Write me a new one for today"}</Btn>
      </div>

      {shown.length === 0 && (
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          {filter === "kept" ? "Nothing starred yet. Tap the star on a note you want to keep."
            : "Nothing here yet — your first note arrives on the Today screen."}
        </div>
      )}

      {shown.map(([d, n]) => (
        <Card key={d} style={{ marginBottom: 8, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: C.muted, marginBottom: 5 }}>
                {d}{n.source === "written" ? " · written for you" : ""}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.45 }}>{n.text}</div>
            </div>
            <button onClick={() => toggle(d)} className="tap" style={{
              border: "none", background: "transparent", cursor: "pointer", fontSize: 16, lineHeight: 1,
              color: n.kept ? C.ochre : C.line, padding: "2px 0",
            }}>{n.kept ? "★" : "☆"}</button>
          </div>
        </Card>
      ))}

      <div style={{ marginTop: 20 }}><Btn kind="quiet" onClick={close}>Back</Btn></div>
    </div>
  );
}

/* The whole standing agenda, grouped by the horizon it belongs to. This is
   the coach showing its working: what it is watching on the day, the week,
   the month and the year, all at once. */
/* One number, explained properly, with a way to argue with it. She has never
   used measures like these before, so the explanation is the point — the
   figure at the top is almost incidental. */
/* Typing is friction, and friction is why people stop. This uses the browser's
   own speech recognition where it exists; where it doesn't, the phone keyboard
   has a microphone key that does the same job into any text box. */
/* ---- WHY DICTATION NEEDS A MERGE RATHER THAN A CONCATENATION ----------
   Desktop Chrome hands back each new chunk of speech once: "I can't", then
   "live", then "without". Chrome on Android hands back the WHOLE phrase again
   every time it hears another word: "I can't", "I can't live", "I can't live
   without" — and marks each one final. Appending those gives exactly what she
   saw: "I can't I can't live I can't live without".

   So each incoming segment is merged rather than added. If it is a longer
   version of what we already have, it replaces it; if we already end with it,
   it is dropped; otherwise it is genuinely new and gets appended. That is
   correct on both kinds of browser, which matters because she uses one and
   this was written on the other. */
const mergeHeard = (soFar, next) => {
  const a = String(soFar || "").trim();
  const b = String(next || "").trim();
  if (!a) return b;
  if (!b) return a;
  const la = a.toLowerCase(), lb = b.toLowerCase();
  if (lb.startsWith(la)) return b;      /* the same phrase, grown */
  if (la.endsWith(lb)) return a;        /* already have these words */
  return a + " " + b;
};

function useDictation(onText) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [problem, setProblem] = useState(null);
  const recRef = useRef(null);
  /* The callback has to live in a ref. The effect below runs once, so binding
     onResult directly would permanently capture the FIRST version of onText —
     which is how dictation ends up writing to yesterday's log. */
  const cb = useRef(onText);
  useEffect(() => { cb.current = onText; });
  /* ---- WHY IT KEPT CUTTING OUT AFTER A SECOND -------------------------
     Chrome on Android ends the recognition session at the first pause,
     whatever `continuous` says. The old onend just switched the button off,
     so a sentence with a breath in it needed five taps.

     It restarts itself now, and keeps restarting until she taps stop. Two
     guards, because an auto-restart is exactly the kind of thing that spins:
     nothing restarts after a real error (a refused microphone, no network),
     and if the browser ends the session immediately several times in a row
     it gives up rather than thrashing. */
  const wants = useRef(false);          /* does she still intend to be talking */
  const shortEnds = useRef(0);          /* consecutive sessions that died instantly */
  const startedAt = useRef(0);

  useEffect(() => {
    const SR = typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setProblem("This browser has no dictation. Chrome on Android or Safari on iOS both do."); return; }
    /* Speech recognition needs a secure context. Opened from a file:// path it
       is silently unavailable, which is not obvious from the outside. */
    const secure = typeof window !== "undefined" &&
      (window.isSecureContext || location.protocol === "https:" || location.hostname === "localhost");
    if (!secure) { setProblem("Dictation needs the app served over https. Opened from a downloaded file it can't run — it will work once the app is installed properly."); return; }

    setSupported(true);
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-GB";
    r.onstart = () => { startedAt.current = Date.now(); setProblem(null); };
    r.onresult = (e) => {
      /* Rebuilt from the whole list every time, never accumulated between
         events — so a browser that repeats itself cannot double anything. */
      let out = "";
      for (let i = 0; i < e.results.length; i++) out = mergeHeard(out, e.results[i][0].transcript);
      cb.current(out);
    };
    r.onend = () => {
      if (!wants.current) { setListening(false); return; }
      const lasted = Date.now() - (startedAt.current || 0);
      shortEnds.current = lasted < 900 ? shortEnds.current + 1 : 0;
      if (shortEnds.current >= 4) {
        wants.current = false; setListening(false);
        setProblem("Dictation keeps stopping on its own. Type instead for now — the box beside the microphone takes typing.");
        return;
      }
      try { r.start(); } catch (err) { wants.current = false; setListening(false); }
    };
    r.onerror = (e) => {
      wants.current = false;
      shortEnds.current = 0;
      setListening(false);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed")
        setProblem("Microphone permission was refused. Allow it for this site in your browser settings.");
      /* no-speech fires on any silence and is not a failure — it used to
         stop her mid-thought and show a message. It just keeps listening. */
      else if (e?.error === "no-speech") { wants.current = true; setProblem(null); }
      else if (e?.error === "aborted") setProblem(null);
      else if (e?.error === "network") setProblem("Dictation needs a connection. It's the one part of the app that does.");
      else if (e?.error) setProblem(`Dictation stopped: ${e.error}`);
    };
    recRef.current = r;
    return () => { try { r.stop(); } catch (err) { /* already stopped */ } };
  }, []);

  const toggle = () => {
    const r = recRef.current;
    if (!r) return;
    if (listening) {
      wants.current = false;
      try { r.stop(); } catch (err) { /* already stopped */ }
      setListening(false);
    } else {
      wants.current = true;
      shortEnds.current = 0;
      try { r.start(); setListening(true); setProblem(null); }
      catch (err) { wants.current = false; setListening(false); }
    }
  };
  return { listening, supported, toggle, problem };
}

/* Backing up is one action with three fallbacks, and it belongs inside
   whichever card asked for it rather than three taps away in Settings
   (rule 11). Folder first if she has granted one, then the system share
   sheet - which is what actually reaches OneDrive and Drive on a phone -
   then a plain download. It says what happened either way. */
function BackupNowButton({ data, label = "Back up now" }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true); setMsg("");
    try {
      const dir = await dirLoad();
      if (dir) {
        const r = await writeToFolder(data);
        if (r === "ok") { setMsg(`Copy written into ${dir.name || "your folder"}.`); return; }
        if (r === "denied") { setMsg("The browser needs permission again - grant the folder once more in Settings."); return; }
      }
      if (canShareFiles()) {
        const r = await shareBackup(data);
        if (r === "ok") { setMsg("Sent. Choose OneDrive or Drive so it isn't only on this device."); return; }
        if (r === "cancelled") { setMsg(""); return; }
      }
      setMsg(downloadBackup(data)
        ? "Downloaded. Move it into OneDrive or Drive so it isn't only on this device."
        : "That didn't work - open Settings and use Show my data to copy it by hand.");
    } finally { setBusy(false); }
  };
  return (
    <div>
      <Btn kind="signal" onClick={busy ? () => {} : run}>{busy ? "Working…" : label}</Btn>
      {msg && (
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8, lineHeight: 1.45 }}>{msg}</div>
      )}
    </div>
  );
}

function MicButton({ onText, current }) {
  const base = useRef("");
  const [showWhy, setShowWhy] = useState(false);
  const { listening, supported, toggle, problem } = useDictation((heard) => {
    onText((base.current ? base.current + " " : "") + heard);
  });

  /* If dictation can't run, say so when tapped rather than silently vanishing.
     A missing button looks like a broken app. */
  if (!supported) {
    return (
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button onClick={() => setShowWhy((v) => !v)} className="tap" aria-label="Why no dictation"
          style={{
            width: 44, height: 44, borderRadius: 999, cursor: "pointer",
            border: `1.5px dashed ${C.line}`, background: "transparent", color: C.line,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, lineHeight: 1,
          }}>🎤</button>
        {showWhy && (
          <div style={{
            position: "absolute", right: 0, bottom: 50, width: 230, zIndex: 5,
            background: C.ink, color: "#fff", borderRadius: 11, padding: "11px 13px",
            fontSize: 11.5, lineHeight: 1.5,
          }}>{problem || "Dictation isn't available here."}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => { if (!listening) base.current = current || ""; toggle(); }}
        className="tap"
        aria-label={listening ? "Stop dictating" : "Dictate"}
        style={{
          width: 44, height: 44, borderRadius: 999, cursor: "pointer",
          border: `1.5px solid ${listening ? C.signal : C.line}`,
          background: listening ? C.signal : "transparent",
          color: listening ? "#fff" : C.muted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, lineHeight: 1,
        }}
      >
        {listening ? "■" : "🎤"}
      </button>
      {problem && !listening && (
        <div style={{
          position: "absolute", right: 0, bottom: 50, width: 230, zIndex: 5,
          background: C.ink, color: "#fff", borderRadius: 11, padding: "11px 13px",
          fontSize: 11.5, lineHeight: 1.5,
        }}>{problem}</div>
      )}
    </div>
  );
}

/* The whole programme, and every part of it editable. The coach wrote the
   first draft; she owns it from here. Tap any day to change what it is, drag
   phase lengths, move the start date. */

/* ============================================================================
   THE SMALLER DOOR, ON SCREEN
   ---------------------------------------------------------------------------
   Rule 4 as amended. One rung at a time, warmly, and never back up. Declining
   a rung moves DOWN — it does not re-ask, and it does not return to it later.
   The last rung costs a minute, so this card can always end in something.
   ==========================================================================*/
function LadderCard({ data, setData, coach }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(null);
  const rungs = coach.ladder || [];
  if (!rungs.length) return null;
  const rung = rungs[Math.min(idx, rungs.length - 1)];
  const last = idx >= rungs.length - 1;

  const take = () => {
    setData((d) => {
      const prev = d.logs?.[coach.t] || {};
      const entry = rung.kind === "trained"
        ? { ...prev, completed: true, type: rung.label.replace(/, the short version$/, ""),
            minutes: rung.mins, prescribed: prev.prescribed || coach.prescribed?.name || null }
        /* A moved day is deliberately weak: it keeps her out of the missed
           column and reaches nothing that measures training. */
        : { ...prev, state: "moved", movedWhat: rung.label, movedMins: rung.mins };
      return { ...d, logs: { ...d.logs, [coach.t]: entry } };
    });
    setDone(rung);
  };

  if (done) {
    return (
      <Card style={{ background: C.mint }}>
        <Eyebrow color={C.moss}>{done.kind === "trained" ? "Logged" : "That counts"}</Eyebrow>
        <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>
          {done.kind === "trained"
            ? `${done.label}. Down as a session.`
            : `${done.label}. Not a session, and not a day you missed either — which is the whole point.`}
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ background: C.pist }}>
      <Eyebrow color={C.signal}>Something smaller</Eyebrow>
      {coach.ladderWhy && (
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>{coach.ladderWhy}</div>
      )}
      <div className="disp" style={{ fontSize: 18, marginBottom: 3 }}>{rung.label}</div>
      <div className="mono" style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{rung.mins} min</div>
      <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5, marginBottom: 12 }}>{rung.line}</div>
      <Btn kind="signal" onClick={take}>Yes, that</Btn>
      {!last && (
        <div style={{ marginTop: 8 }}>
          <Btn kind="ghost" onClick={() => setIdx(idx + 1)}>Smaller</Btn>
        </div>
      )}
    </Card>
  );
}

/* ============================================================================
   WHY
   ---------------------------------------------------------------------------
   One tap, then the questions that belong to that answer, then her own words
   if she wants them. Every level can be left without answering, and leaving
   costs nothing. Curious, never an accounting (rule 24).
   ==========================================================================*/
function WhyCard({ data, setData, coach, setSheet }) {
  const due = coach.whyDue;
  const [reason, setReason] = useState(null);
  const [answers, setAnswers] = useState({});
  const [words, setWords] = useState("");
  const [shut, setShut] = useState(false);
  if (!due || shut) return null;

  const tree = whyTree(due.kind);
  const chosen = reason ? whyReason(due.kind, reason) : null;
  const follows = (chosen?.follow || []).filter((f) => !f.when || answers[Object.keys(answers)[0]] === f.when);
  const nextQ = follows.find((f) => answers[f.id] === undefined) || null;

  const save = (extra = {}) => {
    setData((d) => ({ ...d, logs: { ...d.logs,
      [due.date]: { ...(d.logs?.[due.date] || {}),
        why: { kind: due.kind, reason, answers, words: words.trim(), at: coach.t, ...extra } } } }));
    setShut(true);
  };

  const stop = (
    <button onClick={() => (reason ? save() : setShut(true))} className="tap" style={{
      border: "none", background: "transparent", cursor: "pointer", padding: "8px 0 0",
      fontSize: 12, color: C.muted }}>That's it for now</button>
  );

  const when = prettyShort ? prettyShort(due.date) : due.date;

  return (
    <Card>
      <Eyebrow>{due.kind === "swap" ? "You changed the plan" : "About that day"}</Eyebrow>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
        {due.kind === "swap"
          ? `On ${when} the plan said ${due.was} and you did ${due.did}. ${tree.ask}`
          : `${when} was a training day and nothing went down. ${tree.ask} No wrong answers, and you can skip this.`}
      </div>

      {!reason && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {tree.reasons.map((r) => (
            <button key={r.id} onClick={() => setReason(r.id)} className="tap" style={{
              padding: "9px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12.5,
              border: `1.5px solid ${C.line}`, background: "transparent", color: C.ink,
              fontFamily: "inherit" }}>{r.label}</button>
          ))}
        </div>
      )}

      {reason && nextQ && (
        <>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 7 }}>{nextQ.q}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(nextQ.library ? (data.library || []).map((w) => w.name) : nextQ.opts).map((o) => (
              <button key={o} onClick={() => setAnswers((a) => ({ ...a, [nextQ.id]: o }))} className="tap" style={{
                padding: "9px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12.5,
                border: `1.5px solid ${C.line}`, background: "transparent", color: C.ink,
                fontFamily: "inherit" }}>{o}</button>
            ))}
          </div>
        </>
      )}

      {reason && !nextQ && (
        <>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 7 }}>
            Anything else about it? Only if you want to.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea rows={2} value={words} onChange={(e) => setWords(e.target.value)}
              style={{ ...inputStyle, resize: "vertical", marginBottom: 0, fontSize: 13.5 }} />
            <MicButton onText={setWords} current={words} />
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn kind="signal" onClick={() => save()}>Done</Btn>
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn kind="ghost" onClick={() => { save(); setSheet({ kind: "chat", about: "that day",
              seed: `${whyLabel(due.kind, reason)}${words ? ` — ${words}` : ""}` }); }}>
              Talk to me about it
            </Btn>
          </div>
        </>
      )}

      {stop}
    </Card>
  );
}

/* ============================================================================
   WHAT THE COACH THINKS IT KNOWS
   ---------------------------------------------------------------------------
   Every belief it holds about her, its evidence, how sure it is, and a way to
   correct any line. This is the override that makes rule 32 safe: the coach
   acts without asking, and she can always see what it is acting on and change
   it. An entry she writes herself outranks anything inferred.
   ==========================================================================*/
function ProfileSheet({ data, setData, coach, setSheet }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const list = coach.profile || [];

  const correct = (p) => setData((d) => ({ ...d, profile: [...(d.profile || []).filter((x) => x.id !== p.id),
    { id: p.id, claim: p.claim, kind: p.kind, evidence: p.evidence || [], status: "retired",
      hers: true, corrected: coach.t }] }));

  const addOwn = () => {
    if (!text.trim()) return;
    setData((d) => ({ ...d, profile: [...(d.profile || []),
      { id: "p" + Math.random().toString(36).slice(2, 9), claim: text.trim(), kind: "preference",
        evidence: [{ date: coach.t, source: "said", quote: text.trim() }],
        status: "active", hers: true }] }));
    setText(""); setAdding(false);
  };

  const TONE = { believed: C.moss, tentative: C.ochre, noted: C.muted };

  return (
    <>
      <Eyebrow color={C.signal}>What I think I know about you</Eyebrow>
      <h2 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
        {list.length ? `${list.length} things, and where each came from` : "Nothing yet"}
      </h2>
      <p style={{ fontSize: 12.5, color: C.muted, margin: "0 0 18px", lineHeight: 1.5 }}>
        I act on the ones marked <strong>believed</strong>. Anything I have only seen once I note and leave alone.
        If I have got something wrong, say so here and I will stop — what you write outranks anything I worked out.
      </p>

      {!list.length && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>
            I have not earned an opinion yet. This fills in as you log, as you tell me why you
            changed something, and as we talk.
          </div>
        </Card>
      )}

      {["believed", "tentative", "noted"].map((level) => {
        const rows = list.filter((p) => p.confidence === level);
        if (!rows.length) return null;
        return (
          <Card key={level} style={{ marginBottom: 12 }}>
            <Eyebrow color={TONE[level]}>
              {level === "believed" ? "I act on these" : level === "tentative" ? "Probably, not sure yet" : "Noticed once"}
            </Eyebrow>
            {rows.map((p, i) => (
              <div key={p.id} style={{ padding: "11px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{p.claim}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>
                  {p.hers ? "You told me this." : `${(p.evidence || []).length} time${(p.evidence || []).length === 1 ? "" : "s"}, ${p.computed ? "from what you did" : "from what you said"}`}
                  {(p.evidence || []).length > 0 && !p.hers && ` · most recently ${(p.evidence || [])[0]?.date || "—"}`}
                </div>
                {!p.hers && (
                  <button onClick={() => correct(p)} className="tap" style={{
                    border: "none", background: "transparent", cursor: "pointer", padding: "6px 0 0",
                    fontSize: 11.5, color: C.signal }}>That's not right — stop using this</button>
                )}
              </div>
            ))}
          </Card>
        );
      })}

      <Card>
        <Eyebrow>Tell me something yourself</Eyebrow>
        {adding ? (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
              <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="I never want an early session on a Monday"
                style={{ ...inputStyle, resize: "vertical", marginBottom: 0, fontSize: 13.5 }} />
              <MicButton onText={setText} current={text} />
            </div>
            <Btn kind="signal" onClick={addOwn}>Add it</Btn>
            <div style={{ marginTop: 8 }}><Btn kind="quiet" onClick={() => setAdding(false)}>Never mind</Btn></div>
          </>
        ) : (
          <Btn kind="ghost" onClick={() => setAdding(true)}>Add something I should know</Btn>
        )}
      </Card>
    </>
  );
}

/* ============================================================================
   THE MOBILITY BATTERY, EDITABLE
   ---------------------------------------------------------------------------
   It used to be seven fixed tests written into the file, which made it the one
   thing she measured that she could not change. The strength battery has been
   hers from the start; this brings the other half into line.

   Add a test, delete one, rename it, change its unit, change whether it is
   scored on both sides, change which drills it points at, change whether a
   higher or lower number is better. Ids never change once created, so renaming
   a test keeps every reading it has ever had (rules 12, 13 and 20).
   ==========================================================================*/

/* ============================================================================
   NEEDS YOU
   ---------------------------------------------------------------------------
   One block, compact rows, one under another, in fixed priority order. A row
   exists only while it needs her, and the whole block disappears when nothing
   does — absent, not empty. There is no all-done badge to earn, because that
   is a scoreboard and rule 25 has views about scoreboards.

   This replaces eight separate cards, each of which printed its instruction in
   full whether or not she had ever read it. The instruction is not deleted —
   it moves behind the title. Tap the title, it opens in place; tap again, it
   closes. The small circled i is the only signal, and it appears only where an
   explanation exists (progressive disclosure, rule 11, rule 14).
   ==========================================================================*/
/* A self-contained circled i: tap it, the explanation appears underneath,
   tap again and it goes. Used wherever a card should carry no prose of its
   own — her instruction of 8 August: "if anything I want described or
   explained, I will click the info button." InfoTitle below is the
   controlled version, used by rows whose parent already tracks which one is
   open; this one is for anywhere else. */
function InfoNote({ children, why, small }) {
  const [open, setOpen] = useState(false);
  if (!why) return <span>{children}</span>;
  return (
    <span style={{ display: "block" }}>
      <button onClick={() => setOpen((v) => !v)} className="tap" aria-label="What this is"
        style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer",
          fontFamily: "inherit", textAlign: "left" }}>
        <span style={{ fontSize: small ? 11 : 13.5, fontWeight: small ? 400 : 600,
          color: open ? C.signal : (small ? C.muted : C.ink) }}>{children}</span>
        <span style={{ display: "inline-block", width: 13, height: 13, marginLeft: 6, verticalAlign: "1px",
          borderRadius: 999, border: `1px solid ${open ? C.signal : "#C9B8C4"}`,
          color: open ? C.signal : C.muted, fontSize: 8.5, lineHeight: "11px", textAlign: "center",
          fontFamily: "Georgia, serif", fontStyle: "italic" }}>i</span>
      </button>
      {open && (
        <span style={{ display: "block", fontSize: 12, lineHeight: 1.55, color: C.muted,
          background: C.chalk, borderRadius: 10, padding: "10px 12px", marginTop: 7 }}>{why}</span>
      )}
    </span>
  );
}

const InfoTitle = ({ children, why, open, onToggle }) => (
  <button onClick={why ? onToggle : undefined} className="tap" style={{
    border: "none", background: "transparent", padding: 0, textAlign: "left", flex: 1,
    cursor: why ? "pointer" : "default", fontFamily: "inherit",
  }}>
    <span style={{ fontSize: 13.5, fontWeight: 600, color: open ? C.signal : C.ink }}>{children}</span>
    {why && (
      <span style={{
        display: "inline-block", width: 13, height: 13, marginLeft: 6, verticalAlign: "1px",
        borderRadius: 999, border: `1px solid ${open ? C.signal : "#C9B8C4"}`,
        color: open ? C.signal : C.muted, fontSize: 8.5, lineHeight: "11px", textAlign: "center",
        fontFamily: "Georgia, serif", fontStyle: "italic",
      }}>i</span>
    )}
  </button>
);

function NeedsYou({ data, setData, coach, setSheet, write, log, openQuiet }) {
  const [open, setOpen] = useState(null);    /* the "why does this matter" text */
  const [doing, setDoing] = useState(null);  /* the control for answering it */
  const due = (coach.capture?.dueHere || coach.capture?.due || []);
  const failed = didStoreWriteFail();

  /* A row that has just been answered would otherwise vanish from under her
     hand mid-tap — worse, mid-sentence in the note box. So whichever row is
     open for answering stays on screen until she closes it, even once the
     answer has landed. */
  const active = doing ? (coach.capture?.rows || []).find((r) => r.id === doing) : null;
  const rows = active && !due.some((r) => r.id === doing) ? [...due, active] : due;
  if (!rows.length && !failed) return null;

  const toggle = (id) => setOpen(open === id ? null : id);
  const act = (id) => { setDoing(doing === id ? null : id); setOpen(null); };
  /* rowId rides along as the accessible label: four rows say "add it", and
     without it neither a screen reader nor a test can tell them apart. */
  const chip = (label, onClick, strong, rowId) => (
    <button key={rowId || label} onClick={onClick} className="tap"
      aria-label={rowId ? `${label} — ${rowId}` : label} style={{
      padding: "7px 11px", borderRadius: 8, cursor: "pointer", fontSize: 11.5, fontWeight: 600,
      border: `1.5px solid ${strong ? C.signal : C.line}`,
      background: strong ? C.signal : C.chalk, color: strong ? C.chalk : C.muted,
      fontFamily: "inherit", whiteSpace: "nowrap",
    }}>{label}</button>
  );

  /* the control that belongs to each row, actionable where it sits */
  const control = (r) => {
    switch (r.id) {
      case "rhythm":   return chip(doing === "rhythm" ? "close" : "set it", () => act("rhythm"), doing !== "rhythm", "rhythm");
      case "recovery": return (
        <input inputMode="numeric" placeholder="%" defaultValue=""
          onBlur={(e) => { const v = e.target.value.trim(); if (v) setData((d) => ({ ...d,
            morning: { ...d.morning, [coach.t]: { ...(d.morning?.[coach.t] || {}), recovery: v } } })); }}
          style={{ width: 62, padding: "7px 8px", borderRadius: 8, border: `1.5px solid ${C.line}`,
            background: C.chalk, fontSize: 13, textAlign: "center", fontFamily: "inherit" }} />
      );
      case "shoulderAM": return (
        <div style={{ display: "flex", gap: 3 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setData((d) => ({ ...d,
              morning: { ...d.morning, [coach.t]: { ...(d.morning?.[coach.t] || {}), shoulderAM: String(n) } } }))}
              className="tap mono" style={{ width: 24, height: 26, borderRadius: 6, cursor: "pointer",
                border: `1.5px solid ${C.line}`, background: C.chalk, color: C.muted, fontSize: 11 }}>{n}</button>
          ))}
        </div>
      );
      case "session":  return chip("mark done", () => write({ completed: true, type: coach.prescribed?.name || "Session", minutes: coach.prescribed?.minutes || 45 }), true, "session");
      /* rpe / sets / during / felt / note are no longer rows here at all —
         they belong to a session, and this list belongs to the day. See the
         filter below. */
      case "battery":  return chip("open", () => setSheet({ kind: "weekly" }), true, "battery");
      case "benchmark":return chip("open", () => setSheet({ kind: "monthly" }), true, "benchmark");
      case "whoop":    return chip("import", () => setSheet({ kind: "whoop" }), true, "whoop");
      case "mobility": return chip("open", () => setSheet({ kind: "mobility" }), true, "mobility");
      case "backup":   return <BackupNowButton data={data} label="back up" compact />;
      /* these two open the folded row below rather than a sheet, so she
         answers in the same place the record already lives */
      case "issue":    return chip("answer", () => openQuiet && openQuiet("record"), true, "issue");
      case "goal":     return chip("score it", () => openQuiet && openQuiet("goals"), true, "goal");
      default:         return null;
    }
  };

  /* ---- ANSWERING IT, WHERE IT IS ASKED --------------------------------
     Every one of these already existed somewhere else in the app. They were
     just not reachable from the row that asked for them, which is how five
     different questions ended up pointing at the same essay. */
  const inline = (r) => {
    switch (r.id) {
      case "rhythm": {
        const sc = scheduleOf(data.settings);
        const set = scheduleSet(data.settings);
        const now = set && sc.mode === "count" ? Number(sc.perWeek) : null;
        return (
          <div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>
              How many times a week do you want to train? You choose which days, and
              nothing counts as missed until the week runs out.
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button key={n} className="tap mono"
                  onClick={() => setData((d) => ({ ...d,
                    settings: { ...d.settings, schedule: { mode: "count", perWeek: n } } }))}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 9, cursor: "pointer",
                    fontSize: 12.5, fontWeight: now === n ? 700 : 500,
                    border: `1.5px solid ${now === n ? C.signal : C.line}`,
                    background: now === n ? C.signal : "transparent",
                    color: now === n ? "#fff" : C.muted }}>{n}</button>
              ))}
            </div>
            <button onClick={() => setSheet({ kind: "settings-rhythm" })} className="tap" style={{
              border: "none", background: "transparent", cursor: "pointer", padding: "10px 0 0",
              fontSize: 11.5, color: C.signal, fontWeight: 600, fontFamily: "inherit" }}>
              Or set fixed days, or on-off cycles →
            </button>
          </div>
        );
      }
      case "rpe":   return <RpeTap value={log?.rpe} onChange={(v) => write({ rpe: v })} />;
      case "sets":  return <SetsTap value={log?.sets} onChange={(v) => write({ sets: v })} />;
      case "during":return <DuringTap value={log?.during} onChange={(v) => write({ during: v })} />;
      case "felt":  return (
        <Scale label="How you felt afterwards" value={log?.energyAfter}
          onChange={(v) => write({ energyAfter: v })} max={5} lo="wiped" hi="great" />
      );
      case "note":  return (
        <Note label="A line about how it went" value={log?.sessionNote}
          onChange={(v) => write({ sessionNote: v })} />
      );
      default: return null;
    }
  };

  return (
    <Card style={{ background: C.pist }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <Eyebrow color={C.signal}>Needs you</Eyebrow>
        <span className="mono" style={{ fontSize: 9.5, color: C.muted }}>{due.length + (failed ? 1 : 0)}</span>
      </div>

      {/* the only one that jumps the queue: her last entry did not save */}
      {failed && (
        <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.clay }}>The last thing you entered did not save</div>
          <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45, margin: "3px 0 8px" }}>
            Nothing already saved is affected, but today is only on this screen.
          </div>
          <BackupNowButton data={data} label="Take a copy now" />
        </div>
      )}

      {rows.map((r, i) => (
        <div key={r.id} style={{ borderTop: i || failed ? `1px solid ${C.line}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
            <InfoTitle why={r.why} open={open === r.id} onToggle={() => toggle(r.id)}>{r.label}</InfoTitle>
            {control(r)}
          </div>
          {open === r.id && r.why && (
            <div style={{ background: C.card, borderRadius: 10, padding: "10px 12px", margin: "0 0 10px" }}>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{r.why}</div>
            </div>
          )}
          {doing === r.id && (
            <div style={{ background: C.card, borderRadius: 10, padding: "12px 13px", margin: "0 0 10px" }}>
              {inline(r)}
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

/* ============================================================================
   THIS MONTH, AND WHY IT LANDED THAT WAY
   ---------------------------------------------------------------------------
   Rule 8 says the design rules are visible in the app, never a black box, and
   rule 12 says the coach proposes and she disposes. So at the start of a block
   the landing page shows the month itself: the shape of the week, what the
   coach read to arrive at it, which rules fired, and a way to argue.

   It fades out of the way once the month is under way — it is loud in week one
   and a single quiet line after that, because a plan you have already read
   should not occupy the top of the page for four weeks.
   ==========================================================================*/
function MonthPlanCard({ data, setData, coach, setSheet }) {
  const [open, setOpen] = useState(false);
  const ph = coach.livePhase;
  if (!ph) return null;
  const firstWeek = (coach.weeksIntoBlock ?? 0) <= 1;
  const DOW = ["S", "M", "T", "W", "T", "F", "S"];

  /* In the calibration block there is no plan to draw, so the seven boxes show
     what she actually did — filling in as the week goes, blank ahead of today.
     A shape she made is worth looking at; a shape nobody chose is not. */
  const actual = coach.weekDays.map((d) => {
    const l = data.logs?.[d];
    if (l?.completed) {
      const cls = (coach.allClasses || []).find((w) => w.name === l.type);
      return { kind: cls?.goal || "done", label: (l.type || "done"), color: BLOCKS[cls?.goal]?.color || C.moss };
    }
    if (l?.state === "moved") return { kind: "moved", label: "moved", color: C.pist };
    return { kind: d > coach.t ? "ahead" : "none", label: "", color: null };
  });
  const week = coach.calibrating ? null : (ph.week || []);

  return (
    <Card style={{ background: firstWeek ? C.mint : C.card }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 }}>
        <Eyebrow color={firstWeek ? C.moss : C.muted}>
          {firstWeek ? "This month" : `Week ${(coach.weeksIntoBlock ?? 0) + 1} of ${ph.weeks}`}
        </Eyebrow>
        <span className="mono" style={{ fontSize: 9.5, color: C.muted }}>
          {coach.blockWeeksLeft > 0 ? `${coach.blockWeeksLeft} week${coach.blockWeeksLeft === 1 ? "" : "s"} left` : "last week"}
        </span>
      </div>

      <div className="disp" style={{ fontSize: firstWeek ? 20 : 16, marginBottom: 4 }}>{ph.name}</div>
      {ph.line && (
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink, marginBottom: 10 }}>{ph.line}</div>
      )}

      {/* the shape of the week: what she chose while calibrating, what the
          coach designed once it has something to design from */}
      {coach.calibrating && (
        <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
          color: C.muted, marginBottom: 5 }}>the week you have actually had</div>
      )}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {(week || actual).map((cell, i) => {
          if (!week) {
            const a = cell;
            const filled = a.kind !== "none" && a.kind !== "ahead";
            return (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 26, borderRadius: 7,
                  background: filled ? a.color : "transparent",
                  border: filled ? "none" : `1px dashed ${C.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mono" style={{ fontSize: 8, color: filled ? "#fff" : C.line }}>
                    {filled ? a.label.slice(0, 3).toLowerCase() : ""}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>{DOW[i]}</div>
              </div>
            );
          }
          const kind = cell;
          const b = BLOCKS[kind] || { label: kind, color: C.muted };
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 26, borderRadius: 7, background: kind === "rest" ? "transparent" : (b.color || C.pist),
                border: kind === "rest" ? `1px dashed ${C.line}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: 8, color: kind === "rest" ? C.muted : "#fff" }}>
                  {kind === "rest" ? "—" : (b.label || kind).slice(0, 3).toLowerCase()}
                </span>
              </div>
              <div className="mono" style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>{DOW[i]}</div>
            </div>
          );
        })}
      </div>

      <button onClick={() => setOpen(!open)} className="tap" style={{
        border: "none", background: "transparent", cursor: "pointer", padding: 0,
        fontSize: 11.5, color: C.signal, fontFamily: "inherit" }}>
        {open ? "Hide the reasoning" : "Why it landed this way"} {open ? "▴" : "▾"}
      </button>

      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
          {(ph.basis || []).length ? (ph.basis || []).map((b, i) => (
            <div key={i} style={{ fontSize: 12.5, lineHeight: 1.6, color: C.ink, marginBottom: 8 }}>{b}</div>
          )) : (
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: C.muted }}>
              This is the calibration month, so nothing was designed from your data yet — there wasn't any.
              Its whole job is to make sure nothing goes unlogged, so next month has something real to be built from.
            </div>
          )}

          {(ph.firedRules || []).length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
                Rules that fired
              </div>
              {(ph.firedRules || []).map((id) => {
                const rule = DESIGN_RULES.find((r) => r.id === id);
                if (!rule) return null;
                return (
                  <div key={id} style={{ marginBottom: 7 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>{rule.test}</div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>{rule.does} — {rule.why}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <Btn kind="ghost" onClick={() => setSheet({ kind: "chat", about: "this month's plan",
                seed: `About ${ph.name} — ` })}>Argue with it</Btn>
            </div>
            <div style={{ flex: 1 }}>
              <Btn kind="ghost" onClick={() => setSheet({ kind: "program" })}>Change it</Btn>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================================================================
   THE QUIET ROWS
   ---------------------------------------------------------------------------
   Four things sit on Today permanently and ask nothing of her: the record, her
   goals, body work, and the day's drills. They are invitations, not demands,
   and a full card each is three hundred words of standing furniture.

   So they collapse to a line and open where they sit. Nothing inside them
   changes — the same cards, one tap away. And the moment one of them HAS a
   demand (a record entry due its follow-up, a goal due its weekly score) it
   leaves this list and appears in Needs you instead. One rule, everywhere: it
   is in Needs you while it needs her, and a quiet row when it doesn't.
   ==========================================================================*/
function QuietRows({ rows, open, setOpen }) {
  const live = rows.filter((r) => r && r.node);
  if (!live.length) return null;
  return (
    <Card style={{ padding: "4px 16px" }}>
      {live.map((r, i) => (
        <div key={r.id} style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
          <button onClick={() => setOpen(open === r.id ? null : r.id)} className="tap" style={{
            width: "100%", border: "none", background: "transparent", cursor: "pointer",
            padding: "13px 0", display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, fontFamily: "inherit", textAlign: "left" }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: open === r.id ? C.signal : C.ink }}>
              {r.title}
              {r.count > 0 && (
                <span className="mono" style={{ fontSize: 10, color: C.muted, marginLeft: 7 }}>{r.count}</span>
              )}
            </span>
            <span style={{ fontSize: 15, color: C.muted, lineHeight: 1 }}>{open === r.id ? "−" : "+"}</span>
          </button>
          {open === r.id && <div style={{ margin: "0 -16px 10px" }}>{r.node}</div>}
        </div>
      ))}
    </Card>
  );
}
function MobilityEditor({ data, setData, coach, close }) {
  const [tab, setTab] = useState("tests");
  const [openId, setOpenId] = useState(null);
  const tests = data.mobTests?.length ? data.mobTests : coach.mobTests;
  const drills = data.drills?.length ? data.drills : coach.drills;

  const setTests = (fn) => setData((d) => ({ ...d, mobTests: fn(d.mobTests?.length ? d.mobTests : tests) }));
  const setDrills = (fn) => setData((d) => ({ ...d, drills: fn(d.drills?.length ? d.drills : drills) }));

  const patchTest = (id, props) => setTests((l) => l.map((m) => (m.id === id ? { ...m, ...props } : m)));
  const patchDrill = (id, props) => setDrills((l) => l.map((x) => (x.id === id ? { ...x, ...props } : x)));

  const addTest = () => {
    const m = { id: newId(), label: "New test", unit: "cm", better: "lower", side: false,
      how: "", why: "", needs: [], drills: [] };
    setTests((l) => [...l, m]); setOpenId(m.id);
  };
  const addDrill = () => {
    const x = { id: newId(), label: "New drill", mins: 2, how: "", targets: "" };
    setDrills((l) => [...l, x]); setOpenId(x.id);
  };

  /* Rule 20: a reading is never deleted with the test it belonged to. The
     history stays in `data.mobility` keyed by id, so putting the test back
     brings its numbers with it. */
  const removeTest = (id) => setTests((l) => l.filter((m) => m.id !== id));
  const removeDrill = (id) => setDrills((l) => l.filter((x) => x.id !== id));

  const row = (item, isTest) => (
    <div key={item.id} style={{ borderTop: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 6px" }}>
        <button onClick={() => setOpenId(openId === item.id ? null : item.id)} className="tap" style={{
          flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label || "Untitled"}</div>
          <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            {isTest
              ? `${item.unit || "—"} · ${item.better === "lower" ? "lower is better" : "higher is better"}${item.side ? " · left/right" : ""}`
              : `${item.mins} min${item.targets ? ` · ${item.targets}` : ""}`}
          </div>
        </button>
        <button onClick={() => (isTest ? removeTest(item.id) : removeDrill(item.id))} className="tap" style={{
          border: "none", background: "transparent", cursor: "pointer", color: C.clay, fontSize: 16, padding: "4px 6px" }}>×</button>
      </div>

      {openId === item.id && (
        <div style={{ padding: "0 6px 14px" }}>
          <Field label="Name" unit="" type="text" value={item.label}
            onChange={(v) => (isTest ? patchTest : patchDrill)(item.id, { label: v })} />

          {isTest ? (
            <>
              <Field label="Unit" unit="cm, /10, seconds…" type="text" value={item.unit || ""}
                onChange={(v) => patchTest(item.id, { unit: v })} />
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Which way is progress?</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[["higher", "Higher is better"], ["lower", "Lower is better"]].map(([v, l]) => (
                  <button key={v} onClick={() => patchTest(item.id, { better: v })} className="tap" style={{
                    flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
                    border: `1.5px solid ${item.better === v ? C.ink : C.line}`,
                    background: item.better === v ? C.ink : "transparent",
                    color: item.better === v ? C.chalk : C.muted }}>{l}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button onClick={() => patchTest(item.id, { side: !item.side })} className="tap" style={{
                  flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${item.side ? C.signal : C.line}`,
                  background: item.side ? C.signal : "transparent",
                  color: item.side ? C.chalk : C.muted }}>Scored left and right{item.side ? " ✓" : ""}</button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>How to do it</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                <textarea rows={3} value={item.how || ""} onChange={(e) => patchTest(item.id, { how: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical", marginBottom: 0, lineHeight: 1.45 }} />
                <MicButton onText={(v) => patchTest(item.id, { how: v })} current={item.how || ""} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Why it matters</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                <textarea rows={3} value={item.why || ""} onChange={(e) => patchTest(item.id, { why: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical", marginBottom: 0, lineHeight: 1.45 }} />
                <MicButton onText={(v) => patchTest(item.id, { why: v })} current={item.why || ""} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Drills this points at <span style={{ fontWeight: 400, color: C.muted }}>— a weak score sends you here</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {drills.map((dr) => {
                  const on = (item.drills || []).includes(dr.id);
                  return (
                    <button key={dr.id} onClick={() => patchTest(item.id, {
                      drills: on ? (item.drills || []).filter((x) => x !== dr.id) : [...(item.drills || []), dr.id],
                    })} className="tap" style={{
                      padding: "7px 10px", borderRadius: 999, cursor: "pointer", fontSize: 11.5,
                      border: `1.5px solid ${on ? C.signal : C.line}`,
                      background: on ? C.pist : "transparent", color: C.ink, fontFamily: "inherit" }}>{dr.label}</button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <Field label="Minutes" unit="" value={item.mins}
                onChange={(v) => patchDrill(item.id, { mins: Number(v) || 1 })} />
              <Field label="What it targets" unit="" type="text" value={item.targets || ""}
                onChange={(v) => patchDrill(item.id, { targets: v })} />
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>How to do it</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea rows={3} value={item.how || ""} onChange={(e) => patchDrill(item.id, { how: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical", marginBottom: 0, lineHeight: 1.45 }} />
                <MicButton onText={(v) => patchDrill(item.id, { how: v })} current={item.how || ""} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Eyebrow color={C.ochre}>Yours to change</Eyebrow>
      <h2 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
        The mobility battery
      </h2>
      <p style={{ fontSize: 12.5, color: C.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
        Add a test, drop one, rename it, change what it measures or which drills it sends you to.
        Nothing here is fixed. Every reading you have already taken stays where it is — a test you
        remove and put back brings its history with it.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["tests", `Tests (${tests.length})`], ["drills", `Drills (${drills.length})`]].map(([v, l]) => (
          <button key={v} onClick={() => { setTab(v); setOpenId(null); }} className="tap" style={{
            flex: 1, padding: "10px 0", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${tab === v ? C.ink : C.line}`,
            background: tab === v ? C.ink : "transparent", color: tab === v ? C.chalk : C.muted }}>{l}</button>
        ))}
      </div>

      <Card style={{ padding: 8, marginBottom: 12 }}>
        {(tab === "tests" ? tests : drills).map((item) => row(item, tab === "tests"))}
      </Card>

      <Btn kind="ghost" onClick={tab === "tests" ? addTest : addDrill}>
        {tab === "tests" ? "Add a test" : "Add a drill"}
      </Btn>
      <div style={{ marginTop: 10 }}>
        <Btn kind="quiet" onClick={close}>Done</Btn>
      </div>
    </>
  );
}
function ProgramView({ data, setData, coach, setSheet }) {
  const [editing, setEditing] = useState(null);   /* { phase, day } */
  const program = coach.program;

  const patch = (fn) => setData((prev) => {
    const next = JSON.parse(JSON.stringify(prev.program?.phases?.length ? prev.program : SEED_PROGRAM));
    fn(next);
    return { ...prev, program: next };
  });

  const setDay = (phaseIdx, dayIdx, blockId) =>
    patch((pr) => { pr.phases[phaseIdx].week[dayIdx] = blockId; });
  const setWeeks = (phaseIdx, delta) =>
    patch((pr) => { pr.phases[phaseIdx].weeks = Math.max(1, (Number(pr.phases[phaseIdx].weeks) || 1) + delta); });
  const setField = (phaseIdx, key, value) =>
    patch((pr) => { pr.phases[phaseIdx][key] = value; });

  /* DAYNAMES is module-level so the proposal card can use it too */
  const total = coach.programPhases.reduce((a, p) => a + (Number(p.weeks) || 1), 0);

  return (
    <div>
      <Eyebrow color={C.signal}>Your programme</Eyebrow>
      <h1 className="disp" style={{ fontSize: 27, fontWeight: 400, lineHeight: 1.1, margin: "2px 0 8px" }}>
        One block at a time
      </h1>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted, marginBottom: 18 }}>
        {coach.livePhase
          ? `You're in week ${coach.weeksIntoBlock} of ${coach.livePhase.weeks} — ${coach.livePhase.name}. `
          : ""}
        Every day has a kind of session attached; the coach picks the actual class on the morning from
        your recovery and what you did yesterday. At the end of each block it reads the month and
        designs the next one from what actually happened. Tap any day to change it — the coach follows
        whatever you set.
      </div>

      {coach.reviewDue && coach.proposal && (
        <Card style={{ marginBottom: 12, background: C.mint }}>
          <Eyebrow color={C.moss}>Block finished — here's the next one</Eyebrow>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.ink, marginBottom: 12 }}>
            <strong>{coach.blockReview.name}</strong> ran {coach.blockReview.weeks} weeks:
            {" "}{coach.blockReview.sessions} sessions, {coach.blockReview.consistency}% consistency,
            {" "}{coach.blockReview.realUp} measures genuinely up and {coach.blockReview.realDown} down.
            {coach.blockReview.setsMet !== undefined && ` ${coach.blockReview.setsMet} of 7 regions hit their sets.`}
          </div>

          <div style={{ padding: "13px 15px", background: C.card, borderRadius: 11, marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
              {coach.proposal.name}
            </div>
            {coach.proposal.basis.map((b, i) => (
              <div key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: C.muted, marginBottom: 6 }}>
                — {b}
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8, fontStyle: "italic" }}>
              {coach.proposal.read}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 10 }}>
              {coach.proposal.week.map((bid, i) => {
                const b = BLOCKS[bid] || BLOCKS.rest;
                return (
                  <div key={i} style={{ background: bid === "rest" ? "transparent" : C.chalk,
                    borderRadius: 8, padding: "7px 2px", textAlign: "center",
                    border: `1px ${bid === "rest" ? "dashed" : "solid"} ${C.line}` }}>
                    <div className="mono" style={{ fontSize: 8, color: C.muted }}>{DAYNAMES[i].slice(0, 1)}</div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, marginTop: 4,
                      color: bid === "rest" ? C.muted : b.color }}>
                      {bid === "rest" ? "rest" : b.label.split(" ")[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {["strong", "weak", "flags"].map((k) => {
            const items = coach.blockReview.evidence[k];
            if (!items.length) return null;
            const title = k === "strong" ? "What went well" : k === "weak" ? "What was thin" : "What to watch";
            const col = k === "strong" ? C.moss : k === "weak" ? C.ochre : C.clay;
            return (
              <div key={k} style={{ marginBottom: 10 }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: "0.11em", textTransform: "uppercase",
                  color: col, marginBottom: 5 }}>{title}</div>
                {items.map((it, i) => (
                  <div key={i} style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, paddingLeft: 10,
                    borderLeft: `2px solid ${col}`, marginBottom: 4 }}>{it.text}</div>
                ))}
              </div>
            );
          })}

          <Btn kind="signal" onClick={() => patch((pr) => {
            const live = pr.phases[pr.phases.length - 1];
            if (live) live.status = "done";
            pr.phases.push({ ...coach.proposal, status: "live" });
          })}>Start this block</Btn>
          <div style={{ marginTop: 8 }}>
            <Btn kind="quiet" onClick={() => setSheet({ kind: "chat", about: "my next block", seed:
              "Talk me through the block you're proposing — and what would change it?" })}>
              Talk it through first
            </Btn>
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginTop: 10 }}>
            Start it and every day of it stays editable, exactly like this one.
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 12, background: C.pist }}>
        <Eyebrow color={C.signal}>Away from your home gym?</Eyebrow>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: C.ink }}>
          Set the days you can't do to Pilates or Mobility &amp; balance and the coach stops asking for
          equipment you don't have. Change them back when you're home — the programme is a draft, not
          a contract.
        </div>
      </Card>

      {coach.programPhases.map((ph, pi) => {
        const live = coach.programPhase?.id === ph.id;
        return (
          <Card key={ph.id} style={{ marginBottom: 12, background: live ? C.mint : C.card }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <Eyebrow color={live ? C.moss : undefined}>Block {ph.month}</Eyebrow>
              <span className="mono" style={{ fontSize: 9.5, color: C.muted }}>
                {live ? `you are here · week ${coach.programWeek + 1}` : `weeks ${ph.from + 1}–${ph.to + 1}`}
              </span>
            </div>

            <input value={ph.name} onChange={(e) => setField(pi, "name", e.target.value)}
              style={{ ...inputStyle, marginBottom: 6, fontSize: 15, fontWeight: 600 }} />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
              <textarea rows={2} value={ph.line} onChange={(e) => setField(pi, "line", e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, fontSize: 12.5, resize: "none", lineHeight: 1.5 }} />
              <MicButton onText={(v) => setField(pi, "line", v)} current={ph.line || ""} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, color: C.muted }}>Length</span>
              <button onClick={() => setWeeks(pi, -1)} className="tap" style={stepBtn}>−</button>
              <span className="mono" style={{ fontSize: 13, minWidth: 58, textAlign: "center" }}>
                {ph.weeks} {Number(ph.weeks) === 1 ? "week" : "weeks"}
              </span>
              <button onClick={() => setWeeks(pi, 1)} className="tap" style={stepBtn}>+</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {ph.week.map((bid, di) => {
                const b = BLOCKS[bid] || BLOCKS.rest;
                const rest = bid === "rest";
                const open = editing && editing.phase === pi && editing.day === di;
                return (
                  <button key={di}
                    onClick={() => setEditing(open ? null : { phase: pi, day: di })}
                    className="tap" style={{
                      background: open ? C.signal : rest ? "transparent" : C.chalk,
                      borderRadius: 9, padding: "8px 2px", cursor: "pointer",
                      border: rest ? `1px dashed ${C.line}` : `1px solid ${C.line}`,
                    }}>
                    <div className="mono" style={{ fontSize: 8.5, marginBottom: 5,
                      color: open ? "#fff" : C.muted }}>{DAYNAMES[di].slice(0, 1)}</div>
                    <div style={{ fontSize: 9, lineHeight: 1.2, fontWeight: 600,
                      color: open ? "#fff" : rest ? C.muted : b.color }}>
                      {rest ? "rest" : b.label.split(" ")[0]}
                    </div>
                  </button>
                );
              })}
            </div>

            {editing && editing.phase === pi && (
              <div style={{ marginTop: 12, padding: "12px 13px", background: C.chalk, borderRadius: 11 }}>
                <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 9 }}>
                  {DAYNAMES[editing.day]} in {ph.name} — what should this day be?
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {Object.entries(BLOCKS).map(([bid, b]) => {
                    const on = ph.week[editing.day] === bid;
                    return (
                      <button key={bid} onClick={() => { setDay(pi, editing.day, bid); setEditing(null); }}
                        className="tap" style={{
                          padding: "9px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${on ? b.color : C.line}`,
                          background: on ? b.color : "transparent", color: on ? "#fff" : C.muted,
                        }}>{b.label}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <Card style={{ marginBottom: 12 }}>
        <Eyebrow>Start date</Eyebrow>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>
          Week 1 begins here. Move it and everything shifts with it.
        </div>
        <input type="date" value={program.start}
          onChange={(e) => patch((pr) => { pr.start = e.target.value; })}
          style={{ ...inputStyle, marginBottom: 0 }} />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Eyebrow>How the next block gets decided</Eyebrow>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.muted, marginBottom: 12 }}>
          At the end of each block the coach reads the month that just happened — your sessions, load,
          measurements and WHOOP — and applies these in order. Nothing beyond the block you're in is
          written in advance, because four weeks out is a guess.
        </div>
        {coach.DESIGN_RULES.map((r) => (
          <div key={r.id} style={{ padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: C.signal, marginBottom: 4 }}>
              IF {r.test.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>{r.does}</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: C.muted, marginTop: 3 }}>{r.why}</div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Eyebrow>What each kind of day means</Eyebrow>
        {Object.entries(BLOCKS).map(([id, b]) => (
          <div key={id} style={{ padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: b.color, marginBottom: 3 }}>{b.label}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.muted }}>{b.why}</div>
            {b.ids.length > 0 && (
              <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>
                {b.ids.map((x) => (coach.allClasses.find((w) => w.id === x)?.name || x)).join(" · ")}
              </div>
            )}
          </div>
        ))}
      </Card>

      <Card style={{ background: C.mint }}>
        <Eyebrow color={C.moss}>Two things worth knowing</Eyebrow>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: C.ink }}>
          Swimming and the recovery walk are add-ons, never the day's session — they appear under
          "add another session" when you want them.
          <br /><br />
          Mobility, flexibility and balance are one block rather than three, because split apart they
          each got too little to matter.
        </div>
        <div style={{ marginTop: 14 }}>
          <Btn kind="signal" onClick={() => setSheet({ kind: "chat", about: "my programme", seed:
            "Talk me through my training programme — and help me adjust it for the gym I'm actually in." })}>
            Ask your coach about the plan
          </Btn>
        </div>
      </Card>
    </div>
  );
}

function VitalDetail({ id, coach, setSheet }) {
  const v = coach.allMetrics.find((x) => x.id === id) || coach.allMetrics[0];
  const isBody = v.id === "coverage";
  return (
    <div>
      <Eyebrow color={C.signal}>{v.scope}</Eyebrow>
      <h1 className="disp" style={{ fontSize: 27, fontWeight: 400, lineHeight: 1.1, margin: "2px 0 14px" }}>
        {v.label}
      </h1>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div className="mono" style={{ fontSize: 40, fontWeight: 600, color: v.color, lineHeight: 1 }}>
            {v.display}
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>{v.sub}</div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`,
          fontSize: 13.5, lineHeight: 1.55, color: C.ink }}>
          {v.plain}
        </div>
      </Card>

      {v.how && (
        <Card style={{ marginBottom: 14 }}>
          <Eyebrow>How it's worked out</Eyebrow>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted }}>{v.how}</div>
        </Card>
      )}

      <Card style={{ marginBottom: 14 }}>
        <Eyebrow>What it means for you</Eyebrow>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: C.ink }}>{v.meaning}</div>
        {v.need && (
          <div style={{ marginTop: 12, padding: "11px 13px", background: C.pist, borderRadius: 10,
            fontSize: 12.5, lineHeight: 1.5, color: C.ink }}>
            {v.need}
          </div>
        )}
      </Card>

      {isBody && (
        <Card style={{ marginBottom: 14 }}>
          <Eyebrow>Every region, last 7 days</Eyebrow>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 14 }}>
            Share of the week's work each part of you took.
          </div>
          {coach.bodyRows.map((r) => (
            <div key={r.id} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: C.ink }}>{r.label}</span>
                <span className="mono" style={{ fontSize: 11,
                  color: r.state === "strong" ? C.moss : r.state === "ok" ? C.ink : C.ochre }}>
                  {r.share}%{r.sets ? ` · ${r.sets} sets` : ""}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: C.line, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, r.share * 3)}%`, borderRadius: 3,
                  background: r.state === "strong" ? C.moss : r.state === "ok" ? C.ochre : C.line }} />
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45, marginTop: 5 }}>{r.note}</div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <Eyebrow color={C.moss}>Not sure what to do with this?</Eyebrow>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink, marginBottom: 13 }}>
          Ask. Type it or hold the microphone and just say it — your coach has the number in front of it.
        </div>
        <Btn kind="signal" onClick={() => setSheet({ kind: "chat", about: v.label, seed:
          `Explain my ${v.label.toLowerCase()} to me — what does ${v.display} actually mean for what I should do next?` })}>
          Ask about {v.label.toLowerCase()}
        </Btn>
      </Card>
    </div>
  );
}

/* Every calculation, grouped by the horizon it belongs to. The five on the
   landing page are the headline; these are the rest, given the same treatment
   — a number, how it's worked out, and what it means for her. */
function VitalsAll({ coach, setSheet }) {
  const GROUPS = [
    ["day", "Every day", "Read on the morning, and they decide how today goes."],
    ["week", "Every week", "The horizon most coaching decisions actually live on."],
    ["month", "Every month", "Slow enough to be real. This is where change gets confirmed."],
    ["quarter", "Every quarter", "The shape of your training, visible only from a distance."],
    ["year", "Every year", "The timescale your body actually answers on."],
  ];
  return (
    <div>
      <Eyebrow color={C.signal}>Your numbers</Eyebrow>
      <h1 className="disp" style={{ fontSize: 27, fontWeight: 400, lineHeight: 1.1, margin: "2px 0 8px" }}>
        Everything being measured
      </h1>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.muted, marginBottom: 18 }}>
        {coach.allMetrics.length} calculations across five horizons. The five marked
        <span style={{ color: C.signal, fontWeight: 600 }}> ●</span> are the ones on your landing page.
        Tap any of them for what it means and a way to ask about it.
      </div>

      <Card style={{ marginBottom: 16, background: C.mint }}>
        <Eyebrow color={C.moss}>All of it together</Eyebrow>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: C.ink }}>{coach.reading}</div>
        <div style={{ marginTop: 14 }}>
          <Btn kind="signal" onClick={() => setSheet({ kind: "chat", about: "my numbers", seed:
            "Take all my numbers together — what do they say about my training, and what should I change?" })}>
            Ask your coach to read all of it
          </Btn>
        </div>
      </Card>

      {GROUPS.map(([g, title, blurb]) => {
        const items = coach.groupsOf(g);
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginBottom: 18 }}>
            <Eyebrow>{title}</Eyebrow>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, marginBottom: 10 }}>{blurb}</div>
            {items.map((v) => (
              <Card key={v.id} style={{ marginBottom: 8, padding: 16 }}>
                <button onClick={() => setSheet({ kind: "vital", id: v.id })} className="tap" style={{
                  width: "100%", border: "none", background: "transparent", cursor: "pointer",
                  textAlign: "left", padding: 0, display: "block" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>
                        {v.key && <span style={{ color: C.signal }}>● </span>}{v.label}
                      </div>
                      <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{v.scope}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontSize: 19, fontWeight: 600, color: v.color }}>{v.display}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{v.sub}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginTop: 9 }}>{v.plain}</div>
                </button>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Briefing({ coach, setSheet, close }) {
  const SECTIONS = [
    ["day", "Today", "What needs deciding in the next few hours."],
    ["week", "This week", "The seven days you're inside. Most coaching lives here."],
    ["month", "This month", "Slow enough to be real, fast enough to change."],
    ["quarter", "The last few months", "Where the shape of your training shows up."],
    ["year", "The long view", "The only timescale your body actually answers on."],
  ];
  return (
    <div>
      <Eyebrow color={C.signal}>Your coach</Eyebrow>
      <h1 className="disp" style={{ fontSize: 27, fontWeight: 400, lineHeight: 1.1, margin: "2px 0 8px" }}>
        Everything I'm watching
      </h1>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.muted, marginBottom: 20 }}>
        You don't have to ask for any of this. It's running whether you open the app or not — this page
        is just where it's all written down at once.
      </div>

      {SECTIONS.map(([scope, title, blurb]) => {
        const items = coach.byScope(scope);
        return (
          <Card key={scope} style={{ marginBottom: 12 }}>
            <Eyebrow>{title}</Eyebrow>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, marginBottom: items.length ? 12 : 0 }}>
              {blurb}
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                Nothing worth raising here right now. That's usually good news.
              </div>
            ) : items.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0",
                borderTop: i ? `1px solid ${C.line}` : "none" }}>
                <span style={{ width: 3, borderRadius: 2, alignSelf: "stretch",
                  background: a.tone === "firm" ? C.clay : a.tone === "warm" ? C.moss : C.signal }} />
                <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, color: C.ink }}>{a.text}</span>
              </div>
            ))}
          </Card>
        );
      })}

      <Btn kind="signal" onClick={() => setSheet({ kind: "chat" })}>Talk to your coach about any of it</Btn>
    </div>
  );
}

function CoachChat({ data, setData, coach, close, seed, about }) {
  const [msgs, setMsgs] = useState(data.chat || []);
  const sessionId = useRef(newId());
  const [draft, setDraft] = useState(seed || "");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const context = () => {
    const recent = coach.weekDays.map((d) => {
      const l = data.logs[d];
      if (!l) return null;
      const more = (l.extraSessions || []).map((x) => `${x.type} ${x.minutes}min${x.note ? ` [note: ${x.note}]` : ""}`).join(" + ");
      const extras = ((l.extras || []).length ? " + " + l.extras.join(", ") : "") + (more ? " + " + more : "");
      const did = l.did ? ` — she wrote: "${l.did}"` : "";
      const sn = l.sessionNote ? ` [note on the main session: ${l.sessionNote}]` : "";
      return `${d}: ${l.completed ? (l.type || "session") + (l.minutes ? " " + l.minutes + "min" : "") + extras : "rest"}${l.shoulder ? ", shoulder comfort " + l.shoulder + "/5" : ""}${sn}${did}`;
    }).filter(Boolean).join("; ") || "nothing logged this week yet";

    const lastBattery = data.weekly[Object.keys(data.weekly).sort().pop()] || null;
    const battery = lastBattery
      ? data.fields.weekly.filter((f) => lastBattery[f.id]).map((f) => `${f.label} ${lastBattery[f.id]}${f.unit ? " " + f.unit : ""}`).join(", ")
      : "no battery logged yet";

    const mKeys = Object.keys(data.monthly || {}).sort();
    const lastMonthly = mKeys.length ? data.monthly[mKeys[mKeys.length - 1]] : null;
    const monthlyLine = lastMonthly
      ? (data.fields.monthly || []).filter((f) => lastMonthly[f.id])
          .map((f) => `${f.label} ${lastMonthly[f.id]}${f.unit ? " " + f.unit : ""}`).join(", ")
      : "no monthly benchmark logged yet";

    return `You are Nermeen's personal fitness coach inside her own app. She is 51, rebuilding after a
sedentary stretch. Her right shoulder hurts when she adds load — volume is fine, load is the ceiling —
and it is rehabilitating, so that constraint is expected to retire. She trains on a two-on one-off cycle
and follows filmed classes plus a real Pilates instructor who pushes her hard.

Do not quote baseline figures from memory — every number you have is in the list below, computed from
her own data. If a number is not there, say you don't have it rather than estimating.

Where she is right now:
- Phase: ${coach.phase.name} — ${coach.phase.line}
- Week ${coach.pos.week}, month ${coach.pos.month}. Theme: ${coach.themes.week}
- This week: ${coach.weekDone} of ${coach.seasonTarget} sessions. Consistency ${coach.consistency}% of the last 28 days.
- This week's call: ${coach.verdict.label} — ${coach.verdict.line}
- Class the app prescribed for today: ${coach.prescribed ? `${coach.prescribed.name}, ${coach.prescribed.minutes} min — because ${coach.prescribed.reason}` : "none"}
- Today's finisher: ${coach.bet ? coach.bet.text : "none"} (she has made ${coach.betsWon} of ${coach.betsTaken} answered)
- Recovery today: ${coach.recValue || "not entered"}${coach.recovery ? " (" + coach.recovery.label + ")" : ""}
- Shoulder progression frozen: ${coach.shoulderFrozen ? "yes" : "no"}
- THE PROGRAMME (you set the kind of day; you pick the class within it):
  Block "${coach.livePhase?.name || "none"}", week ${coach.weeksIntoBlock} of ${coach.livePhase?.weeks || "?"}${coach.blockWeeksLeft <= 0 ? " — THIS BLOCK IS FINISHED, the next one is drawn up and waiting for her" : `, ${coach.blockWeeksLeft} week(s) left`}.
  Its intent: ${coach.livePhase?.line || "n/a"}
  Today is a ${coach.block?.label || "unscheduled"} day. ${coach.block?.why || ""}
  The week's shape: ${(coach.livePhase?.week || []).map((b, i) => `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]} ${b}`).join(", ")}
  She can change any of this and you follow it.
${coach.calibrating ? `- THIS IS THE CALIBRATION BLOCK. You are NOT designing training yet — there is no month of her data to design from. Your job is to make sure nothing goes unlogged and to explain why each input matters. Today's logging is ${coach.capture.pct}% complete${coach.capture.due.length ? `; still open: ${coach.capture.due.map((r) => r.label).join(", ")}` : ""}.` : ""}
- What you are already raising with her unprompted (do not contradict these, build on them):
${(coach.agenda || []).slice(0, 8).map((a) => `  * [${a.scope}] ${a.text}`).join("\n") || "  nothing today"}
- WHAT THE APP HAS LEARNED ABOUT HER (computed from 12 weeks of what actually happened — use this to
  tailor how you approach her, not just what you prescribe):
  Baseline completion of scheduled days: ${coach.learned.base ?? "—"}%
${coach.learned.motivators?.length ? coach.learned.motivators.map((x) => `  * MOVES HER: ${x}`).join("\n") : "  * nothing identified yet"}
${coach.learned.brakes?.length ? coach.learned.brakes.map((x) => `  * SLOWS HER: ${x}`).join("\n") : ""}
${coach.learned.goodWords?.length ? `  * words she uses when a session went well: ${coach.learned.goodWords.join(", ")}` : ""}
${coach.learned.hardWords?.length ? `  * words she uses when it was hard: ${coach.learned.hardWords.join(", ")}` : ""}
- MEASURED PATTERNS IN HOW SHE TRAINS:
${coach.swaps ? `  * Keeps your prescribed class ${coach.swaps.pct}% of the time${coach.swaps.avoided ? `; swaps out of ${coach.swaps.avoided[0]} most${coach.swaps.chosen ? `, usually for ${coach.swaps.chosen[0]}` : ""}` : ""}` : "  * prescription adherence: not enough data"}
${coach.writing ? `  * Writing volume: ${coach.writing.now} entries this fortnight vs ${coach.writing.before} before (${coach.writing.drop > 0 ? "+" : ""}${coach.writing.drop}%)${coach.writing.drop <= -40 ? " — EARLY WARNING, ask how she is" : ""}` : ""}
${coach.restarts ? `  * Runs of sessions: ${coach.restarts.runs} so far, longest ${coach.restarts.longest}, averaging ${coach.restarts.lateAvg} lately vs ${coach.restarts.earlyAvg} early on${coach.restarts.improving ? " — improving" : ""}` : ""}
${coach.byDuration ? `  * Session length she actually completes: ${coach.byDuration.favourite.k} (${coach.byDuration.favourite.share}%)` : ""}
${coach.blockCurve ? `  * Dips in week ${coach.blockCurve.worst.week} of a block (${coach.blockCurve.worst.pct}% vs ${coach.blockCurve.best.pct}% best)` : ""}
${coach.domsLag ? `  * Hard sessions cost her most on day ${coach.domsLag.worst} after` : ""}
${coach.costByClass ? `  * Real recovery cost by class: ${coach.costByClass.slice(0, 3).map((c) => `${c.name} ${c.delta}`).join(", ")}` : ""}
${coach.byTimeOfDay ? `  * Trains mostly in the ${coach.byTimeOfDay.best.slot} (${coach.byTimeOfDay.best.share}%)` : ""}
${coach.extraDays ? `  * Adds extra work most often on ${coach.extraDays.day}` : ""}
- PATTERNS IN WHAT SHE HAS WRITTEN, over all her text (chats, record, notes, journal), computed not guessed:
${coach.voicePatterns.length ? coach.voicePatterns.map((v) => `  * ${v.text}`).join("\n") : `  none yet — ${coach.voice.length} dated entries so far`}
  Use these to anticipate rather than react. If she is entering a stretch that has been hard before,
  say so plainly and help her plan for it rather than waiting for it to happen.
- WHAT YOU HAVE TALKED ABOUT BEFORE (most recent conversations — read these so she never has to repeat
  herself, and so you can pick up threads she left open):
${(data.chats || []).slice(-6).map((c) => `  * ${c.date} — ${c.about}: ${c.messages.slice(0, 6).map((m) => `${m.role === "user" ? "SHE" : "YOU"}: ${(m.text || "").slice(0, 200)}`).join(" | ")}`).join("\n") || "  no previous conversations"}
- THE RECORD — everything she has told you that isn't a number. READ THIS BEFORE ANSWERING ANYTHING
  about how she feels, a pain, a tightness, or a question she has asked before. Never answer from
  scratch if it is already in here — refer back to it by date, say what she tried, and say whether it
  worked. She is relying on you to remember so she doesn't have to.
${coach.openIssues.length ? coach.openIssues.map((i) => {
  const h = coach.historyFor(i);
  return `  * OPEN, logged ${i.date}: "${i.text}"${h.occurrences >= 2 ? ` — occurrence ${h.occurrences}${h.gapDays ? `, previous one ${h.gapDays} days earlier` : ""}` : ""}${(i.tried || []).length ? `. Tried: ${(i.tried || []).map((tr) => `${tr.what} (${["no help","barely","some help","helped","resolved it"][Number(tr.helped) - 1] || "?"}) on ${tr.date}`).join("; ")}` : ". Nothing tried yet"}${h.suspects.length ? `. Sessions appearing before more than one occurrence: ${h.suspects.map((sp) => `${sp.type} x${sp.n}`).join(", ")}` : ""}`;
}).join("\n") : "  nothing open"}
${coach.issues.filter((i) => i.status === "closed").slice(-6).map((i) => `  * closed, ${i.date}: "${i.text}"${(i.tried || []).filter((tr) => Number(tr.helped) >= 4).length ? ` — resolved by ${(i.tried || []).filter((tr) => Number(tr.helped) >= 4).map((tr) => tr.what).join(", ")}` : ""}`).join("\n")}
  If she raises something new, work out what it needs, tell her plainly what to try, and say that you
  have written it down and will ask her about it in a couple of days. If it matches something in the
  record, say so with the date and what worked before.
- WHAT SHE WANTS TO BE ABLE TO DO (her own goals — these outrank what the numbers would prefer):
${coach.openGoals.length ? coach.openGoals.map((g) => `  * "${g.text}"${(g.scores || []).length ? ` — last scored ${g.scores.slice(-1)[0].value}/10${g.scores.length > 1 ? `, started at ${g.scores[0].value}` : ""}${g.scores.slice(-1)[0].note ? `. She said: "${g.scores.slice(-1)[0].note}"` : ""}` : " — not scored yet"}`).join("\n") : "  none set"}
  If she describes something she cannot do, work out what it actually requires — which joints, which
  ranges, which regions — explain it plainly, and tell her it is worth adding to this list so it
  reaches the monthly design instead of being said once and lost.
- MOBILITY TESTS: ${coach.mobScore === null ? "not taken yet" : `overall ${coach.mobScore}%`}
${coach.mobScored.length ? coach.mobScored.map((r) => `  * ${r.label}: ${r.now}${r.unit}${r.gapPct !== null ? ` (L/R ${r.gapPct}% apart)` : ""}${r.moved !== null ? `, ${r.better ? "better" : "worse"} than last week` : ""}`).join("\n") : ""}
- TODAY'S TEN MINUTES: ${coach.dailyDrills.list.length ? coach.dailyDrills.list.map((d) => d.label).join(", ") : "nothing prescribed"}
- HOW SHE SAYS SHE IS TODAY: ${coach.moodToday ? `she tapped "${coach.moodToday}"${coach.moodToday !== "good" ? " — this outranks everything below. Start with how she is, not with training. Do not open with a number or a plan." : ""}` : "not said"}
- ADHERENCE STATE (this outranks any training consideration — the goal is that she is still training in a year):
  Lapse state: ${coach.lapseState}${coach.daysSinceSession !== null ? `, ${coach.daysSinceSession} days since her last session` : ""}. Weeks training: ${coach.weeksTraining}.
  Habit strength ${coach.habitStrength ?? "—"}%, same-days consistency ${coach.cueConsistency ?? "—"}%, ${coach.barrierWins} sessions completed despite a barrier in 28 days.
  How training FEELS during sessions: ${coach.affectMean ?? "not yet rated"}; how she feels afterwards: ${coach.afterMean ?? "not rated"}${coach.affectByClass?.length ? ` (best: ${coach.affectByClass[0].name})` : ""}.
  If she has been away, respond with self-compassion and one easy re-entry — never guilt, never catch-up plans, never an accounting of what was missed. The evidence is unambiguous that shame after a lapse predicts dropout and self-kindness predicts return.
- Sets by body region this week (target 6+ each): ${coach.bodyRows.map((r) => `${r.label} ${r.sets}`).join(", ")}
- Last monthly benchmark: ${monthlyLine}
- EVERY CALCULATION THE APP RUNS. Explain any of these in plain English on request, never in
  jargon, and always tie it back to HER training and what she should do next. Read them together
  rather than one at a time — the interesting answers come from combining three or four of them.
${coach.allMetrics.map((v) => `  * [${v.group}]${v.key ? "(headline)" : ""} ${v.label} (${v.scope}): ${v.display} — ${v.sub}. ${v.plain} HOW: ${v.how || "n/a"}${v.need ? ` NOT YET AVAILABLE: ${v.need}` : ""}`).join("\n")}
- Read across all five: ${coach.reading}
- Load by body region this week (share of total work): ${coach.bodyRows.map((r) => `${r.label} ${r.share}%`).join(", ")}
- BODY WORK she books herself (never prescribed by you, but it changes what the next session can be):
${coach.bodywork.count28 ? `  ${coach.bodywork.count28} sessions in 28 days. ${coach.bodywork.reactive ? `RECENT: ${coach.bodywork.reactive.label} — tissue still settling, keep today light.` : ""}${coach.bodywork.support ? `RECENT: ${coach.bodywork.support.label} — she should tolerate more today.` : ""}${coach.bodywork.guided ? `RECENT: physiotherapy — their loading plan outranks yours.` : ""}` : "  none logged"}
${about ? `- She tapped "${about}" and came here to ask about it. Answer that first.` : ""}
- Recent days: ${recent}
- Last battery: ${battery}
- Improving right now: ${(coach.improving || []).map((m) => `${m.label} ${m.pct > 0 ? "+" : ""}${(m.pct || 0).toFixed(0)}%`).join(", ") || "nothing yet"}
- Declining right now: ${(coach.declining || []).map((m) => `${m.label} ${(m.pct || 0).toFixed(0)}%`).join(", ") || "nothing"}
- Overall standing against her own bests: ${coach.overall ?? "not enough data"}/10
- Recent journal entries: ${(data.journal || []).slice(-6).map((e) => `${e.date}: ${e.text}`).join(" | ") || "none yet"}
- Class notes she has written: ${(data.library || []).filter((w) => w.felt).map((w) => `${w.name}: ${w.felt}`).join(" | ") || "none yet"}
- Loads she has recorded: ${(data.library || []).filter((w) => w.resistance).map((w) => `${w.name}: ${w.resistance}`).join(" | ") || "none yet"}
- WHAT SHE ACTUALLY LIFTED, most recent first (this is the real record; the line above is only what the class usually calls for): ${(() => {
    const out = [];
    Object.keys(data.logs || {}).sort().reverse().forEach((d) => {
      const l = data.logs[d];
      if (l?.loads) out.push(`${d} ${l.type || "session"}: ${l.loads}`);
      (l?.extraSessions || []).forEach((x) => { if (x.loads) out.push(`${d} ${x.type || "session"}: ${x.loads}`); });
    });
    return out.slice(0, 12).join(" | ") || "nothing recorded yet";
  })()}

HOW TO TALK TO HER — this matters more than any number above.

She is warm, emotional, and she believes in energy and feeling. She does not respond to cold analysis
or to being managed, and she will disengage from anything that feels like being told off. Be kind
first. Be a person, not a dashboard.

When she arrives frustrated, flat, low, or saying she cannot face it:
- Do NOT lead with training. Do not open with a number, a plan, or a reason she should exercise.
- Start with the feeling. Name it back to her accurately and without minimising it. Let her be heard
  before anything else happens. "That sounds genuinely heavy" beats "let's see what we can do."
- Ask rather than assert. One open question — what is underneath it, how long it has been there,
  what today actually feels like — then listen to the answer instead of steering.
- Normalise it. Most people who train for years have exactly these mornings. Feeling like this is
  not evidence of a character problem and not evidence that this will not work.
- Only once she has been properly heard, and only if it seems welcome, offer the smallest possible
  next step — genuinely small. Ten minutes. A walk. Getting changed and seeing how it feels. Or
  nothing at all today, said warmly and meant, because a rest day chosen on purpose is not a failure
  and treating it as one is how people quit.
- Never bargain, guilt, or invoke what she will lose. Never mention consistency or what the numbers
  will do. That pressure is exactly what turns a bad morning into a bad month.

Take mood and energy as real data rather than an obstacle to route around. If she is low, the
training question is genuinely secondary. Movement often helps mood and you may say so gently once,
never as a lever for compliance and never twice.

You are not a therapist and should not pretend to be one. You can listen well, reflect what you hear,
and help her think. If what she describes sounds like real depression, sustained hopelessness, or
something beyond a hard week, say so with care and suggest she speak to someone qualified — warmly,
without alarm, and without withdrawing from the conversation.

She is intelligent and dislikes being handled. Never prescribe written exercise routines for daily
training; she follows filmed classes. The rep-and-kilo prescriptions belong to the weekly test
battery only. Protect the shoulder: quality and range before load. She usually finishes a Pilates
class and adds her own strength, flexibility and mobility work afterwards. Read what she wrote she
did and take it seriously — it is more accurate than any class label.

The intensity, recovery cost and shoulder load numbers attached to each class are your own rough estimates,
not measurements. If her experience contradicts them, tell her to change them rather than defending them.

Lead the conversation. Don't wait to be asked — if something in the data deserves comment, say it.
When she is doing well, be specific about what she has actually done rather than generically
encouraging. When she is drifting, name it once, kindly, as an observation rather than a verdict —
then help rather than pressing. She is not fragile, but she is a person having a life, and the tone
that keeps her here for years is the tone of someone who is genuinely on her side.

Two or three sentences unless she asks for more.`;
  };

  /* One place that writes the conversation to storage, so it can be called
     before the model is asked as well as after. Rule 15: nothing she says is
     lost. It used to be saved only on success, inside the try — so a failed
     call, a missing key or a thrown prompt took her words with it. */
  const persist = (all) => setData((d) => {
    const chats = [...(d.chats || [])];
    const idx = chats.findIndex((c) => c.id === sessionId.current);
    const entry = { id: sessionId.current, date: coach.t, about: about || "open chat",
      messages: all.map((m) => ({ role: m.role, text: m.content })) };
    if (idx >= 0) chats[idx] = entry; else chats.push(entry);
    /* No cap. Conversations were capped at the last 200 and older ones
       silently dropped — roughly seven months at any real rate of use. They
       are the raw material the coach learns her from (rule 15), they are
       never deleted without her approval (rule 20), and they are small: a
       year of normal use measures 48 KB. */
    return { ...d, chats };
  });

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next); setDraft(""); setBusy(true);
    /* Save what SHE said before anything can fail. */
    persist(next);
    try {
      const reply = await askModel({
        apiKey: data.settings?.apiKey,
        system: context(),
        messages: next.map((m) => ({ role: m.role, content: m.content })),
      }) || "I couldn't get a response just then. Try again in a moment.";
      const done = [...next, { role: "assistant", content: reply }];
      setMsgs(done);
      persist(done);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: e.message === "no-key"
        ? "I need an API key to talk to you outside the Claude app. Settings, then Your data, then paste one in — it stays on this device."
        : "Couldn't reach me just then — check your connection and try again." }]);
    } finally { setBusy(false); }
  };

  const openers = [
    "Why that call this week?",
    "My shoulder hurt today — what now?",
    "I don't want to train today.",
    "Is this actually working?",
  ];

  return (
    <div>
      <Eyebrow color={C.ochre}>Talk to your coach</Eyebrow>
      <h1 className="disp" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, margin: "0 0 6px" }}>Ask me anything</h1>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: C.muted, marginBottom: 16 }}>
        I can see your week, your battery and the call I made. Argue with it if you think I'm wrong.
      </div>

      {msgs.length === 0 && coach.leading.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
          <div style={{ maxWidth: "88%", padding: "12px 15px", borderRadius: 16,
            background: C.mint, fontSize: 14.5, lineHeight: 1.5, color: C.ink }}>
            {coach.leading[0].text}
            {coach.leading[1] && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid rgba(0,0,0,0.07)` }}>
                {coach.leading[1].text}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 13, color: C.moss }}>
              What do you want to do about it?
            </div>
          </div>
        </div>
      )}

      {msgs.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {openers.map((o) => (
            <button key={o} onClick={() => setDraft(o)} className="tap" style={{
              padding: "9px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12,
              border: `1.5px solid ${C.line}`, background: "transparent", color: C.muted,
            }}>{o}</button>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div style={{
              maxWidth: "85%", padding: "11px 14px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              background: m.role === "user" ? C.signal : C.card,
              color: m.role === "user" ? C.chalk : C.ink,
              border: m.role === "user" ? "none" : `1px solid ${C.line}`,
            }}>{m.content}</div>
          </div>
        ))}
        {busy && <div style={{ fontSize: 12, color: C.muted, padding: "6px 2px" }}>thinking…</div>}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Say it, or hold the mic"
          style={{ ...inputStyle, marginBottom: 0, resize: "none", lineHeight: 1.45 }} />
        <MicButton onText={setDraft} current={draft} />
        <button onClick={send} disabled={busy || !draft.trim()} className="tap" style={{
          padding: "13px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
          background: draft.trim() && !busy ? C.signal : C.line, color: C.chalk,
        }}>Send</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <Btn kind="quiet" onClick={close}>Back</Btn>
      </div>
    </div>
  );
}

function Assessment({ which, periodKey, data, setData, coach, close, setSheet }) {
  const isWeekly = which === "weekly";

  /* the coach names a number to beat rather than leaving the page blank */
  const targetFor = (f) => {
    if (!f.better || f.type === "note" || f.type === "scale") return null;
    const m = (coach.analysis || []).find((x) => x.id === f.id);
    if (!m || !m.now) return null;
    const frozen = coach.shoulderFrozen && SHOULDER_SENSITIVE.includes(f.id);
    const step = frozen ? 0 : coach.verdict.key === "advance" ? 0.05 : coach.verdict.key === "reduce" ? -0.05 : 0.02;
    const raw = m.better === "down" ? m.now * (1 - step) : m.now * (1 + step);
    const fmt = (v) => (f.type === "time"
      ? `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}`
      : Math.round(v * 10) / 10);
    if (f.type === "weightreps") {
      /* Load is a product, so the aim is a total you can reach either way —
         more weight, more reps, whichever your body offers that day. */
      const prev = m.reading?.sub || "";
      return {
        last: `${Math.round(m.now)} kg total${prev ? ` (${prev})` : ""}`,
        aim: frozen ? "hold what you did — shoulder" : `beat ${Math.round(raw)} kg total — more weight or more reps`,
      };
    }
    return { last: fmt(m.now), aim: frozen ? fmt(m.now) + " (held — shoulder)" : fmt(raw) };
  };
  const key = periodKey || (isWeekly ? coach.ws : coach.mk);
  const isCurrent = key === (isWeekly ? coach.ws : coach.mk);
  const fields = isWeekly
    ? data.fields.weekly.filter((f) => f.inWeekly !== false)
    : [...data.fields.monthly, ...data.fields.weekly];
  const [form, setForm] = useState(data[which][key] || {});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Eyebrow color={C.ochre}>{isWeekly ? "Weekly check" : "Monthly benchmark"}</Eyebrow>
      <h2 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
        {isCurrent
          ? (isWeekly ? "How did the week go?" : "Where are you now?")
          : (isWeekly ? weekLabel(key) : monthLabel(key))}
      </h2>
      <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
        {isWeekly
          ? "About ten minutes. Anchors plus this week's rotators. Skip anything you didn't test — partial entries are fine."
          : "The full battery, about thirty minutes, plus body composition. Four times more coverage than the weekly."}
      </p>

      {/* THE BATTERY IS HERS (rule 12), AND HAS TO LOOK IT (rule 11).
          The editor already existed — three folds down in Settings, behind a
          button that said "Monthly · 8". From in here, where she is actually
          looking at the exercises, there was no sign the list could change at
          all, which is indistinguishable from it being hard-coded. */}
      <button onClick={() => setSheet({ kind: isWeekly ? "edit-weekly" : "edit-monthly" })}
        className="tap" style={{
          border: "none", background: "transparent", cursor: "pointer", padding: "0 0 18px",
          fontSize: 12, color: C.signal, fontWeight: 600, fontFamily: "inherit" }}>
        Change what's measured — add, remove, rename, reorder →
      </button>

      {[...CAPS, ""].map((cap) => {
        const group = fields.filter((f) => (f.cap || "") === cap);
        if (!group.length) return null;
        return (
          <Card key={cap || "feel"} style={{ marginBottom: 12 }}>
            <Eyebrow>{cap || "How the week felt"}</Eyebrow>
            {group.map((f) => (
              <AssessInput key={f.id} f={f} form={form} set={set}
                target={targetFor(f)}
                pb={f.better === "up" ? coach.pbs[f.id] : null} />
            ))}
          </Card>
        );
      })}

      <div style={{ marginTop: 14 }}>
        <Btn kind="signal" onClick={() => {
          const next = { ...data, [which]: { ...data[which], [key]: form } };
          /* The benchmark is thirty-odd minutes under load — it counts as the
             day's session, so the week isn't punished for measuring. */
          if (!isWeekly && isCurrent && !data.logs[coach.t]?.type) {
            next.logs = { ...data.logs, [coach.t]: {
              ...(data.logs[coach.t] || {}), type: "Monthly benchmark", minutes: "30", completed: true } };
          }
          setData(next); close();
        }}>
          Save {isWeekly ? "weekly check" : "benchmark"}
        </Btn>
        <Btn kind="quiet" onClick={() => setSheet({ kind: isWeekly ? "edit-weekly" : "edit-monthly" })}>Edit which measures appear here</Btn>
        <Btn kind="quiet" onClick={close}>Cancel</Btn>
      </div>
    </>
  );
}

const SheetShell = ({ children, onBack, onClose, canGoBack }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(43,27,46,0.34)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
    <div className="rise" onClick={(e) => e.stopPropagation()} style={{
      background: C.chalk, width: "100%", maxWidth: 480, margin: "0 auto", maxHeight: "92vh", overflowY: "auto",
      borderRadius: "18px 18px 0 0", padding: "12px 16px calc(18px + env(safe-area-inset-bottom))",
    }}>
      {/* stays put while the sheet scrolls — a way out is always one tap away */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 3, background: C.chalk,
        margin: "-12px -16px 12px", padding: "12px 16px 10px",
        borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onBack} className="tap mono" style={{
          display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent",
          cursor: "pointer", color: C.signal, fontSize: 12, fontWeight: 600, padding: "6px 8px 6px 0",
          letterSpacing: "0.04em", textTransform: "uppercase",
        }}>← {canGoBack ? "Back" : "Close"}</button>
        <div style={{ width: 34, height: 4, background: C.line, borderRadius: 4 }} />
        <button onClick={onClose} className="tap" style={{
          border: "none", background: "transparent", cursor: "pointer", color: C.muted, fontSize: 18, padding: "4px 0 4px 8px",
        }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

/* ============================================================================
   8. SHELL
   ==========================================================================*/
function CoachApp() {
  const [data, setDataRaw] = useState(BLANK);
  const [ready, setReady] = useState(false);
  const [stack, setStack] = useState(["today"]);   // screen history
  const [sheets, setSheets] = useState([]);        // sheet history

  useEffect(() => {
    loadData().then((d) => {
      setDataRaw(d); setReady(true);
      /* If she has granted a folder — her OneDrive folder, say — put a dated
         copy in it now. Silent on purpose: it either works or the Settings
         card tells her how long it has been. Never blocks opening the app. */
      try {
        if (d && !d.sample && Object.keys(d.logs || {}).length) {
          if (lastFolderBackup() !== today()) writeToFolder(d);
        }
      } catch (e) {}
    });
  }, []);
  /* SAVE AFTER THE STATE SETTLES, NEVER BEFORE.

     This used to be `setDataRaw(next); saveData(next);`. React accepts a
     function as an updater, and 33 call sites pass one — including the
     daily-note effect that fires on the first open of every new day. But
     `JSON.stringify(aFunction)` is `undefined`, so storage received the literal
     string "undefined". On the next open `JSON.parse("undefined")` threw, the
     catch treated it as a first run, and every log, WHOOP day, record entry,
     goal and conversation was gone — silently, with no error.

     Saving from an effect keyed on `data` fixes it for both shapes: whatever
     React resolved is what gets written. The `ready` guard stops the empty
     starting state from overwriting real data before `loadData()` returns. */
  const setData = useCallback((next) => setDataRaw(next), []);
  useEffect(() => { if (ready) saveData(data); }, [data, ready]);

  /* If the store was there and unreadable, do not quietly present an empty app
     — her data may be intact underneath. Throwing here hands it to the rescue
     screen, which reads the raw store and offers it back to her. */
  if (ready && didStoreReadFail()) {
    throw new Error("Couldn't read your saved data. Nothing has been overwritten — your data should still be below.");
  }

  const coach = useCoach(data);

  const tab = stack[stack.length - 1];
  const go = (t) => { if (t !== tab) setStack((s) => [...s.slice(-9), t]); };
  const goBack = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const sheet = sheets[sheets.length - 1] || null;
  const setSheet = (next) => {
    if (next === null) setSheets((s) => s.slice(0, -1));
    else setSheets((s) => [...s, next]);
  };

  const TABS = [["today", "Today"], ["plan", "Workouts"], ["progress", "Progress"], ["settings", "Settings"]];
  const title = TABS.find(([id]) => id === tab)?.[1] || "";
  const canGoBack = stack.length > 1;

  return (
    <div className="body" style={{ background: C.chalk, color: C.ink, minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 14px 96px" }}>

        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, minHeight: 34 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {canGoBack && (
              <button onClick={goBack} className="tap" aria-label="Back" style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9, cursor: "pointer",
                border: `1px solid ${C.line}`, background: C.card, color: C.signal,
                fontSize: 15, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
              }}>←</button>
            )}
            <div className="disp" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
              {canGoBack ? title : "COACH"}
            </div>
          </div>
          <div style={{ width: 124, flexShrink: 0 }}><WeekSpine coach={coach} /></div>
        </header>

        {!ready ? <div style={{ padding: "60px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>Loading…</div> : (
          <>
            {tab === "today" && <Today data={data} setData={setData} coach={coach} setSheet={setSheet} />}
            {tab === "plan" && <Workouts data={data} setData={setData} coach={coach} />}
            {tab === "progress" && <Progress data={data} setData={setData} coach={coach} setSheet={setSheet} />}
            {tab === "settings" && <Settings data={data} setData={setData} setSheet={setSheet} />}
          </>
        )}

        {ready && canGoBack && (
          <div style={{ marginTop: 14 }}>
            <Btn kind="ghost" onClick={goBack}>← Back to {TABS.find(([id]) => id === stack[stack.length - 2])?.[1]}</Btn>
          </div>
        )}
      </div>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(252,248,248,0.94)",
        backdropFilter: "blur(10px)", borderTop: `1px solid ${C.line}`, padding: "6px 18px calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", gap: 14 }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => go(id)} className="tap mono" style={{
              flex: 1, padding: "13px 0 11px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: tab === id ? C.signal : C.muted,
              position: "relative",
              fontSize: 10, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase",
            }}>{label}</button>
          ))}
        </div>
      </nav>

      {sheet && (
        <SheetShell canGoBack={sheets.length > 1} onBack={() => setSheet(null)} onClose={() => setSheets([])}>
          {sheet.kind === "weekly" || sheet.kind === "monthly" ? (
            <Assessment which={sheet.kind} periodKey={sheet.key} data={data} setData={setData} coach={coach}
              close={() => setSheet(null)} setSheet={setSheet} />
          ) : sheet.kind === "formulas" ? (
            <Formulas data={data} setData={setData} close={() => setSheet(null)} />
          ) : sheet.kind === "analysis" ? (
            <Analysis coach={coach} setSheet={setSheet} close={() => setSheet(null)} />
          ) : sheet.kind === "journal" ? (
            <Journal data={data} setData={setData} coach={coach} close={() => setSheet(null)} />
          ) : sheet.kind === "whooplog" ? (
            <WhoopLog data={data} setSheet={setSheet} close={() => setSheet(null)} />
          ) : sheet.kind === "whoop" ? (
            <WhoopImport data={data} setData={setData} close={() => setSheet(null)} />
          ) : sheet.kind === "notes" ? (
            <NotesArchive data={data} setData={setData} coach={coach} close={() => setSheet(null)} />
          ) : sheet.kind === "program" ? (
            <ProgramView data={data} setData={setData} coach={coach} setSheet={setSheet} />
          ) : sheet.kind === "vital" ? (
            <VitalDetail id={sheet.id} coach={coach} setSheet={setSheet} />
          ) : sheet.kind === "edit-mobility" ? (
            <MobilityEditor data={data} setData={setData} coach={coach} close={() => setSheet(null)} />
          ) : sheet.kind === "profile" ? (
            <ProfileSheet data={data} setData={setData} coach={coach} setSheet={setSheet} />
          ) : sheet.kind === "vitals" ? (
            <VitalsAll coach={coach} setSheet={setSheet} />
          ) : sheet.kind === "mobility" ? (
            <MobilitySheet data={data} setData={setData} coach={coach} close={() => setSheet(null)} />
          ) : sheet.kind === "briefing" ? (
            <Briefing coach={coach} setSheet={setSheet} close={() => setSheet(null)} />
          ) : sheet.kind === "chat" ? (
            <CoachChat data={data} setData={setData} coach={coach} seed={sheet.seed} about={sheet.about} close={() => setSheet(null)} />
          ) : (
            <FieldEditor which={sheet.kind === "edit-weekly" ? "weekly" : "monthly"} data={data} setData={setData} close={() => setSheet(null)} />
          )}
        </SheetShell>
      )}
    </div>
  );
}

/* ============================================================================
   9. THE SAFETY NET
   ---------------------------------------------------------------------------
   The app is meant to be edited — by her, on github.com, for years. That makes
   one failure mode unacceptable: a bad edit throws, React unmounts everything,
   the screen goes white, and the only backup button in existence is inside the
   app she can no longer open. Her data is still sitting in storage, intact and
   unreachable, which is the worst possible place for it.

   So: catch the error, and put the rescue in the hands of the person looking at
   the white screen. This component touches nothing the app computes — no
   useCoach, no metrics, no store adapter — because whatever just broke might be
   any of them. It reads the raw string out of localStorage and shows it.
   ==========================================================================*/
/* WHAT IS ACTUALLY IN THE STORE.

   The rescue screen used to have exactly one way out: reload. That is the right
   answer when the fault is in the code, because the next deploy fixes it. It is
   a locked door when the fault is in the STORED VALUE - reloading re-reads the
   same unreadable string forever, and the only backup button in existence is
   inside the app she can no longer open.

   This tells the two apart. A value that parses is her data and is never
   offered for deletion, whatever else went wrong. A value that cannot parse is
   examined for anything worth keeping; only when there is provably nothing -
   the literal strings a broken write leaves behind - is starting fresh offered,
   and even then she is the one who presses it, twice. (Rule 20.) */
const readStore = (raw) => {
  if (raw === null || raw === undefined) return { state: "empty" };
  const text = String(raw);
  let parsed = null;
  try { parsed = JSON.parse(text); } catch (e) { parsed = undefined; }
  if (parsed !== undefined && parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    return {
      state: "readable",
      days: Object.keys(parsed.logs || {}).length,
      entries: (parsed.issues || []).length + (parsed.goals || []).length + (parsed.chats || []).length,
    };
  }
  /* Not an object. "undefined" and "null" are what a write of a function or a
     missing value leaves behind, and they hold nothing at all. */
  const junk = text.trim();
  if (junk === "" || junk === "undefined" || junk === "null" || junk === "NaN")
    return { state: "junk", bytes: text.length, text: junk };
  /* Anything else unparseable might be a truncated but partly readable file -
     never offer to throw that away. */
  return { state: "damaged", bytes: text.length };
};

/* A snapshot worth putting back: one that parses and actually holds days. */
const usableSnapshot = () => {
  try {
    const list = JSON.parse(window.localStorage.getItem("coach:snapshots") || "[]") || [];
    for (const s of list) {
      if (!s || !s.json) continue;
      try {
        const d = JSON.parse(s.json);
        const days = Object.keys(d.logs || {}).length;
        if (days > 0) return { day: s.day, days, json: s.json };
      } catch (e) { /* skip a snapshot that will not parse */ }
    }
  } catch (e) { /* no snapshots */ }
  return null;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null, raw: null, copied: false, armed: false, snap: null };
  }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) {
    let raw = null;
    try { raw = window.localStorage.getItem("coach:data"); } catch (e) { raw = null; }
    let snap = null;
    try { snap = usableSnapshot(); } catch (e) { snap = null; }
    this.setState({ raw, snap });
  }
  render() {
    if (!this.state.err) return this.props.children;
    const { err, raw, copied, armed, snap } = this.state;
    const msg = String((err && err.message) || err || "unknown");
    const found = readStore(raw);
    const onDisk = openedFromDisk();
    const days = found.state === "readable" ? found.days : null;
    const box = {
      background: C.card, borderRadius: 18, padding: 20, marginBottom: 14,
      boxShadow: "0 1px 3px rgba(43,27,46,0.06)",
    };
    return (
      <div style={{ minHeight: "100vh", background: C.chalk, color: C.ink,
                    padding: "28px 18px 40px", fontFamily: "'Hanken Grotesk',system-ui,sans-serif" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="disp" style={{ fontSize: 26, marginBottom: 6 }}>
            {onDisk
              ? "This copy cannot save anything."
              : found.state === "junk"
              ? "One thing is in the way."
              : "The app hit an error opening."}
          </div>
          <div className="mono" style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>
            BUILD {BUILD}
          </div>
          <div style={{ fontSize: 15, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
            {onDisk
              ? <>You have opened the single-file copy straight from a folder on this
                  computer. Browsers do not allow a page opened that way to save anything,
                  so this copy can show you the app but cannot keep a thing you type into
                  it — and it was never holding your training. That lives in the installed
                  app, at its own web address, and is untouched by this.</>
              : found.state === "junk"
              ? <>There is nothing of yours on this device to lose — the store is holding a leftover
                  from an interrupted write rather than any data. Clear it{snap ? " or put back a saved copy" : ""} and
                  the app opens. It is one tap below.</>
              : <>Nothing is lost. Your data is still on this device exactly as it was —
                  this screen just stands between you and a blank page while it gets fixed.</>}
          </div>

          {/* THE WAY OUT COMES FIRST WHEN THERE IS NOTHING TO COPY.
              Buried under two explanatory cards, the fix is invisible on a phone —
              and a rescue screen whose exit is below the fold reads, correctly,
              as an app that will not load. */}
          {found.state === "junk" && this.renderRoutes()}

          <div style={box}>
            <div style={{ fontSize: 12, letterSpacing: 0.6, color: C.muted, marginBottom: 8 }}>
              {found.state === "readable" ? "FIRST — TAKE A COPY" : "WHAT IS IN THE STORE"}
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.5, marginBottom: 12 }}>
              {found.state === "readable"
                ? <>Everything you have logged is in the box below — {days} day{days === 1 ? "" : "s"} of
                    training{found.entries ? <> and {found.entries} other thing{found.entries === 1 ? "" : "s"} you have written</> : null}.
                    Copy it somewhere safe. It restores through Settings → Your data → Restore
                    once the app opens again.</>
                : found.state === "damaged"
                ? <>The saved data is there but the app cannot read it. It is in the box below —
                    copy it out before anything else, because parts of it may still be recoverable
                    by hand. Nothing has been changed or removed.</>
                : found.state === "junk"
                ? <>There is no data in the store — only the word “{found.text}”, which is what an
                    interrupted write leaves behind. Nothing of yours has been overwritten by this;
                    if you had logged anything, it would be here.</>
                : <>This device has no saved data yet, so there is nothing to rescue.</>}
            </div>
            {raw && found.state !== "junk" && (
              <>
                <textarea readOnly value={raw}
                  onFocus={(e) => e.target.select()}
                  style={{ width: "100%", height: 120, fontSize: 11, fontFamily: "'IBM Plex Mono',ui-monospace,monospace",
                           border: `1px solid ${C.line}`, borderRadius: 12, padding: 10, color: C.ink,
                           background: C.chalk, resize: "vertical" }} />
                <button
                  onClick={() => {
                    try {
                      const ta = document.querySelector("textarea");
                      if (ta) { ta.select(); document.execCommand("copy"); }
                      if (navigator.clipboard) navigator.clipboard.writeText(raw);
                      this.setState({ copied: true });
                    } catch (e) { this.setState({ copied: true }); }
                  }}
                  style={{ marginTop: 10, width: "100%", padding: "13px 16px", borderRadius: 14, border: "none",
                           background: copied ? C.moss : C.signal, color: "#fff", fontSize: 15, fontWeight: 600,
                           fontFamily: "inherit", cursor: "pointer" }}>
                  {copied ? "Copied — paste it somewhere safe" : "Copy my data"}
                </button>
              </>
            )}
          </div>

          <div style={box}>
            <div style={{ fontSize: 12, letterSpacing: 0.6, color: C.muted, marginBottom: 8 }}>
              THEN — WHAT WENT WRONG
            </div>
            <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',ui-monospace,monospace",
                          background: C.chalk, border: `1px solid ${C.line}`, borderRadius: 12,
                          padding: 12, color: C.clay, wordBreak: "break-word", lineHeight: 1.5 }}>
              {msg}
            </div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
              That line is what a fix starts from — send it over. If this began right
              after an edit on github.com, undoing that edit puts the app back.
            </div>
          </div>

          {found.state !== "junk" && this.renderRoutes()}

          <button
            onClick={() => { try { window.location.reload(); } catch (e) {} }}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 14,
                     border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                     fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
            Try opening it again
          </button>
        </div>
      </div>
    );
  }

  /* The two things she can actually DO, kept together so they can be placed
     above or below the explanation depending on which she needs first. */
  renderRoutes() {
    const { raw, armed, snap } = this.state;
    const found = readStore(raw);
    const box = {
      background: C.card, borderRadius: 18, padding: 20, marginBottom: 14,
      boxShadow: "0 1px 3px rgba(43,27,46,0.06)",
    };
    return (
      <>
          {/* A SNAPSHOT IS THE FIRST THING TO TRY. It is a separate storage key,
              so whatever happened to the main one usually left it alone. */}
          {snap && (
            <div style={box}>
              <div style={{ fontSize: 12, letterSpacing: 0.6, color: C.muted, marginBottom: 8 }}>
                THERE IS A SAVED COPY ON THIS DEVICE
              </div>
              <div style={{ fontSize: 14.5, lineHeight: 1.5, marginBottom: 12 }}>
                The app keeps its own copy, once a day, in a separate place. The most recent
                one holding anything is from {snap.day} and has {snap.days} day{snap.days === 1 ? "" : "s"} of
                training in it. Putting it back replaces what is in the main store now.
              </div>
              <button
                onClick={() => {
                  try {
                    window.localStorage.setItem("coach:data", snap.json);
                    window.location.reload();
                  } catch (e) { /* the store is refusing writes too */ }
                }}
                style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "none",
                         background: C.moss, color: "#fff", fontSize: 15, fontWeight: 600,
                         fontFamily: "inherit", cursor: "pointer" }}>
                Put back the copy from {snap.day}
              </button>
            </div>
          )}

          {/* ONLY when the stored value provably holds nothing. Never when it
              parses, and never when it is merely damaged — something damaged may
              still be readable by hand, and rule 20 says her data is permanent. */}
          {found.state === "junk" && (
            <div style={box}>
              <div style={{ fontSize: 12, letterSpacing: 0.6, color: C.muted, marginBottom: 8 }}>
                OR — START THIS DEVICE FRESH
              </div>
              <div style={{ fontSize: 14.5, lineHeight: 1.5, marginBottom: 12 }}>
                What is in the store is the {found.bytes}-character word
                “{found.text}” — not your data, and not damaged data either. It is what an
                interrupted write leaves behind, and there is nothing in it to recover.
                Clearing it lets the app open again. Your saved copies are kept and are not
                touched by this.
              </div>
              {armed ? (
                <>
                  <button
                    onClick={() => {
                      try { window.localStorage.removeItem("coach:data"); } catch (e) {}
                      try { window.location.reload(); } catch (e) {}
                    }}
                    style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "none",
                             background: C.signal, color: "#fff", fontSize: 15, fontWeight: 600,
                             fontFamily: "inherit", cursor: "pointer" }}>
                    Yes — clear it and open the app
                  </button>
                  <button
                    onClick={() => this.setState({ armed: false })}
                    style={{ marginTop: 8, width: "100%", padding: "13px 16px", borderRadius: 14,
                             border: `1px solid ${C.line}`, background: C.card, color: C.muted,
                             fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                    Never mind
                  </button>
                </>
              ) : (
                <button
                  onClick={() => this.setState({ armed: true })}
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 14,
                           border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                           fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                  Clear it and start fresh
                </button>
              )}
            </div>
          )}
      </>
    );
  }
}

export default function App() {
  useEffect(() => { keepCurrent(); }, []);
  return (
    <ErrorBoundary>
      <CoachApp />
    </ErrorBoundary>
  );
}

/**
 * Training Plan Generator
 * Produces a complete multi-week plan from a RunnerProfile.
 * Runs entirely on device — no API calls.
 */

import { calculateVDOT, getPaceZones, roundPace, formatPaceRange } from './vdot';
import type { PaceZones } from './vdot';
import type { RunnerProfile } from '../contexts/AppContext';
import type { RunType } from '../constants/runTypes';

// ─── Output types ───────────────────────────────────────────────────

export interface TrainingPlan {
  id: string;
  createdAt: string;
  targetDistance: '5k' | '10k' | 'half' | 'marathon';
  fiveKSeconds: number | null;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  daysPerWeek: number;
  planDurationWeeks: number;
  restDays: number[];
  useImperial: boolean;
  paceZones: PaceZones | null;
  weeks: TrainingWeek[];
  startDate: string;
  extraRuns: ExtraRun[];
}

export interface TrainingWeek {
  weekNumber: number;
  phase: Phase;
  isCutback: boolean;
  targetVolumeKm: number;
  runs: ScheduledRun[];
}

export interface ScheduledRun {
  id: string;
  date: string;
  weekNumber: number;
  dayOfWeek: number;
  runType: RunType;
  distanceKm: number;
  paceMin: number | null;
  paceMax: number | null;
  estimatedDurationMinutes: number;
  description: string;
  tips: string;
  completed: boolean;
  phase: Phase;
  stravaActivityId?: string;
  actualDistanceKm?: number;
  actualDurationMinutes?: number;
  actualPaceSeconds?: number;
}

export interface ExtraRun {
  stravaActivityId: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
}

type Phase = 'base' | 'specific' | 'taper';
type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite';
type Distance = '5k' | '10k' | 'half' | 'marathon';

// ─── Constants ──────────────────────────────────────────────────────

const WEEK1_VOLUME: Record<Level, Record<number, number>> = {
  beginner:     { 3: 8, 4: 10, 5: 12, 6: 14, 7: 15 },
  intermediate: { 3: 15, 4: 20, 5: 24, 6: 28, 7: 30 },
  advanced:     { 3: 22, 4: 28, 5: 34, 6: 40, 7: 44 },
  elite:        { 3: 30, 4: 38, 5: 46, 6: 54, 7: 60 },
};

const BASE_PEAK_VOLUME: Record<Level, Record<number, number>> = {
  beginner:     { 3: 16, 4: 22, 5: 26, 6: 30, 7: 32 },
  intermediate: { 3: 28, 4: 36, 5: 42, 6: 48, 7: 52 },
  advanced:     { 3: 38, 4: 48, 5: 58, 6: 66, 7: 72 },
  elite:        { 3: 50, 4: 64, 5: 78, 6: 90, 7: 98 },
};

const DISTANCE_MULTIPLIER: Record<Distance, number> = {
  '5k': 0.75,
  '10k': 0.9,
  half: 1.0,
  marathon: 1.2,
};

const WEEKLY_INCREASE: Record<Level, number> = {
  beginner: 0.055,
  intermediate: 0.075,
  advanced: 0.09,
  elite: 0.09,
};

const CUTBACK_FREQUENCY: Record<Level, number> = {
  beginner: 3,
  intermediate: 4,
  advanced: 4,
  elite: 4,
};

const EASY_CAP: Record<Level, number> = {
  beginner: 8,
  intermediate: 12,
  advanced: 15,
  elite: 18,
};

const LONG_RUN_FLOOR: Record<Level, number> = {
  beginner: 3,
  intermediate: 6,
  advanced: 8,
  elite: 10,
};

const LONG_RUN_SHARE_BY_DAYS: Record<number, number> = {
  3: 0.30,
  4: 0.33,
  5: 0.35,
  6: 0.35,
  7: 0.35,
};

const LONG_RUN_SHARE_BY_DISTANCE: Record<Distance, number> = {
  '5k': 0.25,
  '10k': 0.27,
  half: 0.30,
  marathon: 0.325,
};

const PHASE_DURATIONS: Record<number, Record<Distance, { base: number; specific: number; taper: number }>> = {
  8: {
    '5k':      { base: 2, specific: 5, taper: 1 },
    '10k':     { base: 2, specific: 5, taper: 1 },
    half:      { base: 2, specific: 5, taper: 1 },
    marathon:  { base: 2, specific: 4, taper: 2 },
  },
  10: {
    '5k':      { base: 3, specific: 5, taper: 2 },
    '10k':     { base: 3, specific: 5, taper: 2 },
    half:      { base: 3, specific: 5, taper: 2 },
    marathon:  { base: 3, specific: 5, taper: 2 },
  },
  12: {
    '5k':      { base: 4, specific: 6, taper: 2 },
    '10k':     { base: 4, specific: 6, taper: 2 },
    half:      { base: 4, specific: 6, taper: 2 },
    marathon:  { base: 4, specific: 5, taper: 3 },
  },
};

const TAPER_VOLUME_REDUCTION: Record<Distance, number> = {
  '5k': 0.32,
  '10k': 0.37,
  half: 0.43,
  marathon: 0.50,
};

// Quality session complexity ladders
const DEFAULT_LADDER: RunType[] = ['easy', 'hill', 'tempo', 'interval', 'tempo']; // strides handled separately
const LADDER_5K: RunType[] = ['easy', 'interval', 'tempo', 'interval'];
const MARATHON_LADDER: RunType[] = ['easy', 'hill', 'tempo', 'tempo', 'interval'];

// Min weeks before taper for each quality type
const MIN_WEEKS_BEFORE_TAPER: Record<string, number> = {
  strides: 1,
  hill: 2,
  tempo: 3,
  interval: 2,
  racePace: 2,
};

const UNLOCK_SPEED: Record<Level, number> = {
  beginner: 2.5,    // every 2-3 weeks
  intermediate: 1.5, // every 1-2 weeks
  advanced: 1,       // every week
  elite: 1,          // every week
};

// Marathon long run time caps in minutes
const MARATHON_LONG_RUN_CAP: Partial<Record<Level, number>> = {
  intermediate: 150,
  advanced: 180,
  elite: 210,
};

// ─── Helpers ────────────────────────────────────────────────────────

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function roundDist(km: number): number {
  return Math.round(km * 2) / 2; // nearest 0.5
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const monday = addDays(now, daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getLadder(distance: Distance): RunType[] {
  if (distance === '5k') return LADDER_5K;
  if (distance === 'marathon') return MARATHON_LADDER;
  return DEFAULT_LADDER;
}

// ─── Phase assignment ───────────────────────────────────────────────

function getPhases(
  planWeeks: number,
  distance: Distance,
): { base: number; specific: number; taper: number } {
  return PHASE_DURATIONS[planWeeks]?.[distance] ?? PHASE_DURATIONS[12][distance];
}

function getWeekPhase(
  weekNum: number,
  phases: { base: number; specific: number; taper: number },
): Phase {
  if (weekNum <= phases.base) return 'base';
  if (weekNum <= phases.base + phases.specific) return 'specific';
  return 'taper';
}

// ─── Cutback detection ──────────────────────────────────────────────

function isCutbackWeek(
  weekNum: number,
  level: Level,
  phase: Phase,
): boolean {
  if (phase === 'taper') return false;
  const freq = CUTBACK_FREQUENCY[level];
  return weekNum > 1 && weekNum % freq === 0;
}

// ─── Volume progression ─────────────────────────────────────────────

function computeWeeklyVolumes(
  planWeeks: number,
  level: Level,
  days: number,
  distance: Distance,
  phases: { base: number; specific: number; taper: number },
): { volume: number; phase: Phase; isCutback: boolean }[] {
  const week1Vol = WEEK1_VOLUME[level][days];
  const basePeak = BASE_PEAK_VOLUME[level][days];
  const peakVolume = Math.round(basePeak * DISTANCE_MULTIPLIER[distance]);
  const increaseRate = WEEKLY_INCREASE[level];
  const taperReduction = TAPER_VOLUME_REDUCTION[distance];

  const result: { volume: number; phase: Phase; isCutback: boolean }[] = [];
  let currentVolume = week1Vol;

  for (let w = 1; w <= planWeeks; w++) {
    const phase = getWeekPhase(w, phases);
    const cutback = isCutbackWeek(w, level, phase);

    if (phase === 'taper') {
      // Progressive taper reduction
      const taperWeekIndex = w - phases.base - phases.specific; // 1-indexed within taper
      const taperWeeks = phases.taper;
      const peakVol = result.length > 0 ? Math.max(...result.filter(r => r.phase !== 'taper').map(r => r.volume)) : currentVolume;
      const reductionPerWeek = (peakVol * taperReduction) / taperWeeks;
      const taperVol = Math.round(peakVol - reductionPerWeek * taperWeekIndex);
      result.push({ volume: Math.max(taperVol, Math.round(week1Vol * 0.6)), phase, isCutback: false });
    } else if (cutback) {
      result.push({ volume: Math.round(currentVolume * 0.8), phase, isCutback: true });
    } else {
      if (w === 1) {
        currentVolume = week1Vol;
      } else {
        const prevBuildVolume = currentVolume;
        currentVolume = Math.min(prevBuildVolume * (1 + increaseRate), peakVolume);
      }
      result.push({ volume: Math.round(currentVolume), phase, isCutback: false });
    }
  }

  return result;
}

// ─── Run type unlocking ─────────────────────────────────────────────

type UnlockedType = 'strides' | RunType;

function getUnlockedTypes(
  weekNum: number,
  level: Level,
  distance: Distance,
  phases: { base: number; specific: number; taper: number },
  isCutback: boolean,
): UnlockedType[] {
  const ladder = getLadder(distance);
  const unlockPace = UNLOCK_SPEED[level];
  const taperStart = phases.base + phases.specific + 1;
  const weeksBeforeTaper = taperStart - weekNum;

  const unlocked: UnlockedType[] = [];

  // Strides: unlock based on level week 1 rules
  const stridesWeek = level === 'beginner' ? Infinity : level === 'intermediate' ? 2 : 1;
  if (weekNum >= stridesWeek && weeksBeforeTaper >= MIN_WEEKS_BEFORE_TAPER.strides) {
    unlocked.push('strides');
  }

  // Quality types from ladder
  for (let i = 1; i < ladder.length; i++) {
    const unlockWeek = Math.ceil(i * unlockPace) + 1; // +1 because week 1 is setup
    const type = ladder[i];

    if (type === 'easy') continue;

    // Check time-awareness: enough weeks before taper?
    const minWeeks = MIN_WEEKS_BEFORE_TAPER[type] ?? 2;
    if (weeksBeforeTaper < minWeeks) continue;

    // Don't unlock during cutback
    if (weekNum === unlockWeek && isCutback) continue;

    if (weekNum >= unlockWeek) {
      if (!unlocked.includes(type as UnlockedType)) {
        unlocked.push(type as UnlockedType);
      }
    }
  }

  return unlocked;
}

// ─── Day placement ──────────────────────────────────────────────────

function getTrainingDays(restDays: number[], daysPerWeek: number): number[] {
  // All days 0-6 (Mon-Sun) minus rest days, take first N
  const available = [0, 1, 2, 3, 4, 5, 6].filter((d) => !restDays.includes(d));
  return available.slice(0, daysPerWeek);
}

interface DaySlot {
  dayOfWeek: number;
  role: 'easy' | 'quality1' | 'quality2' | 'long' | 'recovery';
}

function assignSlots(
  trainingDays: number[],
  daysPerWeek: number,
  level: Level,
  phase: Phase,
  isCutback: boolean,
  unlockedTypes: UnlockedType[],
  weeklyVolume: number,
): DaySlot[] {
  const days = [...trainingDays].sort((a, b) => a - b);
  const slots: DaySlot[] = [];

  if (days.length === 0) return slots;

  // Long run: last available day
  const longRunDay = days[days.length - 1];

  // Has quality types?
  const hasQuality = unlockedTypes.some(
    (t) => t === 'tempo' || t === 'interval' || t === 'hill',
  );

  // Primary quality: maximize distance from long run
  let quality1Day = -1;
  if (hasQuality && phase !== 'base') {
    // Find day with most distance from long run
    const candidates = days.filter((d) => d !== longRunDay);
    let bestDist = 0;
    for (const d of candidates) {
      const dist = Math.min(
        Math.abs(longRunDay - d),
        7 - Math.abs(longRunDay - d),
      );
      if (dist > bestDist) {
        bestDist = dist;
        quality1Day = d;
      }
    }
  } else if (hasQuality && phase === 'base') {
    // Base phase: hills can appear
    const hasHills = unlockedTypes.includes('hill');
    if (hasHills) {
      const candidates = days.filter((d) => d !== longRunDay);
      let bestDist = 0;
      for (const d of candidates) {
        const dist = Math.min(
          Math.abs(longRunDay - d),
          7 - Math.abs(longRunDay - d),
        );
        if (dist > bestDist) {
          bestDist = dist;
          quality1Day = d;
        }
      }
    }
  }

  // Secondary quality
  let quality2Day = -1;
  const canHaveSecondQuality =
    (level === 'advanced' || level === 'elite') &&
    phase === 'specific' &&
    !isCutback &&
    daysPerWeek >= 5;

  if (canHaveSecondQuality && quality1Day >= 0) {
    const minGap = 2; // advanced/elite only reach here
    const candidates = days.filter(
      (d) => d !== longRunDay && d !== quality1Day,
    );
    for (const d of candidates) {
      const distFromQ1 = Math.min(
        Math.abs(d - quality1Day),
        7 - Math.abs(d - quality1Day),
      );
      const distFromLong = Math.min(
        Math.abs(d - longRunDay),
        7 - Math.abs(d - longRunDay),
      );
      if (distFromQ1 >= minGap && distFromLong >= 1) {
        quality2Day = d;
        break;
      }
    }
  }

  // Recovery run eligibility
  const canHaveRecovery = daysPerWeek >= 5 && weeklyVolume >= 25;

  for (const d of days) {
    if (d === longRunDay) {
      slots.push({ dayOfWeek: d, role: 'long' });
    } else if (d === quality1Day) {
      slots.push({ dayOfWeek: d, role: 'quality1' });
    } else if (d === quality2Day) {
      slots.push({ dayOfWeek: d, role: 'quality2' });
    } else if (
      canHaveRecovery &&
      slots.filter((s) => s.role === 'recovery').length === 0 &&
      // Place recovery day after long run or quality
      (d === (longRunDay + 1) % 7 || d === (quality1Day + 1) % 7)
    ) {
      slots.push({ dayOfWeek: d, role: 'recovery' });
    } else {
      slots.push({ dayOfWeek: d, role: 'easy' });
    }
  }

  return slots;
}

// ─── Coaching notes ─────────────────────────────────────────────────

function getDescription(
  runType: RunType,
  distanceKm: number,
  paceZones: PaceZones | null,
  imperial: boolean,
  level: Level,
  distance: Distance,
  phase: Phase,
  weekNum: number,
  isFirstOccurrence: boolean,
  hasStrides: boolean,
): string {
  const unit = imperial ? 'mi' : 'km';
  const dist = imperial ? roundDist(distanceKm * 0.621371) : distanceKm;

  switch (runType) {
    case 'easy': {
      let desc = `${dist} ${unit} easy run`;
      if (hasStrides) {
        desc += ' with strides';
      }
      if (paceZones) {
        desc += ` at ${formatPaceRange(paceZones.easy.minPace, paceZones.easy.maxPace, imperial)}`;
      }
      return desc;
    }
    case 'long': {
      let desc = `${dist} ${unit} long run`;
      if (paceZones) {
        desc += ` at ${formatPaceRange(paceZones.easy.minPace, paceZones.easy.maxPace, imperial)}`;
      }
      if (distance === 'marathon' && phase === 'specific' && !isFirstOccurrence) {
        desc += ' with marathon pace segments';
      }
      if (level === 'beginner' && distanceKm > 6) {
        desc += ' (with walk breaks)';
      }
      return desc;
    }
    case 'tempo': {
      const qualityMin = isFirstOccurrence ? 10 : 20;
      let desc = `Tempo run: ${qualityMin} min at threshold effort`;
      if (paceZones) {
        desc += ` (${formatPaceRange(paceZones.threshold.minPace, paceZones.threshold.maxPace, imperial)})`;
      }
      desc += '. Include warm up and cool down.';
      return desc;
    }
    case 'interval': {
      const reps = isFirstOccurrence ? '3 x 1000m' : '5 x 1000m';
      let desc = `Intervals: ${reps} with equal jog recovery`;
      if (paceZones) {
        desc += ` at ${formatPaceRange(paceZones.interval.minPace, paceZones.interval.maxPace, imperial)}`;
      }
      desc += '. Include warm up and cool down.';
      return desc;
    }
    case 'hill': {
      const reps = isFirstOccurrence ? '4-5 x 20 sec' : '8 x 30 sec';
      return `Hill repeats: ${reps} uphill at hard effort, walk/jog down recovery. Include warm up and cool down.`;
    }
    case 'recovery':
      return `${dist} ${unit} recovery run at very easy effort`;
    case 'rest':
      return 'Rest day';
  }
}

function getTips(
  runType: RunType,
  level: Level,
  distance: Distance,
  phase: Phase,
  weekNum: number,
  distanceKm: number,
  hasStrides: boolean,
): string {
  const showCadence = weekNum % 3 === 0;

  switch (runType) {
    case 'easy': {
      let tips = 'Keep this conversational. You should be able to speak in full sentences.';
      if (hasStrides) {
        tips +=
          ' At the end, do 4-6 x 20 second smooth accelerations with 60 seconds easy jogging between. Light and quick.';
      }
      if (showCadence) {
        tips +=
          ' Aim for 170-180 steps per minute. The simplest way is to take shorter steps.';
      }
      return tips;
    }
    case 'long': {
      let tips =
        'Start easy and stay easy. The goal is time on your feet, not speed.';
      if (level === 'beginner' && distanceKm > 6) {
        tips += ' Run 8 minutes, walk 2 minutes, repeat.';
      }
      if (
        distance === 'marathon' &&
        phase === 'specific' &&
        weekNum > 6
      ) {
        tips +=
          ' Practise your race nutrition today. Aim for 30-60g of carbohydrate per hour.';
      }
      if (showCadence) {
        tips +=
          ' Aim for 170-180 steps per minute.';
      }
      return tips;
    }
    case 'tempo':
      return 'Comfortably hard. You can speak in short phrases but not full conversations. Include warm up and cool down at easy pace.';
    case 'interval':
      return 'Hard effort on the repeats, easy jog recovery between. Include warm up and cool down at easy pace.';
    case 'hill':
      return 'Run uphill at a hard but controlled effort. Walk or jog back down for recovery. Include a 10 minute warm up.';
    case 'recovery':
      return 'Very short and very easy. The purpose is gentle movement, not fitness.';
    case 'rest':
      return 'Recovery and regeneration. Consider strength work: core stability, knee step downs, calf drops, foot exercises.';
  }
}

// ─── Effort-based descriptions (no 5K time) ─────────────────────────

function getEffortDescription(
  runType: RunType,
  distanceKm: number,
  imperial: boolean,
  level: Level,
  distance: Distance,
  phase: Phase,
  isFirstOccurrence: boolean,
  hasStrides: boolean,
): string {
  const unit = imperial ? 'mi' : 'km';
  const dist = imperial ? roundDist(distanceKm * 0.621371) : distanceKm;

  switch (runType) {
    case 'easy': {
      let desc = `${dist} ${unit} at easy effort (full conversation pace)`;
      if (hasStrides) desc += ' with strides at the end';
      return desc;
    }
    case 'long': {
      let desc = `${dist} ${unit} long run at easy effort`;
      if (distance === 'marathon' && phase === 'specific' && !isFirstOccurrence) {
        desc += ' with marathon effort segments (comfortably hard)';
      }
      if (level === 'beginner' && distanceKm > 6) {
        desc += ' (with walk breaks)';
      }
      return desc;
    }
    case 'tempo': {
      const qualityMin = isFirstOccurrence ? 10 : 20;
      return `Tempo run: ${qualityMin} min at hard effort (short phrases only). Include warm up and cool down.`;
    }
    case 'interval': {
      const reps = isFirstOccurrence ? '3 x 3 min' : '5 x 3 min';
      return `Intervals: ${reps} hard effort (only a few words). Equal jog recovery. Include warm up and cool down.`;
    }
    case 'hill': {
      const reps = isFirstOccurrence ? '4-5 x 20 sec' : '8 x 30 sec';
      return `Hill repeats: ${reps} uphill at hard effort, walk/jog down recovery. Include warm up and cool down.`;
    }
    case 'recovery':
      return `${dist} ${unit} at very easy effort (slowest you can comfortably run)`;
    case 'rest':
      return 'Rest day';
  }
}

// ─── Distance calculation for session types ─────────────────────────

function getQualitySessionDistance(
  runType: RunType,
  level: Level,
  isFirstOccurrence: boolean,
  weeklyVolume: number,
): number {
  // Quality sessions scale with weekly volume to avoid eating too large a share.
  // Target: quality session = ~20-25% of weekly volume (including warm up / cool down).
  const introMultiplier = isFirstOccurrence ? 0.6 : 1;

  // Base distances (for a ~40km week), scaled down for smaller weeks
  const scaleFactor = Math.max(0.5, Math.min(1, weeklyVolume / 40));

  switch (runType) {
    case 'tempo': {
      const base = 7 + (level === 'beginner' ? 0 : 2); // quality portion
      return roundDist((base * scaleFactor * introMultiplier) + 3.5); // + warm up/cool down
    }
    case 'interval': {
      const base = 6 + (level === 'beginner' ? 0 : 2);
      return roundDist((base * scaleFactor * introMultiplier) + 3.5);
    }
    case 'hill':
      return roundDist((6 * scaleFactor * introMultiplier) + 2.5);
    default:
      return roundDist(Math.max(3, weeklyVolume * 0.15));
  }
}

// ─── Main Generator ─────────────────────────────────────────────────

export function generateTrainingPlan(profile: RunnerProfile): TrainingPlan | { error: string } {
  const {
    targetDistance,
    fiveKSeconds,
    experienceLevel,
    daysPerWeek,
    planDurationWeeks,
    restDays,
    useImperial,
  } = profile;

  // Beginner + Marathon guard
  if (experienceLevel === 'beginner' && targetDistance === 'marathon') {
    return {
      error:
        'A marathon requires a solid running base. We recommend starting with a 5K or 10K plan to build your foundation, then progressing to longer distances.',
    };
  }

  // VDOT / pace zones
  let vdot: number | null = null;
  let paceZones: PaceZones | null = null;
  if (fiveKSeconds && fiveKSeconds > 0) {
    vdot = calculateVDOT(fiveKSeconds);
    paceZones = getPaceZones(vdot);
  }

  const phases = getPhases(planDurationWeeks, targetDistance);
  const weeklyData = computeWeeklyVolumes(
    planDurationWeeks,
    experienceLevel,
    daysPerWeek,
    targetDistance,
    phases,
  );

  const trainingDays = getTrainingDays(restDays, daysPerWeek);
  const startDate = getNextMonday();

  // Track first occurrences of quality types
  const firstOccurrence: Record<string, boolean> = {};

  // Long run share — derived from weekly volume each week (not independent progression)
  const longRunShare = Math.min(
    LONG_RUN_SHARE_BY_DAYS[daysPerWeek] ?? 0.35,
    LONG_RUN_SHARE_BY_DISTANCE[targetDistance],
  );

  // Track long run history for spike protection
  const longRunHistory: number[] = [];

  const weeks: TrainingWeek[] = [];

  for (let w = 0; w < planDurationWeeks; w++) {
    const weekNum = w + 1;
    const { volume, phase, isCutback } = weeklyData[w];

    const unlockedTypes = getUnlockedTypes(
      weekNum,
      experienceLevel,
      targetDistance,
      phases,
      isCutback,
    );

    const slots = assignSlots(
      trainingDays,
      daysPerWeek,
      experienceLevel,
      phase,
      isCutback,
      unlockedTypes,
      volume,
    );

    // Calculate long run distance from this week's volume target
    let longRunDist = roundDist(volume * longRunShare);

    // Apply floor
    longRunDist = Math.max(longRunDist, LONG_RUN_FLOOR[experienceLevel]);

    // Apply spike protection (max 15% above longest in past 4 weeks)
    if (longRunHistory.length > 0) {
      const recentMax = Math.max(...longRunHistory.slice(-4));
      const spikeLimit = roundDist(recentMax * 1.15);
      if (longRunDist > spikeLimit && !isCutback && phase !== 'taper') {
        longRunDist = spikeLimit;
      }
    }

    // Marathon long run time cap
    if (targetDistance === 'marathon' && paceZones) {
      const capMinutes = MARATHON_LONG_RUN_CAP[experienceLevel];
      if (capMinutes) {
        const estPace = (paceZones.easy.minPace + paceZones.easy.maxPace) / 2;
        const maxDistFromTime = roundDist((capMinutes * 60) / estPace);
        longRunDist = Math.min(longRunDist, maxDistFromTime);
      }
    }

    longRunHistory.push(longRunDist);

    // Determine quality type for this week
    let primaryQualityType: RunType = 'easy';
    let secondaryQualityType: RunType = 'easy';

    if (phase === 'specific' || (phase === 'base' && unlockedTypes.includes('hill'))) {
      // Pick the most advanced unlocked type
      const qualityTypes = unlockedTypes.filter(
        (t) => t !== 'strides' && t !== 'easy',
      ) as RunType[];
      if (qualityTypes.length > 0) {
        primaryQualityType = qualityTypes[qualityTypes.length - 1];
      }
      if (qualityTypes.length > 1) {
        secondaryQualityType = qualityTypes[qualityTypes.length - 2];
      }
    }

    if (phase === 'taper') {
      // Keep one quality session, shortened
      const qualityTypes = unlockedTypes.filter(
        (t) => t !== 'strides' && t !== 'easy',
      ) as RunType[];
      if (qualityTypes.length > 0) {
        primaryQualityType = qualityTypes[qualityTypes.length - 1];
      }
      secondaryQualityType = 'easy';
    }

    // Build runs for each slot
    const runs: ScheduledRun[] = [];
    const weekStart = addDays(startDate, w * 7);

    // Calculate quality distances (scaled to this week's volume)
    const isFirstPrimary = primaryQualityType !== 'easy' && !firstOccurrence[primaryQualityType];
    let primaryDist = primaryQualityType !== 'easy'
      ? getQualitySessionDistance(primaryQualityType, experienceLevel, isFirstPrimary, volume)
      : 0;
    if (primaryQualityType !== 'easy' && !firstOccurrence[primaryQualityType]) {
      firstOccurrence[primaryQualityType] = true;
    }

    const isFirstSecondary = secondaryQualityType !== 'easy' && !firstOccurrence[secondaryQualityType];
    let secondaryDist = secondaryQualityType !== 'easy'
      ? getQualitySessionDistance(secondaryQualityType, experienceLevel, isFirstSecondary, volume)
      : 0;
    if (secondaryQualityType !== 'easy' && !firstOccurrence[secondaryQualityType]) {
      firstOccurrence[secondaryQualityType] = true;
    }

    // Ensure quality + long run don't exceed ~70% of volume (leave room for easy runs)
    const fixedVolume = primaryDist + secondaryDist + longRunDist;
    if (fixedVolume > volume * 0.75 && primaryDist > 0) {
      const scale = (volume * 0.7) / fixedVolume;
      primaryDist = roundDist(primaryDist * scale);
      secondaryDist = roundDist(secondaryDist * scale);
      longRunDist = roundDist(longRunDist * scale);
      longRunDist = Math.max(longRunDist, LONG_RUN_FLOOR[experienceLevel]);
    }

    // Remaining volume for easy/recovery runs
    const qualityVolume = primaryDist + secondaryDist + longRunDist;
    const remainingVolume = Math.max(0, volume - qualityVolume);
    const easySlots = slots.filter(
      (s) => s.role === 'easy' || s.role === 'recovery',
    );
    const easyDistEach =
      easySlots.length > 0 ? remainingVolume / easySlots.length : 0;

    // Check strides eligibility
    const hasStrides = unlockedTypes.includes('strides');
    let stridesAssigned = false;

    for (const slot of slots) {
      const date = addDays(weekStart, slot.dayOfWeek);
      let runType: RunType;
      let distanceKm: number;
      let paceMin: number | null = null;
      let paceMax: number | null = null;
      let isFirst = false;
      let addStrides = false;

      switch (slot.role) {
        case 'long':
          runType = 'long';
          distanceKm = longRunDist;
          if (paceZones) {
            paceMin = paceZones.easy.minPace;
            paceMax = paceZones.easy.maxPace;
          }
          break;
        case 'quality1':
          runType = primaryQualityType;
          distanceKm = primaryDist;
          isFirst = isFirstPrimary;
          if (paceZones && runType !== 'hill') {
            const zone = runType === 'tempo' ? paceZones.threshold :
              runType === 'interval' ? paceZones.interval : paceZones.easy;
            paceMin = zone.minPace;
            paceMax = zone.maxPace;
          }
          break;
        case 'quality2':
          runType = secondaryQualityType;
          distanceKm = secondaryDist;
          isFirst = isFirstSecondary;
          if (paceZones && runType !== 'hill') {
            const zone = runType === 'tempo' ? paceZones.threshold :
              runType === 'interval' ? paceZones.interval : paceZones.easy;
            paceMin = zone.minPace;
            paceMax = zone.maxPace;
          }
          break;
        case 'recovery':
          runType = 'recovery';
          distanceKm = Math.min(roundDist(easyDistEach), 5);
          if (paceZones) {
            paceMin = paceZones.easy.minPace;
            paceMax = paceZones.easy.maxPace;
          }
          break;
        default: // easy
          runType = 'easy';
          distanceKm = roundDist(Math.min(easyDistEach, EASY_CAP[experienceLevel]));
          if (hasStrides && !stridesAssigned) {
            addStrides = true;
            stridesAssigned = true;
            distanceKm = roundDist(distanceKm + 0.5); // strides add ~0.5km
          }
          if (paceZones) {
            paceMin = paceZones.easy.minPace;
            paceMax = paceZones.easy.maxPace;
          }
          break;
      }

      // Ensure minimum distance for running slots
      if (runType !== 'rest' && distanceKm < 1.5) {
        distanceKm = 1.5;
      }

      // Estimate duration
      const avgPace = paceZones
        ? (paceZones.easy.minPace + paceZones.easy.maxPace) / 2
        : experienceLevel === 'beginner' ? 420 : experienceLevel === 'intermediate' ? 360 : 330;
      const estimatedDurationMinutes = Math.round((distanceKm * avgPace) / 60);

      const desc = paceZones
        ? getDescription(
            runType, distanceKm, paceZones, useImperial,
            experienceLevel, targetDistance, phase, weekNum, isFirst, addStrides,
          )
        : getEffortDescription(
            runType, distanceKm, useImperial,
            experienceLevel, targetDistance, phase, isFirst, addStrides,
          );

      runs.push({
        id: uuid(),
        date: isoDate(date),
        weekNumber: weekNum,
        dayOfWeek: slot.dayOfWeek,
        runType,
        distanceKm: roundDist(distanceKm),
        paceMin,
        paceMax,
        estimatedDurationMinutes,
        description: desc,
        tips: getTips(runType, experienceLevel, targetDistance, phase, weekNum, distanceKm, addStrides),
        completed: false,
        phase,
      });
    }

    // Add rest days
    const runDays = new Set(slots.map((s) => s.dayOfWeek));
    for (let d = 0; d < 7; d++) {
      if (!runDays.has(d)) {
        const date = addDays(weekStart, d);
        runs.push({
          id: uuid(),
          date: isoDate(date),
          weekNumber: weekNum,
          dayOfWeek: d,
          runType: 'rest',
          distanceKm: 0,
          paceMin: null,
          paceMax: null,
          estimatedDurationMinutes: 0,
          description: 'Rest day',
          tips: getTips('rest', experienceLevel, targetDistance, phase, weekNum, 0, false),
          completed: false,
          phase,
        });
      }
    }

    // Sort by day of week
    runs.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    weeks.push({
      weekNumber: weekNum,
      phase,
      isCutback,
      targetVolumeKm: volume, // use the planned progression volume
      runs,
    });
  }

  return {
    id: uuid(),
    createdAt: new Date().toISOString(),
    targetDistance,
    fiveKSeconds,
    experienceLevel,
    daysPerWeek,
    planDurationWeeks,
    restDays,
    useImperial,
    paceZones,
    weeks,
    startDate: isoDate(startDate),
    extraRuns: [],
  };
}

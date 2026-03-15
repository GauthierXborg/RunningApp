/**
 * VDOT Pace Calculator
 * Based on Jack Daniels' VDOT tables.
 * Calculates training paces from a 5K race time.
 */

export interface PaceZones {
  easy: { minPace: number; maxPace: number };
  marathon: { minPace: number; maxPace: number };
  threshold: { minPace: number; maxPace: number };
  interval: { minPace: number; maxPace: number };
  repetition: { minPace: number; maxPace: number };
}

// --- 1. VDOT from 5K time ---

export function calculateVDOT(fiveKSeconds: number): number {
  const t = fiveKSeconds / 60; // race time in minutes
  const v = 5000 / t; // velocity in metres per minute
  const VO2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const pctVO2max =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * t) +
    0.2989558 * Math.exp(-0.1932605 * t);
  return VO2 / pctVO2max;
}

// --- 2. VDOT lookup table ---
// Each entry: [vdot, easyMin, easyMax, marathon, threshold, interval, repetition]
// All paces in seconds per km.

type VDOTEntry = [number, number, number, number, number, number, number];

const VDOT_TABLE: VDOTEntry[] = [
  // VDOT, EasyMin, EasyMax, Marathon, Threshold, Interval, Repetition
  [30, 445, 480, 405, 375, 340, 320],
  [32, 425, 460, 390, 360, 325, 305],
  [34, 410, 440, 375, 345, 312, 293],
  [36, 395, 425, 360, 332, 300, 282],
  [38, 380, 410, 347, 320, 289, 272],
  [40, 367, 397, 335, 308, 278, 262],
  [42, 355, 385, 323, 298, 269, 253],
  [44, 343, 373, 312, 288, 260, 245],
  [46, 332, 362, 302, 279, 252, 237],
  [48, 322, 352, 293, 270, 244, 230],
  [50, 312, 342, 284, 262, 237, 223],
  [52, 303, 332, 276, 255, 230, 217],
  [54, 295, 323, 268, 248, 224, 211],
  [56, 287, 315, 261, 241, 218, 205],
  [58, 279, 307, 254, 235, 212, 200],
  [60, 272, 300, 248, 229, 207, 195],
  [63, 261, 288, 238, 220, 199, 187],
  [66, 251, 277, 229, 212, 191, 180],
  [70, 238, 264, 218, 201, 182, 171],
  [75, 223, 248, 204, 189, 171, 161],
  [80, 210, 234, 192, 178, 161, 152],
  [85, 198, 222, 181, 168, 152, 143],
];

// --- 3. Interpolation ---

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateEntry(
  low: VDOTEntry,
  high: VDOTEntry,
  vdot: number,
): [number, number, number, number, number, number] {
  const t = (vdot - low[0]) / (high[0] - low[0]);
  return [
    lerp(low[1], high[1], t),
    lerp(low[2], high[2], t),
    lerp(low[3], high[3], t),
    lerp(low[4], high[4], t),
    lerp(low[5], high[5], t),
    lerp(low[6], high[6], t),
  ];
}

// --- 4. Round pace to nearest 5 seconds ---

export function roundPace(seconds: number): number {
  return Math.round(seconds / 5) * 5;
}

// --- 5. Get pace zones from VDOT ---

export function getPaceZones(vdot: number): PaceZones {
  // Clamp to table range
  const clamped = Math.max(VDOT_TABLE[0][0], Math.min(vdot, VDOT_TABLE[VDOT_TABLE.length - 1][0]));

  // Find surrounding entries
  let lowIdx = 0;
  for (let i = 0; i < VDOT_TABLE.length - 1; i++) {
    if (VDOT_TABLE[i + 1][0] >= clamped) {
      lowIdx = i;
      break;
    }
  }
  const highIdx = Math.min(lowIdx + 1, VDOT_TABLE.length - 1);
  const [easyMin, easyMax, marathon, threshold, interval, repetition] =
    lowIdx === highIdx
      ? [
          VDOT_TABLE[lowIdx][1],
          VDOT_TABLE[lowIdx][2],
          VDOT_TABLE[lowIdx][3],
          VDOT_TABLE[lowIdx][4],
          VDOT_TABLE[lowIdx][5],
          VDOT_TABLE[lowIdx][6],
        ]
      : interpolateEntry(VDOT_TABLE[lowIdx], VDOT_TABLE[highIdx], clamped);

  return {
    easy: { minPace: roundPace(easyMin), maxPace: roundPace(easyMax) },
    marathon: { minPace: roundPace(marathon - 8), maxPace: roundPace(marathon + 8) },
    threshold: { minPace: roundPace(threshold - 5), maxPace: roundPace(threshold + 5) },
    interval: { minPace: roundPace(interval - 5), maxPace: roundPace(interval + 5) },
    repetition: { minPace: roundPace(repetition - 5), maxPace: roundPace(repetition + 5) },
  };
}

// --- 6. Format pace for display ---

export function formatPace(secondsPerKm: number, imperial: boolean): string {
  let value = secondsPerKm;
  if (imperial) {
    value = secondsPerKm * 1.60934; // convert sec/km to sec/mile
  }
  const mins = Math.floor(value / 60);
  const secs = Math.round(value % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatPaceRange(
  minPace: number,
  maxPace: number,
  imperial: boolean,
): string {
  const unit = imperial ? '/mi' : '/km';
  return `${formatPace(minPace, imperial)} to ${formatPace(maxPace, imperial)}${unit}`;
}

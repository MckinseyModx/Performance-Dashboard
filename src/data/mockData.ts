import type { WeeklyRecord } from "../types";

// Deterministic PRNG (mulberry32) so the demo dataset is stable across reloads.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_TRADES = [
  "Pipe",
  "Structural",
  "Electrical",
  "Paint & Sound Dampening",
  "Sheetmetal",
  "OSM",
];

const BOATS = ["Boat 1", "Boat 2", "Boat 3", "Boat 4", "Boat 5"];
const MODULES = ["1", "2", "3", "4", "5", "6"];

const SUPERVISORS_BY_TRADE: Record<string, string[]> = {
  Pipe: ["M. Alvarez", "J. Cho"],
  Structural: ["R. Whitfield", "T. Boudreaux"],
  Electrical: ["S. Okafor", "D. Lindgren"],
  "Paint & Sound Dampening": ["K. Marsh"],
  Sheetmetal: ["P. Nakamura"],
  OSM: ["A. Delgado"],
};

const WORK_PACKAGES_BY_TRADE: Record<string, string[]> = {
  Pipe: ["WP-M4-PIP-01", "WP-M4-PIP-02", "WP-M4-PIP-03"],
  Structural: ["WP-M4-STR-01", "WP-M4-STR-02"],
  Electrical: ["WP-M4-ELE-01", "WP-M4-ELE-02"],
  "Paint & Sound Dampening": ["WP-M4-PSD-01"],
  Sheetmetal: ["WP-M4-SHT-01"],
  OSM: ["WP-M4-OSM-01"],
};

const KEY_AREAS = ["Engine Room", "Deckhouse", "Bridge", "Aft Peak", "Forward Compartment", "Main Deck"];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

function isoMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function weeksAgo(n: number, from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n * 7);
  return d;
}

/**
 * Generates a realistic mock dataset for Module 4 across the last `weekCount`
 * weeks. Each trade/supervisor pair runs a Day and Night crew per boat.
 * Swap this out for real data via the CSV import once available.
 */
export function generateMockData(weekCount = 12, trades: string[] = DEFAULT_TRADES): WeeklyRecord[] {
  const rand = mulberry32(20260810);
  const records: WeeklyRecord[] = [];
  const today = new Date();

  // Give each supervisor+boat combo a persistent "skill level" so trends look real
  // instead of pure noise, and a starting % complete that climbs week over week.
  const baseline = new Map<string, { skill: number; startPct: number; module: string }>();

  for (let w = weekCount - 1; w >= 0; w--) {
    const week = isoMonday(weeksAgo(w, today));

    for (const hull of BOATS) {
      for (const trade of trades) {
        const supervisors = SUPERVISORS_BY_TRADE[trade] ?? [`${trade} Supervisor`];
        const workPackages = WORK_PACKAGES_BY_TRADE[trade] ?? [`WP-M4-${trade.slice(0, 3).toUpperCase()}-01`];

        supervisors.forEach((supervisor, sIdx) => {
          (["Day", "Night"] as const).forEach((shift) => {
            const crew = `${trade.slice(0, 3).toUpperCase()}-${shift[0]}${sIdx + 1}`;
            const key = `${hull}__${supervisor}__${crew}`;

            if (!baseline.has(key)) {
              baseline.set(key, {
                skill: 0.62 + rand() * 0.30, // ~0.77 avg performance factor (earned / actual)
                startPct: 8 + rand() * 12,
                module: MODULES[Math.floor(rand() * MODULES.length)],
              });
            }
            const base = baseline.get(key)!;

            const crewSize = shift === "Day" ? 6 + Math.floor(rand() * 8) : 4 + Math.floor(rand() * 6);
            const weeksElapsed = weekCount - 1 - w;
            const targetPercentComplete = Math.min(98, base.startPct + weeksElapsed * (5 + rand() * 1.5));
            const driftNoise = (rand() - 0.5) * 8;
            const actualPercentComplete = Math.max(
              0,
              Math.min(100, targetPercentComplete + driftNoise * (2 - base.skill))
            );

            const budgetedHours = crewSize * (32 + rand() * 8);
            const actualHours = budgetedHours * (0.85 + rand() * 0.3);
            const earnedHours = actualHours * base.skill * (0.95 + rand() * 0.1);

            const inspectionsPerformed = 2 + Math.floor(rand() * 6);
            const rejectionChance = base.skill < 0.8 ? 0.28 : 0.08;
            const inspectionsRejected = Array.from({ length: inspectionsPerformed }).filter(
              () => rand() < rejectionChance
            ).length;

            const safetyIncidents = rand() < 0.04 ? 1 : 0;

            // Order-level detail (approximate for sample data -- each row here
            // represents one crew/week, whereas real CSV imports are one row
            // per actual work order, so Insights will be far more granular
            // once real data is loaded).
            const delayFactor = 2 - base.skill; // lower skill -> more slippage
            const planLeadDays = 20 + rand() * 70;
            const mfgPlan = addDays(week, -planLeadDays);
            const cutLagDays = (5 + rand() * 15) * delayFactor;
            const mfgCut = addDays(mfgPlan, cutLagDays);
            const actionCutLagDays = (1 + rand() * 9) * delayFactor;
            const actionCut = addDays(mfgCut, actionCutLagDays);
            const mfgDueDate = addDays(mfgPlan, 45 + rand() * 75);
            const actionDue = addDays(mfgDueDate, rand() * 10);
            const remainingPct = Math.max(0, 100 - actualPercentComplete);
            const estimatedCompletionDate = addDays(week, remainingPct * (2 + delayFactor));
            const isComplete = actualPercentComplete >= 100;

            records.push({
              id: `${key}__${week}`,
              week,
              hull,
              module: base.module,
              trade,
              supervisor,
              shift,
              crew,
              workPackage: workPackages[Math.floor(rand() * workPackages.length)],
              crewSize,
              targetPercentComplete: Math.round(targetPercentComplete * 10) / 10,
              actualPercentComplete: Math.round(actualPercentComplete * 10) / 10,
              budgetedHours: Math.round(budgetedHours),
              earnedHours: Math.round(earnedHours),
              actualHours: Math.round(actualHours),
              inspectionsPerformed,
              inspectionsRejected,
              safetyIncidents,
              orderNumber: `${100000 + Math.floor(rand() * 89999)}`,
              activityNumber: `${Math.floor(rand() * 9 + 1) * 10}`.padStart(3, "0"),
              partNumber: `P-${80000 + Math.floor(rand() * 19999)}`,
              groupCode: `G${(1 + Math.floor(rand() * 20)).toString().padStart(2, "0")}`,
              plnrInitials: ["JS", "RW", "SO", "KM", "PN", "AD"][Math.floor(rand() * 6)],
              keyEvent: `K-EVT-${1 + Math.floor(rand() * 3)}`,
              keyArea: KEY_AREAS[Math.floor(rand() * KEY_AREAS.length)],
              mfgPlan,
              mfgCut,
              mfgStatus: isComplete ? "Complete" : "In Work",
              mfgDueDate,
              actionCut,
              actionStatus: isComplete ? "Closed" : "Open",
              actionDue,
              estimatedCompletionDate,
              mfgCode: `MC-${(1 + Math.floor(rand() * 6)).toString().padStart(2, "0")}`,
            });
          });
        });
      }
    }
  }

  return records;
}

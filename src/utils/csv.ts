import Papa from "papaparse";
import type { WeeklyRecord } from "../types";

// Expected CSV headers (case-insensitive, flexible order):
// week, hull (or boat), module (or area), trade, supervisor, shift, crew, workPackage, crewSize,
// targetPercentComplete, actualPercentComplete, budgetedHours, earnedHours,
// actualHours, inspectionsPerformed, inspectionsRejected, safetyIncidents
//
// "module" accepts legacy "area" column name.

const REQUIRED_COLUMNS = [
  "week",
  "hull",
  "trade",
  "supervisor",
  "crew",
  "crewSize",
  "targetPercentComplete",
  "actualPercentComplete",
  "budgetedHours",
  "earnedHours",
  "actualHours",
];

export interface CsvParseResult {
  records: WeeklyRecord[];
  errors: string[];
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function findKey(row: Record<string, unknown>, name: string): string | undefined {
  const lower = name.toLowerCase();
  return Object.keys(row).find((k) => k.trim().toLowerCase() === lower);
}

export function parseCsv(csvText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const errors: string[] = parsed.errors.map((e) => `Row ${e.row ?? "?"}: ${e.message}`);

  if (parsed.data.length === 0) {
    return { records: [], errors: [...errors, "No data rows found in file."] };
  }

  const headerKeys = Object.keys(parsed.data[0]);
  const missing = REQUIRED_COLUMNS.filter((col) => {
    if (col === "hull") {
      return !headerKeys.some((k) => {
        const normalized = k.trim().toLowerCase();
        return normalized === "hull" || normalized === "boat";
      });
    }
    return !headerKeys.some((k) => k.trim().toLowerCase() === col.toLowerCase());
  });
  if (missing.length > 0) {
    errors.push(`Missing expected column(s): ${missing.join(", ")}`);
  }

  const records: WeeklyRecord[] = parsed.data.map((row, index) => {
    const get = (name: string): string => {
      const key = findKey(row, name);
      return key ? String(row[key] ?? "").trim() : "";
    };

    const shiftRaw = get("shift");
    const shift: "Day" | "Night" = shiftRaw.toLowerCase().startsWith("n") ? "Night" : "Day";

    const getOpt = (name: string): string | undefined => {
      const v = get(name);
      return v === "" ? undefined : v;
    };

    return {
      id: `csv-${index}-${get("week")}-${get("hull")}-${get("trade")}-${get("crew")}`,
      week: get("week"),
      hull: get("hull") || get("boat"),
      module: get("module") || get("area") || "",
      trade: get("trade"),
      supervisor: get("supervisor"),
      shift,
      crew: get("crew"),
      workPackage: get("workPackage") || get("work package") || "",
      crewSize: num(get("crewSize"), 1),
      targetPercentComplete: num(get("targetPercentComplete")),
      actualPercentComplete: num(get("actualPercentComplete")),
      budgetedHours: num(get("budgetedHours")),
      earnedHours: num(get("earnedHours")),
      actualHours: num(get("actualHours")),
      inspectionsPerformed: num(get("inspectionsPerformed")),
      inspectionsRejected: num(get("inspectionsRejected")),
      safetyIncidents: num(get("safetyIncidents")),
      orderNumber: getOpt("orderNumber") ?? getOpt("order number"),
      activityNumber: getOpt("activityNumber") ?? getOpt("activity number"),
      partNumber: getOpt("partNumber") ?? getOpt("part number"),
      groupCode: getOpt("groupCode") ?? getOpt("group code"),
      plnrInitials: getOpt("plnrInitials") ?? getOpt("plnr initials"),
      keyEvent: getOpt("keyEvent") ?? getOpt("key event"),
      keyArea: getOpt("keyArea") ?? getOpt("key area"),
      mfgPlan: getOpt("mfgPlan") ?? getOpt("mfg plan"),
      mfgCut: getOpt("mfgCut") ?? getOpt("mfg cut"),
      mfgStatus: getOpt("mfgStatus") ?? getOpt("mfg status"),
      mfgDueDate: getOpt("mfgDueDate") ?? getOpt("mfg due date"),
      actionCut: getOpt("actionCut") ?? getOpt("action cut"),
      actionStatus: getOpt("actionStatus") ?? getOpt("action status"),
      actionDue: getOpt("actionDue") ?? getOpt("action due"),
      estimatedCompletionDate: getOpt("estimatedCompletionDate") ?? getOpt("estimated completion date"),
      mfgCode: getOpt("mfgCode") ?? getOpt("mfg code"),
    };
  });

  return { records, errors };
}

export function downloadSampleCsvTemplate(): string {
  const header = [
    "week",
    "hull",
    "module",
    "trade",
    "supervisor",
    "shift",
    "crew",
    "workPackage",
    "crewSize",
    "targetPercentComplete",
    "actualPercentComplete",
    "budgetedHours",
    "earnedHours",
    "actualHours",
    "inspectionsPerformed",
    "inspectionsRejected",
    "safetyIncidents",
    "orderNumber",
    "activityNumber",
    "partNumber",
    "groupCode",
    "plnrInitials",
    "keyEvent",
    "keyArea",
    "mfgPlan",
    "mfgCut",
    "mfgStatus",
    "mfgDueDate",
    "actionCut",
    "actionStatus",
    "actionDue",
    "estimatedCompletionDate",
    "mfgCode",
  ];
  const example = [
    "2026-08-03",
    "Boat 1",
    "3",
    "Pipe",
    "M. Alvarez",
    "Day",
    "PIP-D1",
    "WP-M4-PIP-01",
    "8",
    "42",
    "40",
    "320",
    "290",
    "310",
    "5",
    "1",
    "0",
    "100234",
    "010",
    "P-88213",
    "G12",
    "JS",
    "K-EVT-1",
    "Engine Room",
    "2026-05-01",
    "2026-05-05",
    "In Work",
    "2026-08-15",
    "2026-05-10",
    "Open",
    "2026-08-20",
    "2026-08-18",
    "MC-04",
  ];
  return `${header.join(",")}\n${example.join(",")}\n`;
}

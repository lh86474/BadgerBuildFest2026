import { emptyData, scoped, type HealthData } from "./health";
import {
  validateDaily,
  validateLab,
  validateMedication,
} from "./tracking-validation";

export function getHealthStorageKey(userId?: string | null): string {
  if (userId && userId !== "local-user") {
    return `pcos-tracking:v1:${userId}`;
  }
  return "pcos-tracking:v1:guest";
}

export const healthStorageKey = "pcos-tracking:v1";

export function mergeWithBaselineData(stored: HealthData): HealthData {
  if (!stored || !Array.isArray(stored.logs)) return emptyData(stored?.user?.id);
  return stored;
}

export function parseStoredHealthData(
  raw: string | null,
  userId?: string | null
): {
  data: HealthData | null;
  invalid: boolean;
} {
  if (!raw) return { data: null, invalid: false };

  try {
    const parsed = JSON.parse(raw) as HealthData;
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.logs) ||
      !Array.isArray(parsed.medications) ||
      !Array.isArray(parsed.labs)
    ) {
      throw new Error("Invalid stored health data structure");
    }

    // Filter valid entries instead of discarding the entire dataset on a single field discrepancy
    const safeLogs = parsed.logs.filter((log) => !validateDaily(log));
    const safeMeds = parsed.medications.filter((med) => !validateMedication(med));
    const safeLabs = parsed.labs.filter((lab) => !validateLab(lab));

    const cleaned: HealthData = {
      ...parsed,
      user: {
        id: userId || parsed.user?.id || "local-user",
        name: parsed.user?.name || "",
      },
      logs: safeLogs.length > 0 ? safeLogs : parsed.logs,
      medications: safeMeds,
      labs: safeLabs,
    };

    return { data: scoped(cleaned), invalid: false };
  } catch {
    return { data: null, invalid: true };
  }
}

export function getInitialOrStoredHealthData(userId?: string | null): HealthData {
  const fallback = emptyData(userId || "local-user");
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const key = getHealthStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = parseStoredHealthData(raw, userId);
    return parsed.data ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveHealthDataLocally(data: HealthData, userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = getHealthStorageKey(userId || data.user?.id);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}


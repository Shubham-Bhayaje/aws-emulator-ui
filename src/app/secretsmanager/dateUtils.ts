/**
 * src/app/secretsmanager/dateUtils.ts – Safe deterministic UTC date formatting.
 * Prevents SSR vs client hydration mismatches across environments.
 */

export function formatSmDate(dateInput?: Date | string | number): string {
  if (!dateInput) return "-";
  try {
    const d = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    const seconds = String(d.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  } catch {
    return String(dateInput);
  }
}

export function calculateDaysRemaining(deletionDateStr?: string | Date): number {
  if (!deletionDateStr) return 0;
  try {
    const d = typeof deletionDateStr === "object" ? deletionDateStr : new Date(deletionDateStr);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  } catch {
    return 0;
  }
}

/**
 * src/app/systems-manager/parameter-store/dateUtils.ts – Safe deterministic UTC date formatting.
 * Avoids SSR vs client hydration discrepancies.
 */

export function formatSsmDate(dateInput?: Date | string | number): string {
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

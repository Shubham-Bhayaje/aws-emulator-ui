/**
 * Deterministic UTC date formatter for AWS RAM console components.
 * Prevents Next.js / React SSR hydration mismatch across different timezones and locales.
 */
export function formatRAMDate(isoString?: string): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "-";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const mins = String(d.getUTCMinutes()).padStart(2, "0");
    const secs = String(d.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${mins}:${secs} UTC`;
  } catch {
    return "-";
  }
}

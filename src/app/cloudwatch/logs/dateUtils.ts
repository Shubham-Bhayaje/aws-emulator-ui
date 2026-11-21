/**
 * Deterministic UTC date formatter for CloudWatch Logs.
 * Prevents Next.js / React SSR hydration mismatch across different timezones and locales.
 */
export function formatLogDate(timestamp?: number | string | Date): string {
  if (!timestamp) return "-";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "-";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const mins = String(d.getUTCMinutes()).padStart(2, "0");
    const secs = String(d.getUTCSeconds()).padStart(2, "0");
    const millis = String(d.getUTCMilliseconds()).padStart(3, "0");
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}.${millis} UTC`;
  } catch {
    return "-";
  }
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0) return `${bytes} B`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i] || "B"}`;
}

export function formatRetention(days?: number): string {
  if (!days || days <= 0) return "Never expire";
  if (days === 1) return "1 day (24 hours)";
  if (days === 7) return "1 week (7 days)";
  if (days === 14) return "2 weeks (14 days)";
  if (days === 30) return "1 month (30 days)";
  if (days === 60) return "2 months (60 days)";
  if (days === 90) return "3 months (90 days)";
  if (days === 120) return "4 months (120 days)";
  if (days === 150) return "5 months (150 days)";
  if (days === 180) return "6 months (180 days)";
  if (days === 365) return "1 year (365 days)";
  if (days === 400) return "13 months (400 days)";
  if (days === 545) return "18 months (545 days)";
  if (days === 730 || days === 731) return "2 years (730 days)";
  if (days === 1096) return "3 years (1096 days)";
  if (days === 1826 || days === 1827) return "5 years (1827 days)";
  if (days === 2192) return "6 years (2192 days)";
  if (days === 2557) return "7 years (2557 days)";
  if (days === 2922) return "8 years (2922 days)";
  if (days === 3288) return "9 years (3288 days)";
  if (days === 3653) return "10 years (3653 days)";
  return `${days} days`;
}

/**
 * Deterministic date formatter for AWS Console components.
 * Formats dates consistently across SSR and client hydration to prevent React 19 hydration mismatches.
 * Zero emojis.
 */

export function formatDateTime(isoString?: string | Date | null): string {
  if (!isoString) return "-";
  try {
    const d = typeof isoString === "string" ? new Date(isoString) : isoString;
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

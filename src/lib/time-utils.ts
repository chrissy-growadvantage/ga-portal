/** Format seconds into HH:MM:SS */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Format seconds into a human-readable short string like "1h 23m" */
export function formatDurationShort(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${seconds}s`;
}

/** Format seconds to decimal hours (e.g. 5400 → "1.50") */
export function formatDecimalHours(seconds: number): string {
  return (seconds / 3600).toFixed(2);
}

/** Calculate duration_seconds between two ISO date strings */
export function calcDurationSeconds(startedAt: string, endedAt: string): number {
  return Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
}

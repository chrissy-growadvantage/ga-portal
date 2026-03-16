export type HealthStatus = 'critical' | 'warning' | 'healthy';

export const HEALTH_THRESHOLDS = {
  CRITICAL: -0.5,  // 50% decline
  WARNING: -0.2,   // 20% decline
} as const;

export function calculateHealthStatus(
  activeUsers: number,
  previousPeriodUsers?: number
): HealthStatus {
  if (!previousPeriodUsers || previousPeriodUsers === 0) return 'healthy';
  const change = (activeUsers - previousPeriodUsers) / previousPeriodUsers;
  if (change < HEALTH_THRESHOLDS.CRITICAL) return 'critical';
  if (change < HEALTH_THRESHOLDS.WARNING) return 'warning';
  return 'healthy';
}

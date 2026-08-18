/**
 * NIMANTRAN AI — DEVICE PERFORMANCE PROFILER
 * Determines appropriate quality tiers: HIGH, MEDIUM, LOW, REDUCED_MOTION
 */

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'REDUCED_MOTION';

export const getDeviceQualityTier = (): QualityTier => {
  if (typeof window === 'undefined') return 'MEDIUM';

  // 1. Reduced Motion Preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return 'REDUCED_MOTION';

  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const cores = (navigator as any).hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4; // GB

  // 2. Low-tier mobile devices
  if (width < 640 && (cores < 4 || memory < 3)) {
    return 'LOW';
  }

  // 3. Medium-tier mobile / tablet
  if (width < 1024 || cores <= 4 || memory <= 4 || dpr > 2.5) {
    return 'MEDIUM';
  }

  // 4. High-end desktop
  return 'HIGH';
};

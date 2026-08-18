/**
 * NIMANTRAN AI — CINEMATIC MOTION TOKENS
 * Centralized motion durations, cubic-bezier easings, and spring transitions.
 */

export const MOTION_DURATIONS = {
  instant: 0.1,
  micro: 0.2,
  normal: 0.4,
  medium: 0.6,
  hero: 1.0,
  envelope: 1.8,
  transition: 1.2,
};

export const MOTION_EASINGS = {
  // Custom natural physical easing curves
  smoothOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  elegantInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  cardRise: 'cubic-bezier(0.25, 1, 0.5, 1)',
  anticipate: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  overshoot: 'cubic-bezier(0.34, 1.3, 0.64, 1)',
  flapOpen: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const SPRING_CONFIGS = {
  tactile: { tension: 280, friction: 20 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 350, friction: 28 },
};

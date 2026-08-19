/**
 * Nimantran AI — Procedural Web Audio Sound Engine
 * Generates tactile physical unboxing sound effects with zero external MP3 latency.
 */

export const playUnboxingSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1. Sub-bass physical tactile boom (120Hz -> 20Hz)
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(120, ctx.currentTime);
    boom.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.8);
    boomGain.gain.setValueAtTime(0.85, ctx.currentTime);
    boomGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start();
    boom.stop(ctx.currentTime + 1.8);

    // 2. Pentatonic Royal Chimes (C5, E5, G5, C6, E6)
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      chimeGain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 1.2);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(ctx.currentTime + i * 0.08);
      chime.stop(ctx.currentTime + i * 0.08 + 1.2);
    });
  } catch (e) {
    // Graceful fallback on restrictive browsers
  }
};

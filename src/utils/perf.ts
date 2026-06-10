// Lightweight device performance tier used to scale the immersive 3D scene.
// Mobile / low-power devices get fewer lights, no shadows, lower pixel density
// and a thinner decoration set so the board stays smooth. Desktop stays rich.

function detectLowPerf(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);

  // Coarse pointer (touch) on a smallish screen is a strong mobile signal.
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 820;

  // Few logical cores is a decent low-power heuristic.
  const fewCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 6;

  return isMobileUA || (coarse && smallScreen) || (coarse && fewCores);
}

// Computed once at module load — device class doesn't change mid-session.
export const LOW_PERF: boolean = detectLowPerf();

// Scale a decoration count down on low-power devices.
export function qty(full: number, lowFactor = 0.45): number {
  return LOW_PERF ? Math.max(1, Math.round(full * lowFactor)) : full;
}

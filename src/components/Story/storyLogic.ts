// Pure story-mode puzzle logic — extracted so it can be unit-tested in
// milliseconds instead of driving the 3D scenes end-to-end.

/** Clock arithmetic on a 12-house circle: where does start + add land? */
export function clockAnswer(start: number, add: number): number {
  const a = (start + add) % 12;
  return a === 0 ? 12 : a;
}

/** Caesar-shift uppercase text forward by k (non-letters untouched). */
export function caesarEncode(text: string, k: number): string {
  return text.replace(/[A-Z]/g, (ch) =>
    String.fromCharCode(((ch.charCodeAt(0) - 65 + (k % 26) + 26) % 26) + 65)
  );
}

/** Undo a Caesar shift of k. */
export function caesarDecode(text: string, k: number): string {
  return caesarEncode(text, -k);
}

/**
 * Nullhaven balance semantics: your balance is the sum of the stones
 * currently behind you. Forward hops add the stone you land on; backward
 * hops subtract the stone you leave; lateral hops swap footing.
 */
export function hopBalance(
  balance: number,
  move:
    | { kind: 'forward'; landedValue: number }
    | { kind: 'backward'; departedValue: number }
    | { kind: 'lateral'; departedValue: number; landedValue: number }
): number {
  switch (move.kind) {
    case 'forward':
      return balance + move.landedValue;
    case 'backward':
      return balance - move.departedValue;
    case 'lateral':
      return balance - move.departedValue + move.landedValue;
  }
}

/** Which hour-house wedge a plaza position is in (or null near the center). */
export function houseAt(x: number, z: number, minRadius = 8.2): number | null {
  if (Math.hypot(x, z) <= minRadius) return null;
  let deg = (Math.atan2(x, -z) * 180) / Math.PI; // 0° = north, clockwise
  if (deg < 0) deg += 360;
  const hour = Math.round(deg / 30) % 12;
  return hour === 0 ? 12 : hour;
}

import { describe, it, expect } from 'vitest';
import { clockAnswer, caesarEncode, caesarDecode, hopBalance, houseAt } from '../storyLogic';

describe('clockAnswer (mod-12 with 12 instead of 0)', () => {
  it('wraps past twelve', () => {
    expect(clockAnswer(9, 6)).toBe(3);
    expect(clockAnswer(11, 5)).toBe(4);
  });
  it('a full turn changes nothing', () => {
    expect(clockAnswer(8, 12)).toBe(8);
    expect(clockAnswer(12, 24)).toBe(12);
  });
  it('lands on 12, not 0', () => {
    expect(clockAnswer(7, 5)).toBe(12);
    expect(clockAnswer(12, 12)).toBe(12);
  });
  it('winds backward for negative hours', () => {
    expect(clockAnswer(2, -5)).toBe(9);
    expect(clockAnswer(1, -1)).toBe(12);
    expect(clockAnswer(3, -15)).toBe(12);
  });
});

describe('caesar cipher', () => {
  it('round-trips', () => {
    expect(caesarDecode(caesarEncode('THE HOURS TURN', 3), 3)).toBe('THE HOURS TURN');
  });
  it('matches the chapter-2 gate seal', () => {
    expect(caesarEncode('THE HOURS TURN', 3)).toBe('WKH KRXUV WXUQ');
  });
  it('only decodes at the right shift', () => {
    const sealed = caesarEncode('THE HOURS TURN', 3);
    for (let k = 0; k < 26; k++) {
      if (k === 3) continue;
      expect(caesarDecode(sealed, k)).not.toBe('THE HOURS TURN');
    }
  });
  it('leaves spaces and punctuation alone', () => {
    expect(caesarEncode('A-B C', 1)).toBe('B-C D');
  });
});

describe('hopBalance (Nullhaven sum semantics)', () => {
  it('forward hops add', () => {
    expect(hopBalance(0, { kind: 'forward', landedValue: 4 })).toBe(4);
    expect(hopBalance(4, { kind: 'forward', landedValue: -7 })).toBe(-3);
  });
  it('backward hops undo the departed stone', () => {
    expect(hopBalance(4, { kind: 'backward', departedValue: 4 })).toBe(0);
  });
  it('lateral hops swap footing', () => {
    expect(hopBalance(4, { kind: 'lateral', departedValue: 4, landedValue: 1 })).toBe(1);
  });
  it('the intended zero path balances', () => {
    let b = 0;
    for (const v of [4, -7, 5, -2, 0]) b = hopBalance(b, { kind: 'forward', landedValue: v });
    expect(b).toBe(0);
  });
});

describe('houseAt (plaza wedges)', () => {
  it('maps cardinal directions to the right houses', () => {
    expect(houseAt(0, -11)).toBe(12); // north
    expect(houseAt(11, 0)).toBe(3);   // east
    expect(houseAt(0, 11)).toBe(6);   // south
    expect(houseAt(-11, 0)).toBe(9);  // west
  });
  it('is null near the plaza center', () => {
    expect(houseAt(1, 1)).toBeNull();
  });
  it('wedge boundaries round to the nearest house', () => {
    // 100° is closer to house 3 (90°) than house 4 (120°)
    const x = 11 * Math.sin((100 * Math.PI) / 180);
    const z = -11 * Math.cos((100 * Math.PI) / 180);
    expect(houseAt(x, z)).toBe(3);
  });
});

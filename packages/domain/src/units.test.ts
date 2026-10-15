import { describe, expect, test } from 'vitest';
import { toGrams } from './units';

const onion = [
  { unit: 'cup', grams: 160 },
  { unit: 'piece', grams: 110 },
] as const;

describe('toGrams', () => {
  test('takes grams as they are and converts kilograms', () => {
    expect(toGrams({ amount: 250, unit: 'g' }, [])).toBe(250);
    expect(toGrams({ amount: 1.5, unit: 'kg' }, [])).toBe(1500);
  });

  test("converts a kitchen measure through the food's portion weight", () => {
    expect(toGrams({ amount: 2, unit: 'cup' }, onion)).toBe(320);
    expect(toGrams({ amount: 0.5, unit: 'piece' }, onion)).toBe(55);
  });

  test('returns undefined when the food has no portion weight for the unit', () => {
    expect(toGrams({ amount: 1, unit: 'tbsp' }, onion)).toBeUndefined();
  });
});

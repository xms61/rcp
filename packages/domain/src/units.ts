/** The units an ingredient amount is written in: metric weights and volumes, and kitchen measures. */
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'piece' | 'pinch';

export interface Quantity {
  amount: number;
  unit: Unit;
}

/** How much one `unit` of a food weighs, for example 1 cup of chopped onion = 160 g. */
export interface PortionWeight {
  unit: Unit;
  grams: number;
}

const GRAMS_PER_UNIT: Partial<Record<Unit, number>> = { g: 1, kg: 1000 };

/**
 * The weight of `quantity` in grams. Undefined when the food has no portion weight for the unit, so the
 * recipe's nutrition can say which lines it could not count instead of leaving them out silently.
 */
export function toGrams(quantity: Quantity, portions: readonly PortionWeight[]): number | undefined {
  const gramsPerUnit =
    GRAMS_PER_UNIT[quantity.unit] ?? portions.find((portion) => portion.unit === quantity.unit)?.grams;
  return gramsPerUnit === undefined ? undefined : quantity.amount * gramsPerUnit;
}

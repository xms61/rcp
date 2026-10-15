---
status: draft
last-verified: 2026-10-14
---

# Nutrition computed from ingredients

## Context
RCP keeps recipes with their ingredients, steps and nutrients ([README](../../README.md)). Nutrition can be typed in per recipe from its source, or computed from what goes into it. The owner chose computed nutrition on 2026-10-14, in the [bootstrap interview](../exec-plans/completed/bootstrap.md). No schema exists yet: the first feature that stores recipes designs it, from the rules below.

## Decision
- **Recipe nutrition is computed, never typed in.** Each ingredient line links to a food. A food has nutrients per 100 g, the line's amount is converted to grams, and the recipe's nutrition is the sum, divided by its servings.
- **Ingredient lines are structured:** amount, unit, food, note, and the original text as written in the source, which is kept so a line can be re-parsed or re-linked later.
- **Units are metric plus kitchen measures.** g and kg convert directly. tsp, tbsp, cup, piece, pinch, ml and the like convert through the food's portion weights (1 cup of chopped onion = 160 g). Amounts are shown as entered.
- **Foods come from four sources:** USDA FoodData Central (Foundation Foods and SR Legacy), the French ANSES-CIQUAL table, the German Bundeslebensmittelschlüssel (BLS 4.0), and foods the owner enters by hand, for example from a product label. Every food keeps its source and its ID in that source.
- **Overlapping foods are kept, not merged.** Onion can exist in USDA, CIQUAL and BLS at once. Search shows each food's source, and the owner picks one when linking an ingredient, so a re-import never changes a recipe's choice.
- **Food names are in English**, except brand names, which stay as the brand writes them.

## Why
Typed-in nutrition stops being true as soon as a recipe is changed or scaled, and many sources print none. Computing it from linked foods keeps it correct and lets a recipe's nutrition update when a food's data is corrected.

USDA is the backbone because it is public domain and has portion weights, which turn kitchen measures into grams. CIQUAL and BLS cover European and German foods that USDA lacks or describes differently. Keeping overlaps instead of merging them avoids merge rules that would have to be kept right across every re-import.

Rejected:
- Nutrition typed in per recipe, with structured ingredient lines: less work, but it goes stale when a recipe changes and gives no totals for recipes whose source prints none.
- Free-text ingredient lines: no scaling, no search by ingredient, and nothing to compute from.
- Merging overlaps into one food by source priority: cleaner search results, but every re-import would have to re-run and re-check the merge.
- Open Food Facts for packaged products: ODbL share-alike licence, uneven quality, and weak on raw ingredients. Branded foods are entered by hand instead.

## Open for the schema plan
- The licence text of BLS 4.0 (free since 16 December 2025, but no named licence found) and CIQUAL (free, with attribution required): read both before the first import.
- Whether BLS 4.0 has English names. If it doesn't, the import needs a translation step.
- A unit that a food has no portion weight for, and an ingredient line with no food linked ("salt to taste"): nutrition shows as incomplete and names the lines it could not count, rather than silently leaving them out.
- Which nutrients the recipe page shows by default. All nutrients a source provides are stored.

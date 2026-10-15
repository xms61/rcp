---
version: 1
slug: "src-app-recipe"
primary_target: "src/app/recipe"
related_targets: ["src/app/index.tsx"]
status: draft
last-verified: 2026-10-15
---

## Scope
The recipe surface of the Android app and the screens around it. Mode: Operate. Designed in Penpot first (file "RCP", page "Screens"); code follows the Penpot file and [DESIGN.md](../../DESIGN.md).
1. Recipes (home): search, a filter button with a count, recently opened, and all recipes with ratings.
2. Recipe Overview: photo, title, meta, your rating, macros per serving, and Cook.
3. Recipe Ingredients: a servings stepper, grouped lines with labels, and ticks.
4. Recipe Steps: each step names its scaled amounts in brackets; the current step and its timer are live.
5. Recipe Nutrition: per serving, per 100 g or whole recipe, the serving definition, macros, the incomplete warning, and nutrients.
6. Add recipe sheet: import from a link, paste text, or type it in.
7. Define a serving sheet: a share of the recipe, a fixed weight, or pieces.
8. Filter: include and exclude ingredients, taste, difficulty, price, time and flavor.
9. Include ingredients sheet: search and select. Exclude works the same way.

## Audience and task
The owner, cooking at the stove (phone on the counter, glanced at from arm's length) or planning what to cook. Key states: servings scaled, ingredient and step ticked off, current step, timer running, nutrition incomplete, offline with a cached recipe.

## Direction contract
THESIS: A quiet white page where only food facts carry color. Amounts are bold and right-aligned; small tinted labels say what an ingredient does. It refuses the photo-card grid with a purple Material You tint.

OWN-WORLD: White ground, near-black bold grotesk headings, gray body. Outline pill buttons. One orange accent (a theme token, swappable) for Cook, the current step and live timers. Each label kind has its own color: flavor roles as filled tints, macros as outlined chips with a colored dot, "not linked" as a red tint with a warning icon. The macro colors repeat in the nutrition bars. Ingredient groups are rounded cards with a gray header band.

STORY: Open a recipe, see what it is and how long it takes, and swipe to the ingredients. Scale the servings, tick ingredients off while cooking, follow the highlighted step, and start its timer. Swipe to the nutrition to see what one serving holds, and which lines it couldn't count.

FIRST VIEWPORT: The Overview page shows the hero photo at full width, about 45% of the height. Below it:
- the four-page tab row;
- the title in heavy 30sp;
- the time, servings and kcal meta, with icons;
- your rating;
- the orange "Cook" pill, bottom-left above the gesture bar.

The tab row's underline slides between pages. Swiping moves the pages with a short settle.

FORM: user-pinned after two re-rolls of seed f56885b2. The owner pointed at Cookwell's recipe page: minimal, colored labels and accents, small animations. Raises kept from the rolls: peeking page tabs, sheets that slide, and the accent reserved for live state.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion
Small and functional only: the tab underline slides, a tick fills its checkbox and dims the row in place (no reflow), scaled amounts roll to their new value, and a running timer's ring drains. Under "Remove animations", all of these become instant.

## Owner feedback in the Penpot round
- Steps carry the amounts in brackets, so following them never needs the Ingredients page.
- Ingredient filtering has two buttons, Include and Exclude, each opening search and select, instead of a With/Without toggle.
- A serving is defined per recipe.

## Open
- Which nutrients the Nutrition page lists by default (PRODUCT.md, undecided).
- Tags or categories on the recipe list.
- The rating scales (taste 1–5, difficulty in three steps, price € to €€€) are a first proposal.
- Dark theme: not designed yet.

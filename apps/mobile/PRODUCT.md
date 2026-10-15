---
status: draft
last-verified: 2026-10-15
---

# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
One person, the owner, on their own Android phone. Two moments matter most:
- **Cooking at the stove:** the phone lies on the counter, hands are busy or messy, and the owner reads amounts and the next step at a glance.
- **Planning what to cook:** browsing and searching their own recipes, often by what is in them.

Adding recipes and reading nutrition matter too, but they are secondary.

## Product Purpose
RCP is a personal recipe database: recipes with structured ingredient lines, steps, a photo, and nutrition computed from the ingredients. It replaces scattered bookmarks, notes and cookbook pages with one collection the owner trusts, and it is easy to cook from. Success means that the owner cooks from RCP instead of from the original sources.

## Positioning
Nutrition is computed from linked foods (USDA, CIQUAL, BLS and the owner's own foods), never typed in. It stays true when a recipe is changed or scaled. Overlapping foods from different sources stay separate, and the owner picks one per ingredient ([design doc](../../docs/design-docs/nutrition-from-ingredients.md)).

## Operating Context
- The data lives on the owner's VPS, behind an API with one token. The phone caches only recently opened recipes, so the recipe being cooked stays readable if the connection drops. Editing needs the server ([design doc](../../docs/design-docs/mobile-app-and-api.md)).
- **Recipes come in three ways:** typed in by hand, imported from a recipe site's URL, or pasted as a block of text that is split into ingredient lines and steps.
- **At the stove, a recipe:** scales its servings, recalculating every amount; ticks off ingredients and steps as they are done; keeps the screen on while it is open; and starts a timer from a step that names a duration.

## Capabilities and Constraints
- Android only, built with Expo (React Native), installed from a locally built APK.
- **Ingredient lines:** amount, unit, food, note, and the original text. Units are metric plus kitchen measures (tsp, tbsp, cup, piece, pinch). Amounts are shown as entered.
- One hero photo per recipe, stored on the VPS.
- **A recipe is four pages you swipe between:** Overview, Ingredients, Steps and Nutrition. It is not one long scroll.
- **Filtering the recipes:** include and exclude ingredients ("with chickpeas, without mushrooms"), combined with the owner's ratings, time and flavor labels.
- **The owner rates each recipe:** taste (1–5), difficulty (easy, medium, hard) and price (€ to €€€). The rating scales are a first proposal, open to change.
- **What one serving means is set per recipe**, as one of:
  - a share of the recipe (¼ of it);
  - a fixed weight of the finished dish (350 g);
  - pieces (1 of 10 slices).

  Nutrition switches between per serving, per 100 g and the whole recipe. Scaling the servings changes the amounts, not the serving's size.
- **Steps name each ingredient's amount in brackets**, such as "tomato paste (45 g)", scaled with the servings. The owner can follow the steps without swapping to the Ingredients page.
- **Ingredient lines carry labels:**
  - a flavor role (salty, fat, acid, sweet, heat), set by hand;
  - the main macro (protein, carbs, fat), computed from the linked food;
  - a warning when the line has no food or no portion weight.
- Nutrition is incomplete when a line has no food linked or no portion weight. The app names the lines it could not count.
- **Undecided:**
  - which nutrients the recipe page shows by default;
  - whether recipes have tags or categories;
  - how search by ingredient works.

## Brand Commitments
- The name is RCP.
- The interface is in English, and so are food names, except brand names.
- **The look is minimal.** Color comes from labels and one accent, and the animations are small. The owner's reference is Cookwell's recipe page. The accent is orange for now, and it must be swappable as a theme token.

## Evidence on Hand
No recipes, photos or food data exist yet. Designs use clearly invented sample recipes. They don't claim real nutrition values as sourced data.

## Product Principles
1. **Cookable first.** Every recipe screen must be readable at arm's length, with messy hands, mid-task.
2. **Computed, not claimed.** Nutrition and scaled amounts come from data, and the app says plainly when that data is incomplete.
3. **One owner, no ceremony.** There are no accounts, sharing or social features: the shortest path from opening the app to cooking.
4. **The server holds the truth.** The phone shows and caches; it never forks the data.

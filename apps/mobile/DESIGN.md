---
status: draft
last-verified: 2026-10-16
---

# Design

The visual system of the Android app, as drawn in Penpot. The source is the Penpot file "RCP" on design.penpot.app: its page "Screens" holds 17 screens, the light theme in the top row and the dark theme below it, and its local library holds the colors and type styles below. What the app does is in [PRODUCT.md](PRODUCT.md). The direction, and the owner's feedback on it, is in the [recipe screen brief](.impeccable/surfaces/src-app-recipe.md). No screen is coded yet. When code and Penpot disagree, fix one of them in the same change.

## Principle
The page stays quiet: white, near-black type, gray secondary text. Color comes from food facts (labels and macros) and from one accent for actions and live state. The look follows the owner's reference, Cookwell's recipe page.

## Color
| Token | Value | Use |
| :-- | :-- | :-- |
| Surface | `#FFFFFF` | Page ground |
| Surface raised | `#FFFFFF` | The selected segment, on muted |
| Surface muted | `#F5F4F1` | Search field, group headers, segmented control, inactive chips |
| Ink | `#141414` | Titles, amounts, selected chips, outline buttons |
| Ink secondary | `#5C5B57` | Body text, descriptions |
| Ink tertiary | `#8C8B86` | Meta, captions, unselected tabs |
| Line | `#E7E5E0` | Dividers, card outlines |
| Accent | `#EA580C` | Cook, primary buttons, current step, running timer, ticked boxes, filter count. A theme token: the accent must be swappable |
| Accent soft | `#FFEDE1` | Background of the current step |
| Warning / bg | `#C42B2B` / `#FDECEC` | Lines without a food, incomplete nutrition |

**Labels** each have their own color:
- **Flavor roles** are filled tints, background and text:
  - salty `#DDF1EA` / `#1E6A51`;
  - fat `#FFF0C2` / `#765300`;
  - acid `#E8F3C6` / `#4B680A`;
  - sweet `#FCE3EC` / `#9C2858`;
  - heat `#FFE0D8` / `#A5301A`.
- **Macros** are an outlined chip with a colored dot: protein `#3D6FD9`, carbs `#D99A12`, fat `#8E5BD9`. The same colors draw the macro bars.
- **Not linked** is a red tint with a warning icon.

The accent is never used for decoration. Selected filters are ink, not accent. Success, such as "Connected", uses the salty tint.

### Dark theme
Each token has a dark value; the Penpot library names them "Dark/…". The theme follows the system unless Settings sets Light or Dark.

| Token | Dark | Token | Dark |
| :-- | :-- | :-- | :-- |
| Surface | `#161615` | Accent | `#F26B1F` |
| Surface muted | `#262624` | Accent soft | `#3B2416` |
| Surface raised (selected segment) | `#3A3936` | Warning / bg | `#FF7A7A` / `#3A1B1B` |
| Ink | `#F2F1ED` | Protein / carbs / fat | `#6F9BFF` / `#EFB43C` / `#B48BF6` |
| Ink secondary | `#B9B7B0` | Line | `#34332F` |
| Ink tertiary | `#8A8882` | | |

**Label tints in the dark theme:** the backgrounds are darkened and the text lightened, background / text:
- salty `#173A30` / `#86D9BB`;
- fat `#3A3112` / `#F0CE6A`;
- acid `#2B3613` / `#C2DE7C`;
- sweet `#3D1B2A` / `#F3A5C4`;
- heat `#3E1E16` / `#FFA38B`.

**Inversion:** ink-filled elements become light with dark text, such as selected chips and the offline banner. Text on the accent stays white, and so does the status bar over a photo.

## Type
Figtree (Google Fonts), in sp so it follows the system font size.

| Style | Size / weight | Use |
| :-- | :-- | :-- |
| Display | 32 / 800 | Screen titles ("Recipes"), the kcal figure (48) |
| Headline | 26–30 / 800 | Recipe title, sheet titles (22–24) |
| Title | 16–20 / 700–800 | Section heads, list titles, top bar |
| Body | 15–17 / 400–500 | Descriptions, ingredient names, steps (16; the current step 18 / 600) |
| Amount | 17 / 700 | Ingredient amounts, right-aligned; the unit below in 13 / tertiary |
| Label | 13 / 600 | Meta, captions, upper-case section labels |
| Chip | 10.5 / 700, upper case, tracked | Flavor and warning labels |

## Shape and layout
- Screens are drawn at 412 × 915 dp, edge-to-edge, with a 20 dp side margin.
- Corner radii: 999 for pills and chips, 14–18 for cards and fields, 28 on the top corners of bottom sheets.
- Touch targets are at least 48 dp.
- Ingredient groups are outlined cards with a muted header band. Rows have a checkbox on the left and the amount on the right.
- A recipe is four pages (Overview, Ingredients, Steps, Nutrition), switched by swiping or by the tab row. The active tab is bold ink with an ink underline.
- Bottom sheets add a recipe, define a serving, include or exclude ingredients, and link a food.
- Editing and import review are full screens with a close button and a "Save" text action in the accent. "Delete recipe" sits alone at the end of the editor, outlined in red, and asks again before deleting.

## Components
- **Buttons:** filled accent pill for the one primary action; outlined ink pill for the others; text button with an underline for inline changes ("Change").
- **FAB:** "Add recipe", extended, accent, on the home screen only.
- **Toggle chips:** in filters, selected is an ink fill with white text, unselected an outline.
- **Ingredient filter chips:** included use the salty tint (`#DDF1EA` / `#1E6A51`) with a ×; excluded are muted and struck through.
- **Rating:** taste as five stars (ink), difficulty as a word, price as € to €€€ (unused signs in a light gray).
- **Timer chip:** outlined with a timer icon; running, it fills with the accent and counts down.
- **Icons:** 24 dp line icons with a 2 dp stroke, drawn smaller where text is small.
- **Fields:** a muted filled box with a 13 / 700 label above. Focused, the box takes an ink outline; with an error, a red outline and red help text.
- **Switch:** a Material switch with an accent track when on.
- **Food result:** a radio, the food name, a source badge (USDA, CIQUAL, BLS or Own), and "kcal · 100 g" with its portion weights.
- **Import line:** the original text in quotes, then the parsed amount and the linked food, or a red "Link a food" with the reason.
- **Banner:** offline is a full-width ink strip under the status bar, with "Retry". Recipes not saved on the phone dim to 40 %, and "Add recipe" is disabled.

## Motion
Small and functional:
- the tab underline slides;
- pages swipe with a short settle;
- a tick fills the checkbox and dims its row in place, without reflow;
- scaled amounts roll to their new value;
- a running timer's ring drains.

With the system's "Remove animations" setting, all of these happen instantly.

## Screens
In Penpot, each light screen has a dark twin:
1. Recipes, the home screen.
2. Overview.
3. Ingredients.
4. Steps.
5. Nutrition.
6. Add recipe.
7. Define a serving.
8. Filter.
9. Include ingredients.
10. Connect to server.
11. Recipes, empty.
12. Recipes, offline.
13. Import review.
14. Link a food.
15. Edit recipe, one long scroll.
16. Settings.
17. Recipes, filtered.

## Not designed yet
- Error states beyond offline: a wrong token, a server error, or an import that fails.
- Paste-text review, which reuses import review.
- Adding your own food.
- Tablet layouts.

## Sample content
The recipes, amounts and nutrition values in the Penpot screens are invented samples. The photos are free Unsplash photos, placeholders only. `rcp.example.org` is a placeholder address. No real recipe data exists yet.

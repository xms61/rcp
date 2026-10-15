---
status: draft
last-verified: 2026-10-15
---

# Design

The visual system of the Android app, as drawn in Penpot. The source is the Penpot file "RCP" on design.penpot.app: its page "Screens" holds the screens, and its local library holds the colors and type styles below. What the app does is in [PRODUCT.md](PRODUCT.md). The direction, and the owner's feedback on it, is in the [recipe screen brief](.impeccable/surfaces/src-app-recipe.md). No screen is coded yet. When code and Penpot disagree, fix one of them in the same change.

## Principle
The page stays quiet: white, near-black type, gray secondary text. Color comes from food facts (labels and macros) and from one accent for actions and live state. The look follows the owner's reference, Cookwell's recipe page.

## Color
| Token | Value | Use |
| :-- | :-- | :-- |
| Surface | `#FFFFFF` | Page ground |
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

The accent is never used for decoration. Selected filters are ink, not accent.

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
- Bottom sheets add a recipe, define a serving, and include or exclude ingredients.

## Components
- **Buttons:** filled accent pill for the one primary action; outlined ink pill for the others; text button with an underline for inline changes ("Change").
- **FAB:** "Add recipe", extended, accent, on the home screen only.
- **Toggle chips:** in filters, selected is an ink fill with white text, unselected an outline.
- **Ingredient filter chips:** included use the salty tint (`#DDF1EA` / `#1E6A51`) with a ×; excluded are muted and struck through.
- **Rating:** taste as five stars (ink), difficulty as a word, price as € to €€€ (unused signs in a light gray).
- **Timer chip:** outlined with a timer icon; running, it fills with the accent and counts down.
- **Icons:** 24 dp line icons with a 2 dp stroke, drawn smaller where text is small.

## Motion
Small and functional:
- the tab underline slides;
- pages swipe with a short settle;
- a tick fills the checkbox and dims its row in place, without reflow;
- scaled amounts roll to their new value;
- a running timer's ring drains.

With the system's "Remove animations" setting, all of these happen instantly.

## Not designed yet
Dark theme, the recipe editor, the import review, empty and error states, settings and the connection screen.

## Sample content
The recipes, amounts and nutrition values in the Penpot screens are invented samples. The photos are free Unsplash photos, placeholders only. No real recipe data exists yet.

---
status: draft
last-verified: 2026-10-14
---

# Design docs

Technical decisions and why they were made, one doc per decision, named after it (for example `storage-choice.md`). Each doc gets a row here; the doc checks fail when a row is missing or its status differs from the doc's.

Write one only when the decision is all three of these:
1. **Hard to reverse:** changing your mind later costs real work.
2. **Surprising without context:** a future reader would ask why it was done this way, and might "fix" it.
3. **A real trade-off:** there were genuine alternatives, and this one won for reasons.

If any is missing, skip the doc; an exec plan's decision log is enough for smaller calls. A design doc can be one paragraph: the context, the decision, and why. Add the rejected alternatives only when someone would otherwise propose them again, and constraints the code can't show, such as a compliance rule or a partner's API contract.

| Doc | Status | Summary |
| :-- | :-- | :-- |
| [Core beliefs](core-beliefs.md) | draft | How the repo is run so that agents can do most of the work safely |
| [Nutrition computed from ingredients](nutrition-from-ingredients.md) | draft | Recipe nutrition is summed from foods linked to each ingredient line; the food sources, units and overlap rule |

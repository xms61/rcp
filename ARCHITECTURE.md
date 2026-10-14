---
status: stub
last-verified: 2026-10-14
---

# Architecture

TODO(template): fill this in once the first code exists. Keep it to what a reader can't see quickly from the code: the parts, which way dependencies point, and the rules that hold everywhere. Don't list every file; agents can search.

## Code map
| Path | Holds |
| :-- | :-- |
| `scripts/` | Repo tooling: the doc and tracked-file checks, the agent guard hook, setup |
| `docs/` | The system of record ([KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md)) |
| TODO(template) | |

## Layers
TODO(template): name the layers and the one direction dependencies may point, for example `types → config → data → services → api → ui`. Once there are two layers, enforce the direction with a lint rule or a structural test whose failure message says how to fix the import ([writing one](docs/CODE_STYLE.md#custom-checks)); a rule written only here will be broken.

## Invariants
TODO(template): rules that must hold everywhere, each with the check that enforces it. For example: "input is validated where it enters the system (schema tests)", "tests never use the network (the test runner blocks it)".

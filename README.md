# RCP

RCP is a recipe database: it keeps each recipe with its ingredient list, preparation steps, nutrients and the other details worth tracking. It is a personal tool for its owner, to collect, find and reuse recipes.

## Develop
You need Node 22.12 or later (`.nvmrc` pins 24) and [pnpm](https://pnpm.io/installation). Any recent pnpm switches to the version that `packageManager` in `package.json` pins.

```bash
pnpm install   # dependencies, from the lockfile
pnpm run setup # once per clone: enables the git hooks
pnpm dev       # the app at http://localhost:3000
pnpm verify    # every check a change must pass
```

## Contributing, by people and coding agents
[AGENTS.md](AGENTS.md) is the map: it says which doc to read for which task, the commands, and the boundaries. How the docs are kept true is in [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md), and how Claude Code, the one coding agent set up here, is configured is in [docs/AGENT_TOOLS.md](docs/AGENT_TOOLS.md).

## License
[MIT](LICENSE). Files that came from the [agentic-repo-template](https://github.com/xms61/agentic-repo-template) are also under its [Apache License 2.0](LICENSES/Apache-2.0.txt).

# Terria monorepo

Brings the core Terria projects together in one place.

## Packages

| Path                       | Package                | Status                                                         |
| -------------------------- | ---------------------- | -------------------------------------------------------------- |
| `packages/terriajs`        | `terriajs`             | The full TerriaJS library, moved here from its own repo.       |
| `packages/terriajs-server` | `terriajs-server-stub` | Placeholder. Real package + git history imported as follow-up. |
| `apps/terriamap`           | `terriamap`            | The OG TerriaMap, folded back in                               |

> Yarn is kept here because it is the proven package manager across all three
> projects. Migrating the monorepo to pnpm is a desirable, separate follow-up.

## Prerequisites

- Node.js `>= 22` (see `.nvmrc`)
- Yarn `1.x` (classic)

## Install

```bash
yarn install
```

## Common tasks

Build, test, and lint run through Turborepo from the repo root:

```bash
yarn build          # turbo run build
yarn test           # turbo run test
yarn lint           # turbo run lint
yarn format         # prettier --write .
yarn prettier-check # prettier --check .
```

Run a task for a single package with a filter, e.g.:

```bash
yarn turbo run build --filter=terriajs
```

Run a script inside one workspace directly:

```bash
yarn workspace terriajs gulp build
```

## Formatting

Prettier config is shared from the repo root (`.prettierrc`, `.prettierignore`)
and runs across every package. A Husky `pre-commit` hook formats staged files
with `pretty-quick`.

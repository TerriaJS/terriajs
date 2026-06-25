# Terria monorepo

Brings the core Terria projects together in one place.

## Packages

| Path                | Package     | Status                                                   |
| ------------------- | ----------- | -------------------------------------------------------- |
| `packages/terriajs` | `terriajs`  | The full TerriaJS library, moved here from its own repo. |
| `apps/terriamap`    | `terriamap` | The OG TerriaMap, folded back in                         |

> Yarn is kept here because it is the proven package manager across the current stack
> projects. Migrating the monorepo to pnpm is a desirable, separate follow-up.

## Prerequisites

- Node.js `>= 24` (see `.nvmrc`)
- Yarn `1.x` (classic)

## Install

```bash
yarn install
```

## Common tasks

The everyday loop is "build TerriaMap, serve it from terriajs-server":

```bash
yarn dev   # builds TerriaMap (+ terriajs), watches, serves on http://localhost:3001
```

Other tasks run through Turborepo from the repo root:

```bash
yarn build          # production build of every package
yarn test           # lint + spec build (cached) + headless-Chrome tests
yarn lint           # turbo run lint
yarn format         # prettier --write .
yarn prettier-check # prettier --check .
```

Build and serve the built map:

```bash
yarn start   # turbo run build, then terriajs-server on :3001
```

### What the Turbo tasks actually run

`turbo.json` fans each task out to the matching package script. Today the
mapping is:

| Turbo task       | Package     | Underlying command                                         |
| ---------------- | ----------- | ---------------------------------------------------------- |
| `build`          | `terriamap` | `gulp build` — copy TerriaJS assets, then webpack the app  |
| `dev`            | `terriamap` | `gulp dev` — watch assets + app, serve via terriajs-server |
| `build-for-node` | `terriajs`  | `tsc -b tsconfig-node.json`                                |
| `lint`           | both        | `gulp lint` (ESLint) in each package                       |
| `build-specs`    | `terriajs`  | `gulp build` — copy Cesium assets + webpack the test specs |
| `test`           | `terriajs`  | `gulp test` — jasmine-browser-runner on headless Chrome    |

`terriajs` has no `build` script of its own; it builds for Node via
`build-for-node`, and its browser assets are pulled in by terriamap's
`gulp build`.

`yarn test` runs the whole chain in one go: `test` depends on `build-specs`,
whose outputs (`wwwroot/build/**`) are Turbo-cached.

## Formatting

Prettier config is shared from the repo root (`.prettierrc`, `.prettierignore`)
and runs across every package. A Husky `pre-commit` hook formats staged files
with `pretty-quick`.

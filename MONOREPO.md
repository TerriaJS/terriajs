# Terria monorepo

Brings the core Terria projects together in one place.

## Packages

| Path                | Package     | Status                                                   |
| ------------------- | ----------- | -------------------------------------------------------- |
| `packages/terriajs` | `terriajs`  | The full TerriaJS library, moved here from its own repo. |
| `apps/terriamap`    | `terriamap` | The OG TerriaMap, folded back in                         |

## Prerequisites

- Node.js `>= 24` (see `.nvmrc`)
- pnpm `12.x`

## Install

```bash
pnpm install
```

## Common tasks

The everyday loop is "build TerriaMap, serve it from terriajs-server":

```bash
pnpm dev   # builds TerriaMap (+ terriajs), watches, serves on http://localhost:3001
```

Other tasks run through Turborepo from the repo root:

```bash
pnpm build          # production build of every package
pnpm test           # lint + spec build (cached) + headless-Chrome tests
pnpm lint           # turbo run lint
pnpm format         # prettier --write .
pnpm prettier-check # prettier --check .
```

Build and serve the built map:

```bash
pnpm start   # turbo run build, then terriajs-server on :3001
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

`pnpm test` runs the whole chain in one go: `test` depends on `build-specs`,
whose outputs (`wwwroot/build/**`) are Turbo-cached.

## Formatting

Prettier config is shared from the repo root (`.prettierrc`, `.prettierignore`)
and runs across every package. A Husky `pre-commit` hook formats staged files
with `pretty-quick`.

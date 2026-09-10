# Terria monorepo

Brings the core Terria projects together in one place.

## Packages

| Path                       | Package           | Status                            |
| -------------------------- | ----------------- | --------------------------------- |
| `packages/terriajs`        | `terriajs`        | The TerriaJS library.             |
| `packages/terriajs-server` | `terriajs-server` | The Node.js map server and proxy. |
| `apps/terriamap`           | `terriajs-map`    | The reference map application.    |

## Prerequisites

- Node.js `>= 22` (see the package engines; `.nvmrc` pins the standalone workspace development version).
- pnpm as pinned by `packageManager` in the root `package.json`.

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
pnpm build          # run each package’s build script (TerriaMap is not minified)
pnpm test           # cached spec build + browser tests + server tests
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

| Turbo task       | Package           | Underlying command                                         |
| ---------------- | ----------------- | ---------------------------------------------------------- |
| `build`          | `terriajs-map`    | `gulp build` — copy TerriaJS assets, then webpack the app  |
| `dev`            | `terriajs-map`    | `gulp dev` — watch assets + app, serve via terriajs-server |
| `build-for-node` | `terriajs`        | `tsc -b tsconfig-node.json`                                |
| `lint`           | map + library     | `gulp lint` (ESLint) in each package                       |
| `build-specs`    | `terriajs`        | `gulp build` — copy Cesium assets + webpack the test specs |
| `test`           | `terriajs`        | `gulp test` — jasmine-browser-runner on headless Chrome    |
| `lint`           | `terriajs-server` | `eslint .`                                                 |
| `test`           | `terriajs-server` | `jasmine` — server unit and integration tests              |

`terriajs` has no `build` script of its own; it builds for Node via
`build-for-node`, and its browser assets are pulled in by terriamap's
`gulp build`.

`pnpm test` runs the TerriaJS spec build and tests, plus the server tests: `test` depends on `build-specs`,
whose outputs (`wwwroot/build/**`) are Turbo-cached. Lint is separate: run `pnpm lint`. Server integration tests require Docker; TerriaJS browser tests require Chrome.

For a minified map release, run `pnpm --filter terriajs-map exec gulp release`.

These paths and commands describe a standalone checkout of the public repository. In the private monorepo, this tree lives under `oss/`: install from the outer repository root and use its package filters. The outer root has its own orchestration; do not run a second install inside `oss/`.

## Formatting

Prettier config is shared from the repo root (`.prettierrc`, `.prettierignore`)
and runs across every package. A Husky `pre-commit` hook formats staged files
with `pretty-quick`.

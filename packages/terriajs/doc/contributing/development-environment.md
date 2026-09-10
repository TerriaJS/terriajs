First, read [Cloning and Building](../customizing/cloning-and-building.md).

## Working on TerriaJS and TerriaMap together

TerriaJS (`packages/terriajs`) and TerriaMap (`apps/terriamap`) both live in this workspace, so you develop them together. Edit the source in `packages/terriajs`, and TerriaMap builds against your changes — the workspace links `terriajs` to your local copy.

Start the watch loop from the repo root:

```bash
pnpm dev
```

It builds TerriaMap, serves it on `http://localhost:3001`, and rebuilds whenever you save a change in either package.

## Documentation

You need a standalone install of MkDocs and the `mkdocs-material` theme in order to build the user guide. Install these by running:

```bash
pip install -r requirements.txt
```

Documentation is automatically generated from the source via JSDoc (reference) and MkDocs (user guide) by running:

```bash
pnpm --filter terriajs exec gulp docs
```

It will be placed in the `wwwroot/doc` folder.

## Tests / Specs

We use [Jasmine](https://jasmine.github.io/) for the TerriaJS tests, called specs in Jasmine parlance. Run the whole suite — build the specs (Turbo-caches the output) and run them in headless Chrome — from the repo root:

```bash
pnpm test
```

To build or run the specs on their own while iterating, use the TerriaJS gulp tasks below — for example `pnpm --filter terriajs exec gulp build` to (re)build them and `pnpm --filter terriajs exec gulp test` (or `test-firefox`) to run them. The spec source lives in the TerriaJS package's `test/` directory.

## Gulp tasks

Individual build steps are exposed as `gulp` tasks per package. Run a TerriaJS task with `pnpm --filter terriajs exec gulp <task name>`, and a TerriaMap task with `pnpm --filter terriajs-map exec gulp <task name>`.

### TerriaJS gulp tasks

- default - Invoked by running gulp without any arguments, this task invokes the `build` and `lint` tasks.
- `build` - Builds a non-minified version of the TerriaJS tests. This task may take 10 seconds or more, which is the main reason for the next task.
- `watch` - Starts the same as `build` but then it stays running and watches for changes to any TerriaJS or Cesium source file that was pulled in to the build. When a change to any of these files is detected, a fast incremental build is automatically kicked off. The incremental build is much faster than the full rebuild because dependencies between source files are cached.
- `release` - The same as `build` except that it also minifies the build tests.
- `lint` - Runs ESLint on the files in the `lib` folder and reports any problems. The ESLint rules are defined in the `eslint.config.mjs` file in the root directory of TerriaJS.
- `docs` - Generates the user guide and reference documentation. The user guide is served at `http://localhost:3002/doc/guide/` and the reference documentation is at `http://localhost:3002/doc/reference/`.
- `test` - Detects browsers available on the local system and launches the test suite in each. The results are reported on the command line.
- `test-firefox` - Runs the tests in a headless Firefox browser.

See `packages/terriajs/gulpfile.js` for more gulp tasks.

### TerriaMap gulp tasks

- default - Invoked by running gulp without any arguments, this task invokes the `build` and `lint` tasks.
- `build` - Builds a non-minified version of TerriaMap, TerriaJS, Cesium, and all other dependencies, together in one JS file (called `wwwroot/build/TerriaMap.js`). Only the parts of TerriaJS and Cesium that we use (directly or indirectly) are pulled in. Web Workers, CSS, and other resources are also built by this task. This task may take 10 seconds or more, which is the main reason for the next task.
- `watch` - Starts the same as `build` but then it stays running and watches for changes to any TerriaMap, TerriaJS, or Cesium resource. When a change to any of these files is detected, a fast incremental build is automatically kicked off. The incremental build is much faster than the full rebuild because dependencies between source files are cached.
- `release` - The same as `build` except that it also minifies the built JavaScript files. This task should be used when building for production.
- `lint` - Runs ESLint on `index.js` and the files in the `lib` folder and reports any problems. The ESLint rules are defined in the `eslint.config.mjs` file in the root directory of TerriaMap.
- `clean` - Removes the `wwwroot/build` directory.
- `sync-terriajs-dependencies` - For all npm packages used by both TerriaMap and TerriaJS, updates TerriaMap's `package.json` to use the same version as TerriaJS. This avoids build problems (errors, hangs) caused by package version conflicts.

Most of the time you won't call these directly — `pnpm dev`, `pnpm build`, and `pnpm test` from the repo root run the right task in each package for you.

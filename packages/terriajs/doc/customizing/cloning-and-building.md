If you've done this sort of thing before, you'll find it easy to clone and build TerriaMap with these quick instructions:

```bash
git clone https://github.com/TerriaJS/terriajs.git

cd terriajs

corepack enable   # or install pnpm: https://pnpm.io/installation

export NODE_OPTIONS=--max_old_space_size=4096

pnpm install && pnpm dev

# Open at http://localhost:3001
```

If you run into trouble or want more explanation, read on.

### The Terria monorepo

TerriaJS and TerriaMap now live together in a single [pnpm](https://pnpm.io) + [Turborepo](https://turborepo.com) monorepo:

- `packages/terriajs` — the TerriaJS library.
- `packages/terriajs-server` — the small Node web server that serves the built map.
- `apps/terriamap` — TerriaMap, the reference application (package name `terriajs-map`).

You clone the one repo and work on any of them from the root. See the [monorepo overview](https://github.com/TerriaJS/terriajs/blob/main/MONOREPO.md) for the full task list.

### Prerequisites

TerriaJS can be built and run on almost any macOS, Linux, or Windows system. The following are required:

- The Bash command shell. On macOS or Linux you almost certainly already have this. On Windows, you can easily get it by installing [Git for Windows](https://gitforwindows.org/). In the instructions below, we assume you're using a Bash command prompt.
- [Node.js](https://nodejs.org) v22 or later. The repo pins the version used for development in `.nvmrc`. Check with `node --version`.
- [pnpm](https://pnpm.io) 12.x. Install it by following pnpm's [installation guide](https://pnpm.io/installation), or run `corepack enable` if you have [Corepack](https://github.com/nodejs/corepack) available.

### Cloning the monorepo

The latest version is on [GitHub](https://github.com/TerriaJS/terriajs), and the preferred way to get it is by using `git`:

```bash
git clone https://github.com/TerriaJS/terriajs.git

cd terriajs
```

If you're unable to use git, you can also [download a ZIP file](https://github.com/TerriaJS/terriajs/archive/main.zip) and extract it somewhere on your system. We recommend using git, though, because it makes it much easier to update to later versions in the future.

### Increase NodeJS memory limit

To avoid running out of memory when installing dependencies and building, increase the memory limit of node:

```bash
export NODE_OPTIONS=--max_old_space_size=4096
```

### Installing dependencies

All of the dependencies for every package in the workspace are installed from the repo root with a single command:

```bash
pnpm install
```

The dependencies are installed into per-package `node_modules` directories linked from a central store. No global changes are made to your system.

### Building and running

The everyday loop builds TerriaMap (and the TerriaJS it depends on), watches for changes, and serves the result on `http://localhost:3001`:

```bash
pnpm dev
```

For a one-shot production build of every package:

```bash
pnpm build
```

To build and then serve the built map (without watching):

```bash
pnpm start
```

To produce a minified release build of the app specifically:

```bash
pnpm --filter terriajs-map exec gulp release
```

The full set of `gulp` tasks can be found on the [Development Environment](../contributing/development-environment.md#gulp-tasks) page.

### Keeping up with updates

Pull the latest changes with `git pull`, then run `pnpm install` again to pick up any changed dependencies before rebuilding. If you have problems building or running, it is sometimes helpful to remove and reinstall the dependencies:

```bash
rm -rf node_modules
pnpm install
```

### Having trouble?

Checkout the [Problems and Solutions](../contributing/problems-and-solutions.md) page to see if we have them covered. You are also welcome to post your problem on the [TerriaJS Discussions](https://github.com/TerriaJS/terriajs/discussions) forum and we'll be happy to help!

### Next Steps

Now that you have a working local build of TerriaMap, you may want to [customize it](./README.md) or [deploy it](../deploying/README.md) for others to use.

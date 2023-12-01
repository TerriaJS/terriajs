If you've done this sort of thing before, you'll find it easy to clone and build TerriaMap with these quick instructions:

```bash
git clone https://github.com/TerriaJS/TerriaMap.git

cd TerriaMap

export NODE_OPTIONS=--max_old_space_size=4096

npm install -g yarn

yarn install && yarn gulp && yarn start

# Open at http://localhost:3001
```

If you run into trouble or want more explanation, read on.

### Prerequisites

TerriaJS can be built and run on almost any macOS, Linux, or Windows system. The following are required to build TerriaJS:

-   The Bash command shell. On macOS or Linux you almost certainly already have this. On Windows, you can easily get it by installing [Git for Windows](https://gitforwindows.org/). In the instructions below, we assume you're using a Bash command prompt.
-   [Node.js](https://nodejs.org) v16.0. You can check your node version by running `node --version` on the command-line.
    -   **Note** you can also use Node.js 18 and 20, but you will need to set `NODE_OPTIONS=--openssl-legacy-provider` in your environment.
-   [npm](https://www.npmjs.com/) v8.0. npm is usually installed automatically alongside the above. You can check your npm version by running `npm --version`.
-   [yarn](https://yarnpkg.com/) v1.19.0 or later. This can be installed using `npm install -g yarn@^1.19.0`

### Cloning TerriaMap

The latest version of TerriaMap is on [GitHub](https://github.com), and the preferred way to get it is by using `git`:

```bash
git clone https://github.com/TerriaJS/TerriaMap.git

cd TerriaMap
```

If you're unable to use git, you can also [download a ZIP file](https://github.com/TerriaJS/TerriaMap/archive/main.zip) and extract it somewhere on your system. We recommend using git, though, because it makes it much easier to update to later versions in the future.

### Increase NodeJS memory limit

To avoid running out of memory when installing dependencies and building TerriaMap, increase the memory limit of node:

```bash
export NODE_OPTIONS=--max_old_space_size=4096
```

### Installing Dependencies

All of the dependencies required to build and run TerriaMap, other than the prerequisites listed above, are installed using `yarn`:

```bash
yarn install
```

The dependencies are installed in the `node_modules` subdirectory. No global changes are made to your system.

### Building TerriaMap

Do a standard build of TerriaMap with:

```bash
yarn gulp
```

Or, you can create a minified release build with:

```bash
yarn gulp release
```

To watch for changes and automatically do an incremental build when any are detected, use:

```bash
yarn gulp watch
```

`yarn gulp` simply runs `gulp`, so you can use that directly if you prefer (run `npm install -g gulp-cli` to install it globally).

The full set of `gulp` tasks can be found on the [Development Environment](../contributing/development-environment.md#terriamap-gulp-tasks) page.

### Running TerriaMap

TerriaMap includes a simple Node.js-based web server, called [terriajs-server](https://github.com/TerriaJS/terriajs-server). To start it, run:

```bash
yarn start
```

Then, open a web browser on `http://localhost:3001` to use TerriaMap.

### Keeping up with Updates

If you're building an application by using TerriaMap as a starting point, you will want to keep in sync as TerriaMap is improved and updated to use new versions of TerriaJS. Forking the TerriaMap repo and using git to keep it in sync is outside the scope of this document, but GitHub has a [nice explanation](https://help.github.com/articles/fork-a-repo/).

After pulling new changes, you will need to run `yarn install` again to pick up any changed dependencies and then build TerriaMap. If you have problems building or running, it is sometimes helpful to remove and reinstall the dependencies from npm:

```bash
rm -rf node_modules
yarn install
```

### Having trouble?

Checkout the [Problems and Solutions](../contributing/problems-and-solutions.md) page to see if we have them covered. You are also welcome to post your problem on the [TerriaJS Discussions](https://github.com/TerriaJS/terriajs/discussions) forum and we'll be happy to help!

### Next Steps

Now that you have a working local build of TerriaMap, you may want to [customize it](./README.md) or [deploy it](../deploying/README.md) for others to use.

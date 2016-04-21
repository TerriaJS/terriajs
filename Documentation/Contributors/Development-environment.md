# Setting up a TerriaJS development environment

First, [deploy and build your instance](/Documentation/Deployment/Deploying-Terria-Map.md).

## Updating Build

The following commands are what you would normally run to pull changes from GitHub and build them:

```
git pull --rebase
npm install
gulp
npm start
```

## Building a Terria based site against a modified TerriaJS

What if you need to make changes to [TerriaJS](https://github.com/TerriaJS/terriajs) while working on a site that depends on it?

In the process above, the [TerriaJS package](https://www.npmjs.com/package/terriajs) is installed to the `node_modules` directory by `npm install`.  Please do not edit TerriaJS directly in the `node_modules` directory, because changes will be clobbered the next time you run `npm install`.  Instead, follow these instructions.

First, set up a TerriaJS dev environment on your system by following the [instructions](https://github.com/TerriaJS/terriajs/wiki/Developers%27-Handbook).  Then, checkout an appropriate version of TerriaJS.  To use the exact version that National Map is expecting, do:

```bash
cd nationalmap
grep terriajs package.json
# will print something like: "terriajs": "0.0.23"
cd ../terriajs
git checkout 0.0.23 # version from above

# Create a new branch to hold your changes.
git checkout -b someBranchName
```

If you're planning to upgrade National Map's version of TerriaJS, you may choose to use `master` instead of the precise version listed in `package.json`.

Next, link your local version of TerriaJS into the global npm package repository:

```
cd terriajs
npm link
```

Then, link the now global `terriajs` package into National Map:

```
cd nationalmap
npm link terriajs
```

This process essentially makes National Map's `node_modules/terriajs` into a symlink to your `terriajs` directory cloned from git.  Any changes you make to TerriaJS will be automatically picked up by National Map.  Don't forget to run `npm install` in TerriaJS after pulling new changes or modifying `package.json`.  You will also need to build TerriaJS (by running `gulp`) if you modify any Cesium shaders or make changes to Cesium code that could affect Cesium's WebWorkers.

To switch National Map back to using the npm version of TerriaJS, do:

```
npm unlink terriajs
npm install
```

## Committing modifications

If you make changes to TerriaJS and National Map together, here's the process for getting them to production.

First, commit your TerriaJS changes to a branch and open a pull request to merge that branch to master. Simultaneously, you may want to make a branch of National Map that uses your modified version of TerriaJS.  To do that, modify National Map's `package.json`.  Where it has a line like:

```
"terriajs": "^0.0.27",
```

Change it to:

```
"terriajs": "git://github.com/TerriaJS/terriajs.git#branchName",
```

Replace `branchName` with the name of the TerriaJS branch you want to use.  You may even use a repository other than `TerriaJS/terriajs` if your branch is in a fork of TerriaJS instead of in the official repository.

Once your TerriaJS pull request has been merged and a new version of the `terriajs` npm module has been published, please remember to update `package.json` to point to an official `terriajs` version instead of a branch in a GitHub repo.

When at all possible, the `package.json` in the `master` branch should point to official releases of `terriajs` on npm, NOT GitHub branches.

## Release Build

If you want to make a minified release build use the commands:

```
npm install
gulp release
npm start
```

## Documentation

Documentation is automatically generated from the source via jdocs.  It will be placed in the public/doc folder.  

It is still very early stages, so the documentation is rather minimal and referencing the source code is probably a better way to determine the best way to use the existing functionality.

You can click [here](http://nationalmap.nicta.com.au/doc/) to reference the documentation on the National Map site.

## Tests / Specs

The test suite is run by opening a web browser on [http://localhost:3001/SpecRunner.html](http://localhost:3001/SpecRunner.html).  The specs themselves are found in the `test/` directory.


## Gulp Tasks

* default - Invoked by running gulp without any arguments, this task invokes the `build` and `lint` tasks.
* `build` - Builds a non-minified version of National Map AND Cesium, together in one JS file (called `public/build/ausglobe.js`). Only the parts of Cesium that we use (directly or indirectly) are pulled in. This task builds both the application and the specs.  This task may take 10 seconds or more, which is the main reason for the next task.
* `watch` - Starts the same as `build` but then it stays running and watches for changes to any National Map, spec, or Cesium source file that was pulled in to `ausglobe.js`. When a change to any of these files is detected, a fast incremental build is automatically kicked off.  The incremental build is much faster than the full rebuild because dependencies between source files are cached.
* `release` - The same as `build` except that it also minifies `ausglobe.js`.  This task should be used when building for production.
* `build-app` - The same as `build`, except it builds just the app, not the specs.
* `build-specs` - The same as `build`, except it builds just the specs, not the app.  Note that the specs do not actually depending on the app, so there is no need to `build-app` if you're just iterating on the specs, even if you change app source files.
* `watch-app` - Watches just the app for changes.
* `watch-specs` - Watches just the specs for changes.
* `release-app` - Does a release build of just the app.
* `release-specs` - Does a release build of just the specs.
* `lint` - Runs jshint on the files in the `src` folder and reports any problems.  Our [.jshintrc](https://github.com/NICTA/nationalmap/blob/master/src/.jshintrc) file is mostly just copied from Cesium at the moment, so suggested changes are welcome.
* `docs` - Generates reference documentation for the files in the `src` folder.
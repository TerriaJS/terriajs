First, read [Getting Started](../getting-started.md).

## Building a TerriaMap against a modified TerriaJS

What if you need to make changes to [TerriaJS](https://github.com/TerriaJS/terriajs) while working on a site that depends on it?

In the process described in [Getting Started](../getting-started.md), the [TerriaJS package](https://www.npmjs.com/package/terriajs) is installed to the `node_modules` directory by `npm install`.  Please do not edit TerriaJS directly in the `node_modules` directory, because changes will be clobbered the next time you run `npm install`.

Instead, we want to clone TerriaJS from its [GitHub repo](https://github.com/TerriaJS/terriajs) and use that in our TerriaMap build.  Traditionally, `npm link` is the way to do this.  However, we do not recommend use of `npm link` because it frequently leads to multiple copies of some libraries being installed, which in turn leads to all sorts of frustrating build problems.  Instead, we recommend [npmgitdev](https://www.npmjs.com/package/npmgitdev).  `npmgitdev` lets us safely clone a git repo into our `node_modules` directory and use it pretty much as if npm had put it there itself.

First, install `npmgitdev` globally:

```
npm install -g npmgitdev
```

Then, in your TerriaMap directory, remove the existing `terriajs` package, and clone the terriajs repo there instead.

```
cd node_modules
rm -rf terriajs
git clone https://github.com/TerriaJS/terriajs.git
cd ..
```

This will give you the `master` branch of TerriaJS.  While we strive to keep `master` stable and usable at all times, you must be aware that `master` is less tested than actual releases, and it may not be commpatible with the `master` branch of TerriaMap.  So, you may want to check out the actual version of TerriaJS that you're using before you start making changes.  To do that:

```
grep terriajs package.json
# will print something like: "terriajs": "^4.5.0"
cd node_modules/terriajs
git checkout 4.5.0
cd ../..
```

Now, if you run `npm install`, `npm` will fail with an error like this:

```
npm ERR! git C:\github\TerriaMap\node_modules\terriajs: Appears to be a git repo or submodule.
npm ERR! git     C:\github\TerriaMap\node_modules\terriajs
npm ERR! git Refusing to remove it. Update manually,
npm ERR! git or move it out of the way first.
```

This is _good_!  It means `npm` recognizes that your `terriajs` directory is now a git repo, and it is refusing to touch it out of fear of making you lose your work.  This is where `npmgitdev` comes in:

```
npmgitdev install
```

`npmgitdev` is a wrapper around `npm` that, for each git repo in `node_modules`:

* Makes sure your working directory is clean (i.e. you have no uncommitted changes).
* Moves the `.git` directory out of the way so that `npm` can't see it or clobber it.
* Copies all the `devDependencies` in `package.json` into `dependencies`.  This way npm will install all your dev-time stuff too.
* Runs `npm` normally.
* Moves the `.git` directory back.

!!! note

	If you hit CTRL-C while `npmgitdev` is running, it will be unable to clean up after itself automatically.  Look for a `npmgitdev-XXXXX` directory.  The `mappings.json` file in that directory contains a record of the changes that `npmgitdev` made so that you can undo them manually.  Usually this just means moving the `.git` directory back.

Now, we can edit TerriaJS in `node_modules/terriajs` with the benefit of a full-feature git repo.

To switch National Map back to using the npm version of TerriaJS (instead of the git repo), do:

```
# warning: make sure you don't need any of your changes to TerriaJS first!
rm -rf node_modules/terriajs
npmgitdev install
```

## Committing modifications

If you make changes to TerriaJS and National Map together, here's the process for getting them to production.

First, commit your TerriaJS changes to a branch and open a pull request to merge that branch to master. Simultaneously, you may want to make a branch of TerriaMap that uses your modified version of TerriaJS.  To do that, modify TerriaMap's `package.json`.  Where it has a line like:

```
"terriajs": "^4.5.0",
```

Change it to:

```
"terriajs": "git://github.com/TerriaJS/terriajs.git#branchName",
```

Replace `branchName` with the name of the TerriaJS branch you want to use.  You may even use a repository other than `TerriaJS/terriajs` if your branch is in a fork of TerriaJS instead of in the official repository.

Once your TerriaJS pull request has been merged and a new version of the `terriajs` npm module has been published, please remember to update `package.json` to point to an official `terriajs` version instead of a branch in a GitHub repo.

The `package.json` in the `master` branch of TerriaMap should point to official releases of `terriajs` on npm, NOT GitHub branches.

## Documentation

Documentation is automatically generated from the source via JSDoc (reference) and MkDocs (user guide) by running:

```
npm run gulp docs
```

It will be placed in the `wwwroot/doc` folder.  

## Tests / Specs

We use [Jasmine](https://jasmine.github.io/) for the TerriaJS tests, called specs in Jasmine parlance.  To run the specs, you first need to build them by running this in the TerriaJS  (not TerriaMap!) directory:

```
npm run gulp
```

And start the development web server by running:

```
npm start
```

The test suite is run by opening a web browser on [http://localhost:3002/SpecRunner.html](http://localhost:3002/SpecRunner.html).  The source code for the specs is found in the `test/` directory.

## Gulp Tasks

Run any of these tasks with `npm run gulp <task name>`:

TODO: separate TerriaMap tasks from TerriaJS tasks.

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
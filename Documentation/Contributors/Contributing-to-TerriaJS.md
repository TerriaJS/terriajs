## Working on TerriaJS and Cesium

What if you need to make changes to [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) while working on TerriaJS?

In the deployment process, the [terriajs-cesium package](https://www.npmjs.com/package/terriajs-cesium) is installed to the `node_modules` directory by `npm install`.  Please do not edit Cesium directly in the `node_modules` directory, because changes will be clobbered the next time you run `npm install`.  Instead, follow these instructions.

First, set up a Cesium dev environment on your system by following the [instructions](https://github.com/AnalyticalGraphicsInc/cesium/wiki/Contributor%27s-Guide).  Consider checking out TerriaJS/cesium instead of the official Cesium repository on GitHub.  Then, checkout an appropriate version of Cesium.  To use the exact version that Cesium is expecting (assuming you're working in the TerriaJS fork), do:

```bash
cd terriajs
grep terriajs-cesium package.json
# will print something like: "terriajs-cesium": "0.0.6"
cd ../Cesium
git checkout 0.0.6 # version from above

# Create a new branch to hold your changes.
git checkout -b someBranchName
```

If you're planning to upgrade TerriaJS's version of Cesium, you may choose to use the `terriajs` branch and merge in master from the official Cesium repository, instead of the precise version listed in `package.json`.

Next, link your local version of Cesium into the global npm package repository:

```
cd cesium
npm link
```

Then, link the now global `terriajs-cesium` package into National Map:

```
cd terriajs
npm link terriajs-cesium
```

This process essentially makes National Map's `node_modules/terriajs-cesium` into a symlink to your `cesium` directory cloned from git.  Any changes you make to Cesium will be automatically picked up by TerriaJS.  Don't forget to run `npm install` in Cesium after pulling new changes or modifying `package.json`.  You will also need to build Cesium (by running `gulp`) if you modify any Cesium shaders or make changes to Cesium code that could affect Cesium's WebWorkers.

To switch TerriaJS back to using the npm version of Cesium, do:

```
npm unlink terriajs-cesium
npm install
```

## Committing modifications

If you make changes to Cesium and TerriaJS together, here's the process for getting them to production.

First, commit your Cesium changes to a branch and open a pull request to merge that branch to master in the official Cesium repo. Simultaneously, you may want to make a branch of TerriaJS that uses your modified version of Cesium.  To do that, modify TerriaJS's `package.json`.  Where it has a line like:

```
"terriajs-cesium": "^0.0.6",
```

Change it to:

```
"terriajs-cesium": "git://github.com/TerriaJS/cesium.git#branchName",
```

Replace `branchName` with the name of the Cesium branch you want to use.  You may even use a repository other than `TerriaJS/cesium` if your branch is in a fork of Cesium instead of in the official repository.

Once your Cesium pull request has been merged and a new version of the `terriajs-cesium` npm module has been published, please remember to update `package.json` to point to an official `terriajs-cesium` version instead of a branch in a GitHub repo.

When at all possible, the `package.json` in the `master` branch should point to official releases of `terriajs-cesium` on npm, NOT GitHub branches.

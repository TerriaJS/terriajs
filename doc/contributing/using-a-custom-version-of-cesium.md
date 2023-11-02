## Working on TerriaJS and Cesium

What if you need to make changes to [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) while working on TerriaJS?

The process of using a custom version of Cesium is much the same as using a custom version of TerriaJS. See the [Development Environment](development-environment.md#building-a-terriamap-against-a-modified-terriajs) for information on setting up and using `yarn`. To clone Cesium, do:

```
cd packages
git clone -b terriajs https://github.com/TerriaJS/cesium.git
cd ..
```

It is important that you use the `terriajs` branch of [TerriaJS/cesium](https://github.com/TerriaJS/cesium) because it contains important changes to Cesium that are necessary for it to work with TerriaJS. If you need to use a different branch of Cesium, you will need to merge that branch with the changes in the `terriajs` branch.

And then run:

```
yarn install
```

## Committing modifications

If you make changes to Cesium and TerriaJS together, here's the process for getting them to production.

First, commit your Cesium changes to a branch and open a pull request to merge that branch to master in the official [TerriaJS/cesium](https://github.com/TerriaJS/cesium) repo. Simultaneously, you may want to make a branch of TerriaJS that uses your modified version of Cesium. To do that, modify TerriaJS's `package.json`. Where it has a line like:

```
"terriajs-cesium": "^1.25.1",
```

Change it to:

```
"terriajs-cesium": "git://github.com/TerriaJS/cesium.git#branchName",
```

Replace `branchName` with the name of the Cesium branch you want to use. You may even use a repository other than `TerriaJS/cesium` if your branch is in a fork of Cesium instead of in the official repository.

Once your Cesium pull request has been merged and a new version of the `terriajs-cesium` npm module has been published, please remember to update `package.json` to point to an official `terriajs-cesium` version instead of a branch in a GitHub repo.

The `package.json` in the `master` branch should always point to official releases of `terriajs-cesium` on npm, NOT GitHub branches.

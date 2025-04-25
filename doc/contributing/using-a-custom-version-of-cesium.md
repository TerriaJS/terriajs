## Working on TerriaJS and Cesium

What if you need to make changes to [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) while working on TerriaJS?

TerriaJS is using a fork of Cesium monorepo located at https://github.com/terriajs/cesium, and similar to the upstream repo it consists of two packages:

- [terriajs-cesium](https://www.npmjs.com/package/terriajs-cesium) corresponds to the upstream [@cesium/engine](https://www.npmjs.com/package/@cesium/engine/)
- [terriajs-cesium-widgets](https://www.npmjs.com/package/terriajs-cesium-widgets) corresponds to the upstream [@cesium/widgets](https://www.npmjs.com/package/@cesium/widgets/)

The process of using a custom version of Cesium is much the same as using a custom version of TerriaJS. See the [Development Environment](development-environment.md#building-a-terriamap-against-a-modified-terriajs) for information on setting up and using `yarn`. To clone Cesium, do:

```sh
cd packages
git clone https://github.com/TerriaJS/cesium.git terriajs-cesium
```

Make sure that the `terriamap/package.json` workspaces list contains the following packages:

- "packages/terriajs-cesium/packages/engine",
- "packages/terriajs-cesium/packages/widgets"

Check the versions of `terriajs-cesium` and `terriajs-cesium-widgets` in `terriamap/package.json` and `terriamap/packages/terriajs/package.json` and make sure they are the same so yarn can properly create symlinks.

Then run:

```
yarn install
```

## Making the changes in cesium

Cesium uses npm so you should use it instead of yarn when installing dependencies and running commands inside cesium repo. After making the changes you will need to run

```sh
npm run release
```

to build the code and generate Typescript types definitions required for Terria to work correctly. For more details on building the cesium and coding guidelines consult the [cesium documentation](https://github.com/CesiumGS/cesium/tree/main/Documentation)

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

The `package.json` in the `main` branch should always point to official releases of `terriajs-cesium` on npm, NOT GitHub branches.

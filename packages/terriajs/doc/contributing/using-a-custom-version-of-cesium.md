## Working on TerriaJS and Cesium

What if you need to make changes to [Cesium](https://github.com/CesiumGS/cesium) while working on TerriaJS?

TerriaJS depends on `terriajs-cesium`, a published fork of Cesium maintained at [TerriaJS/cesium](https://github.com/TerriaJS/cesium). It is not part of this monorepo, but you can develop against a local checkout much like you work on TerriaJS itself (see [Development Environment](development-environment.md#working-on-terriajs-and-terriamap-together)). Clone the fork into the `packages/` directory — it is covered by the workspace, so pnpm will link it:

```
cd packages
git clone https://github.com/TerriaJS/cesium.git terriajs-cesium
cd ..
pnpm install
```

Use the [TerriaJS/cesium](https://github.com/TerriaJS/cesium) fork rather than upstream Cesium: its `main` branch carries the changes TerriaJS needs, and that is what `terriajs-cesium` is published from. If you work from a different branch, merge `main` into it first.

## Using a custom Cesium branch without cloning

To build against a Cesium branch without a local checkout, add a pnpm `overrides` entry to the root `pnpm-workspace.yaml`, pointing `terriajs-cesium` at the git ref:

```yaml
overrides:
  terriajs-cesium: "github:TerriaJS/cesium#branchName"
```

Then run `pnpm install`. Replace `branchName` with the branch you want to use (a fork works too, e.g. `github:your-org/cesium#branchName`).

## Committing modifications

If you make changes to Cesium and TerriaJS together, here's the process for getting them to production.

First, commit your Cesium changes to a branch and open a pull request against the official [TerriaJS/cesium](https://github.com/TerriaJS/cesium) repo. While that is in review you can build TerriaJS against your branch using the `overrides` entry above.

Once your Cesium pull request has been merged and a new version of the `terriajs-cesium` npm module has been published, update the `terriajs-cesium` dependency to that release and remove the `overrides` entry. The committed `pnpm-workspace.yaml` and `package.json` should always point to official releases of `terriajs-cesium` on npm, never a git branch.

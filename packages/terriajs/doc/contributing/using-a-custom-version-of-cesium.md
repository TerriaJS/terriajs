## Repository structure

[TerriaJS/cesium](https://github.com/TerriaJS/cesium) is a separate **npm monorepo**, not a single `terriajs-cesium` package. Its relevant packages are:

| Directory          | Package name              | Used by                                          |
| ------------------ | ------------------------- | ------------------------------------------------ |
| Repository root    | `cesium`                  | Cesium's aggregate build and development tooling |
| `packages/engine`  | `terriajs-cesium`         | TerriaJS and TerriaMap                           |
| `packages/widgets` | `terriajs-cesium-widgets` | TerriaJS                                         |

The repository also contains Sandcastle. Do not add the Cesium repository root to Terria's pnpm workspace as `terriajs-cesium`: the package names, source paths, and dependencies differ.

The source widgets package imports `@cesium/engine` and declares `file:../engine`. Cesium's [publishing workflow](https://github.com/TerriaJS/cesium/blob/main/.github/workflows/npm-publish-terriajs-cesium.yml) replaces that dependency with an npm alias for the published `terriajs-cesium` package. Local development must likewise resolve widgets and TerriaJS to the same engine checkout.

## Choose a compatible branch

Check the versions required by `packages/terriajs/package.json` and `apps/terriamap/package.json` before choosing a Cesium branch. Do not assume the fork's default branch matches the latest published packages.

At the time of this update, TerriaJS uses `terriajs-cesium@26.0.0` and `terriajs-cesium-widgets@16.0.0`. The fork's `upgrade-to-1.142` branch declares those versions; `main` declares engine `22.3.1` and widgets `14.3.1`. Recheck the branch manifests when updating these instructions or upgrading TerriaJS.

## Build Cesium separately

Keep Cesium outside Terria's pnpm workspace. For example, clone it beside the standalone Terria repository:

```bash
# From the standalone Terria repository root:
git clone --branch upgrade-to-1.142 https://github.com/TerriaJS/cesium.git ../cesium
cd ../cesium
npm install
npm run build
npm run build-ts
```

Use npm inside this checkout, following Cesium's own Node version requirements and build instructions. Terria continues to use pnpm. The separate installation provides Cesium's build tools and its npm workspace links, including widgets' `@cesium/engine` dependency.

`build` generates JavaScript and assets; `build-ts` generates the package declarations, including `packages/engine/index.d.ts` and `packages/widgets/index.d.ts`. `npm run release` is the fuller release build, including declarations and documentation; it is not a substitute for installing dependencies first.

## Point Terria at the built packages

In Terria's root `pnpm-workspace.yaml`, add these entries to the existing `overrides` mapping, preserving other overrides:

```yaml
overrides:
  terriajs-cesium: "link:../cesium/packages/engine"
  terriajs-cesium-widgets: "link:../cesium/packages/widgets"
```

These paths assume the sibling checkout above. In the private monorepo, edit the outer root's workspace file and make the paths relative to that root, not `oss/`.

Run `pnpm install` from Terria's workspace root. The overrides select the same engine for all consumers, including TerriaMap and any private map application. The `link:` dependencies use the installation and generated files in the Cesium checkout; they do not make pnpm responsible for installing Cesium's npm workspace.

Verify that widgets' upstream import resolves to the same physical engine as TerriaJS:

```bash
pnpm --filter terriajs exec node -e 'const fs = require("node:fs"); const path = require("node:path"); const engine = fs.realpathSync(require.resolve("terriajs-cesium/package.json")); const widgets = fs.realpathSync(require.resolve("terriajs-cesium-widgets/package.json")); const widgetEngine = fs.realpathSync(require.resolve("@cesium/engine/package.json", { paths: [path.dirname(widgets)] })); if (engine !== widgetEngine) throw new Error("Widgets and TerriaJS resolve different Cesium engines"); console.log("Both consumers use", engine);'
pnpm --filter terriajs-map exec gulp release
```

If the engine check fails, inspect the npm installation in the Cesium checkout before proceeding. Matching version strings alone does not establish that both imports load the same engine instance.

After changing Cesium, rerun its `npm run build` and `npm run build-ts`, then rebuild TerriaMap. Restart a running TerriaMap watcher after changing overrides or replacing generated assets.

## Sharing changes and returning to published packages

Commit Cesium changes in the Cesium repository and open a pull request there. Share the branch or commit together with the build-and-link instructions above. A dependency such as `github:TerriaJS/cesium#branchName` selects the aggregate root package; it is not a replacement for `terriajs-cesium` or `terriajs-cesium-widgets`.

For reproducible CI or deployment, use published prerelease versions of both required packages, or explicitly build and package the engine and widgets with the same dependency rewrite used by Cesium's publishing workflow. Local `link:` overrides depend on files outside Terria's repository and should not be committed for release builds.

Once the changes are published, remove the two local overrides, update the engine version in both TerriaJS and TerriaMap and the widgets version in TerriaJS, and run `pnpm install`. Commit the manifest and lockfile changes, then verify the map against the published packages.

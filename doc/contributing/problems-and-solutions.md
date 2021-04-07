### Problem

Building TerriaMap (without yarn workspaces) throws an error like:
```
You have two copies of terriajs-cesium
```

### Solution

Check:
```
npm list terriajs-cesium
```
If there are 2 different versions listed, run:
```
gulp sync-terriajs-dependencies
```
If there's only 1 version listed in 2 places your npm lockfile is playing up. To fix it run:
```
npm install --save-exact terriajs
npm dedupe
npm install
```
Commit lockfile

--------

### Problem

When using yarn workspaces to develop a TerriaMap against a custom version of terriajs `yarn install` throws error
```
An unexpected error occurred: "expected workspace package to exist for \"pkg-dir\""
```
or a similar error with a different package.
Sometimes yarn versions after yarn@1.19.0 will cause an error when running yarn install using workspaces. The Github issue describing it https://github.com/yarnpkg/yarn/issues/7807 has comments saying it’s caused by a workspace trying to install a different version of the same dependency.

### Workaround

Easiest fix is to install dependencies using an older version of yarn:
```
npx yarn@1.19.0 install
```
It’s possible the problem could also be fixed in certain cases by syncing dependency versions for the same package, and ensuring that a workspace doesn’t install the same dependency but with a different version. Syncing dependencies could help:
```
gulp sync-terriajs-dependencies
```

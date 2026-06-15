/*eslint-env node*/
/*eslint no-sync: 0*/
/*eslint no-process-exit: 0*/
/*eslint no-redeclare: 0*/
/*eslint @typescript-eslint/no-require-imports: 0*/

"use strict";

/*global require*/
// If gulp tasks are run in a post-install task modules required here must be be a `dependency`
//  in package.json, not just a `devDependency`. This is not currently needed.
var fs = require("fs");
var gulp = require("gulp");
var path = require("path");
var PluginError = require("plugin-error");
var terriajsServerGulpTask = require("terriajs/buildprocess/terriajsServerGulpTask");

var watchOptions = {
  interval: 1000
};

const getBaseHref = () => {
  var minimist = require("minimist");
  // Arguments written in skewer-case can cause problems (unsure why), so stick to camelCase
  var options = minimist(process.argv.slice(2), {
    string: ["baseHref"],
    default: { baseHref: "/" }
  });

  return options.baseHref;
};

gulp.task("check-terriajs-dependencies", function (done) {
  var appPackageJson = require("./package.json");
  var terriaPackageJson = require("terriajs/package.json");

  syncDependencies(appPackageJson.dependencies, terriaPackageJson, true);
  syncDependencies(appPackageJson.devDependencies, terriaPackageJson, true);
  done();
});

gulp.task("write-version", function (done) {
  var fs = require("fs");
  var spawnSync = require("child_process").spawnSync;

  const nowDate = new Date();
  const dateString = `${nowDate.getFullYear()}-${
    nowDate.getMonth() + 1
  }-${nowDate.getDate()}`;
  const packageJson = require("./package.json");
  const terriajsPackageJson = require("./node_modules/terriajs/package.json");

  const isClean =
    spawnSync("git", ["status", "--porcelain"]).stdout.toString().length === 0;

  const gitHash = spawnSync("git", ["rev-parse", "--short", "HEAD"])
    .stdout.toString()
    .replace("\n", "");

  let version = `${dateString}-${packageJson.version}-${terriajsPackageJson.version}-${gitHash}`;

  if (!isClean) {
    version += " (plus local modifications)";
  }

  // Write version.js - which will be injected into `{{version}}` in Terria `brandBarElements`
  fs.writeFileSync("version.js", "module.exports = '" + version + "';");

  // Also write out a JSON file with all versions into wwwroot
  fs.writeFileSync(
    "wwwroot/version.json",
    JSON.stringify({
      date: dateString,
      terriajs: terriajsPackageJson.version,
      terriamap: packageJson.version,
      terriamapCommitHash: gitHash,
      hasLocalModifications: !isClean
    })
  );

  done();
});

gulp.task(
  "build-app",
  gulp.parallel(
    gulp.series(
      "check-terriajs-dependencies",
      "write-version",
      function buildApp(done) {
        var runWebpack = require("terriajs/buildprocess/runWebpack.js");
        var webpack = require("webpack");
        var webpackConfig = require("./buildprocess/webpack.config.js")({
          devMode: true,
          baseHref: getBaseHref()
        });

        checkForDuplicateCesium();

        runWebpack(webpack, webpackConfig, done);
      }
    )
  )
);

gulp.task(
  "release-app",
  gulp.parallel(
    gulp.series(
      "check-terriajs-dependencies",
      "write-version",
      function releaseApp(done) {
        var runWebpack = require("terriajs/buildprocess/runWebpack.js");
        var webpack = require("webpack");
        var webpackConfig = require("./buildprocess/webpack.config.js")({
          devMode: false,
          baseHref: getBaseHref()
        });

        checkForDuplicateCesium();

        runWebpack(
          webpack,
          Object.assign({}, webpackConfig, {
            plugins: webpackConfig.plugins || []
          }),
          done
        );
      }
    )
  )
);

gulp.task(
  "watch-app",
  gulp.parallel(
    gulp.series("check-terriajs-dependencies", function watchApp(done) {
      var fs = require("fs");
      var watchWebpack = require("terriajs/buildprocess/watchWebpack");
      var webpack = require("webpack");
      var webpackConfig = require("./buildprocess/webpack.config.js")({
        devMode: true,
        baseHref: getBaseHref()
      });

      checkForDuplicateCesium();

      fs.writeFileSync("version.js", "module.exports = 'Development Build';");
      watchWebpack(webpack, webpackConfig, done);
    })
  )
);

gulp.task("copy-terriajs-assets", function () {
  var terriaWebRoot = path.join(getPackageRoot("terriajs"), "wwwroot");
  var sourceGlob = path.join(terriaWebRoot, "**");
  var destPath = path.resolve(__dirname, "wwwroot", "build", "TerriaJS");

  return gulp
    .src([sourceGlob], { base: terriaWebRoot, encoding: false })
    .pipe(gulp.dest(destPath));
});

gulp.task(
  "watch-terriajs-assets",
  gulp.series("copy-terriajs-assets", function waitForTerriaJsAssetChanges() {
    var terriaWebRoot = path.join(getPackageRoot("terriajs"), "wwwroot");
    var sourceGlob = path.join(terriaWebRoot, "**");

    // gulp.watch as of gulp v4.0.0 doesn't work with backslashes (the task is never triggered).
    // But Windows is ok with forward slashes, so use those instead.
    if (path.sep === "\\") {
      sourceGlob = sourceGlob.replace(/\\/g, "/");
    }

    gulp.watch(sourceGlob, watchOptions, gulp.series("copy-terriajs-assets"));
  })
);

gulp.task("lint", function (done) {
  var runExternalModule = require("terriajs/buildprocess/runExternalModule");
  const eslintDir = path.dirname(require.resolve("eslint/package.json"));
  const eslintExecutable = path.join(eslintDir, "bin", "eslint.js");
  runExternalModule(eslintExecutable, [
    "--max-warnings",
    "0",
    "index.js",
    "lib"
  ]);
  done();
});

function getPackageRoot(packageName) {
  return path.dirname(require.resolve(packageName + "/package.json"));
}

gulp.task("clean", function (done) {
  var fs = require("fs-extra");

  // // Remove build products
  fs.removeSync(path.join("wwwroot", "build"));

  done();
});

gulp.task("sync-terriajs-dependencies", function (done) {
  var appPackageJson = require("./package.json");
  var terriaPackageJson = require("terriajs/package.json");

  syncDependencies(appPackageJson.dependencies, terriaPackageJson);
  syncDependencies(appPackageJson.devDependencies, terriaPackageJson);

  fs.writeFileSync(
    "./package.json",
    JSON.stringify(appPackageJson, undefined, "  ")
  );
  console.log(
    "TerriaMap's package.json has been updated. Now run yarn install."
  );
  done();
});

function syncDependencies(dependencies, targetJson, justWarn) {
  for (var dependency in dependencies) {
    // eslint-disable-next-line no-prototype-builtins
    if (dependencies.hasOwnProperty(dependency)) {
      var version =
        targetJson.dependencies[dependency] ||
        targetJson.devDependencies[dependency];
      if (version && version !== dependencies[dependency]) {
        if (justWarn) {
          console.warn(
            "Warning: There is a version mismatch for " +
              dependency +
              ". This build may fail or hang. You should run `gulp sync-terriajs-dependencies`, then re-run `npm install`, then run gulp again."
          );
        } else {
          console.log(
            "Updating " +
              dependency +
              " from " +
              dependencies[dependency] +
              " to " +
              version +
              "."
          );
          dependencies[dependency] = version;
        }
      }
    }
  }
}

function checkForDuplicateCesium() {
  var fse = require("fs-extra");

  if (
    fse.existsSync("node_modules/terriajs-cesium") &&
    fse.existsSync("node_modules/terriajs/node_modules/terriajs-cesium")
  ) {
    console.log(
      "You have two copies of terriajs-cesium, one in this application's node_modules\n" +
        "directory and the other in node_modules/terriajs/node_modules/terriajs-cesium.\n" +
        "This leads to strange problems, such as knockout observables not working.\n" +
        "Please verify that node_modules/terriajs-cesium is the correct version and\n" +
        "  rm -rf node_modules/terriajs/node_modules/terriajs-cesium\n" +
        "Also consider running:\n" +
        "  yarn gulp sync-terriajs-dependencies\n" +
        "to prevent this problem from recurring the next time you `npm install`."
    );
    throw new PluginError(
      "checkForDuplicateCesium",
      "You have two copies of Cesium.",
      { showStack: false }
    );
  }
}

gulp.task("terriajs-server", terriajsServerGulpTask(3001));

gulp.task("build", gulp.series("copy-terriajs-assets", "build-app"));
gulp.task("release", gulp.series("copy-terriajs-assets", "release-app"));
gulp.task("watch", gulp.parallel("watch-terriajs-assets", "watch-app"));
// Simple task that waits for index.html then starts server
gulp.task(
  "dev",
  gulp.parallel("watch", function startServerWhenReady(done) {
    const indexFile = path.join(__dirname, "wwwroot", "index.html");

    if (fs.existsSync(indexFile)) {
      terriajsServerGulpTask(3001)(done);
      return;
    }
    var watcher = gulp.watch(
      path.join(__dirname, "wwwroot", "index.html"),
      watchOptions
    );
    watcher.on("add", function () {
      watcher.close();
      terriajsServerGulpTask(3001)(done);
    });
  })
);
gulp.task("default", gulp.series("lint", "build"));

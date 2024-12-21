/*eslint-env node*/
/*eslint no-sync: 0*/

"use strict";

// Every module required-in here must be a `dependency` in package.json, not just a `devDependency`,
// so that our postinstall script (which runs `gulp post-npm-install`) is able to run without
// the devDependencies available.  Individual tasks, other than `post-npm-install` and any tasks it
// calls, may require in `devDependency` modules locally.
var gulp = require("gulp");
var terriajsServerGulpTask = require("./buildprocess/terriajsServerGulpTask");

function buildSpecs(done) {
  var runWebpack = require("./buildprocess/runWebpack.js");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(
    false,
    true
  );

  runWebpack(webpack, webpackConfig, done);
}
buildSpecs.displayName = "build-specs";

function releaseSpecs(done) {
  var runWebpack = require("./buildprocess/runWebpack.js");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(
    false,
    false
  );

  runWebpack(webpack, webpackConfig, done);
}
releaseSpecs.displayName = "release-specs";

function watchSpecs(done) {
  var watchWebpack = require("./buildprocess/watchWebpack");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(
    false,
    true
  );

  watchWebpack(webpack, webpackConfig, done);
}
watchSpecs.displayName = "watch-specs";

function lint(done) {
  var runExternalModule = require("./buildprocess/runExternalModule");
  var path = require("path");

  const eslintDir = path.dirname(require.resolve("eslint/package.json"));
  const eslintExecutable = path.join(eslintDir, "bin", "eslint.js");
  runExternalModule(eslintExecutable, [
    "lib",
    "test",
    "--ext",
    ".jsx,.js,.ts,.tsx",
    "--max-warnings",
    "0"
  ]);

  done();
}
lint.description = "Run ESLint.";

function jsdoc(done) {
  var runExternalModule = require("./buildprocess/runExternalModule");

  runExternalModule("jsdoc/jsdoc.js", [
    "./lib",
    "-c",
    "./buildprocess/jsdoc.json"
  ]);

  done();
}
jsdoc.description = "Build developer reference documentation.";
jsdoc.displayName = "reference-guide";

function copyCesiumWorkers() {
  var path = require("path");

  var cesiumPackage = require.resolve("terriajs-cesium/package.json");
  var cesiumRoot = path.dirname(cesiumPackage);
  var cesiumWorkersRoot = path.join(cesiumRoot, "Build", "Workers");

  return gulp
    .src([path.join(cesiumWorkersRoot, "**")], {
      base: cesiumWorkersRoot,
      encoding: false
    })
    .pipe(gulp.dest("wwwroot/build/Cesium/build/Workers"));
}
copyCesiumWorkers.displayName = "copy-cesium-workers";

function copyCesiumThirdparty() {
  var path = require("path");

  var cesiumPackage = require.resolve("terriajs-cesium/package.json");
  var cesiumRoot = path.dirname(cesiumPackage);
  var cesiumThirdPartyRoot = path.join(cesiumRoot, "Source", "ThirdParty");

  return gulp
    .src([path.join(cesiumThirdPartyRoot, "**")], {
      base: cesiumThirdPartyRoot,
      encoding: false
    })
    .pipe(gulp.dest("wwwroot/build/Cesium/build/ThirdParty"));
}
copyCesiumThirdparty.displayName = "copy-cesium-thirdparty";

function copyCesiumSourceAssets() {
  var path = require("path");

  var cesiumPackage = require.resolve("terriajs-cesium/package.json");
  var cesiumRoot = path.dirname(cesiumPackage);
  var cesiumAssetsRoot = path.join(cesiumRoot, "Source", "Assets");

  return gulp
    .src([path.join(cesiumAssetsRoot, "**")], {
      base: cesiumAssetsRoot,
      encoding: false
    })
    .pipe(gulp.dest("wwwroot/build/Cesium/build/Assets"));
}
copyCesiumSourceAssets.displayName = "copy-cesium-source-assets";

function testBrowserstack(done) {
  runKarma("./buildprocess/karma-browserstack.conf.js", done);
}
testBrowserstack.description = "Run tests in Browserstack.";
testBrowserstack.displayName = "test-browserstack";

function testSaucelabs(done) {
  runKarma("./buildprocess/karma-saucelabs.conf.js", done);
}
testSaucelabs.description = "Run tests in Saucelabs";
testSaucelabs.displayName = "test-saucelabs";

function testFirefox(done) {
  runKarma("./buildprocess/karma-firefox.conf.js", done);
}
testFirefox.description = "Run tests with Firefox.";
testFirefox.displayName = "test-firefox";

function testTravis(done) {
  if (process.env.SAUCE_ACCESS_KEY) {
    runKarma("./buildprocess/karma-saucelabs.conf.js", done);
  } else {
    console.log(
      "SauceLabs testing is not available for pull requests outside the main repo; using local headless Firefox instead."
    );
    runKarma("./buildprocess/karma-firefox.conf.js", done);
  }
}
testTravis.description = "Run tests when running in Travis.";
testTravis.displayName = "test-travis";

function test(done) {
  runKarma("./buildprocess/karma-local.conf.js", done);
}
test.description = "Run tests.";

function runKarma(configFile, done) {
  const { Server } = require("karma");
  const path = require("path");
  const server = new Server(
    {
      configFile: path.join(__dirname, configFile)
    },
    function (e) {
      return done(e);
    }
  );
  server.start();
}

function codeAttribution(done) {
  var spawnSync = require("child_process").spawnSync;

  var result = spawnSync(
    "yarn",
    ["licenses generate-disclaimer > doc/acknowledgements/attributions.md"],
    {
      stdio: "inherit",
      shell: true
    }
  );
  if (result.status !== 0) {
    throw new Error(
      "Generating code attribution exited with an error.\n" +
        result.stderr.toString(),
      { showStack: false }
    );
  }
  done();
}
codeAttribution.description = "Generate doc/acknowledgements/attributions.md.";
codeAttribution.displayName = "code-attribution";

function buildForDocGeneration(done) {
  var runWebpack = require("./buildprocess/runWebpack.js");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack-tools.config.js")();

  runWebpack(webpack, webpackConfig, done);
}

function copyToBuild(done) {
  const fse = require("fs-extra");
  fse.copySync("doc", "build/doc");
  done();
}
copyToBuild.displayName = "copy-to-build";

function generateMemberPages(done) {
  const fse = require("fs-extra");
  const PluginError = require("plugin-error");
  const spawnSync = require("child_process").spawnSync;

  fse.mkdirpSync("build/doc/connecting-to-data/catalog-type-details");

  const result = spawnSync("node", ["generateDocs.js"], {
    cwd: "build",
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    throw new PluginError(
      "user-doc",
      "Generating catalog members pages exited with an error.",
      { showStack: false }
    );
  }
  done();
}
generateMemberPages.displayName = "generate-member-pages";

function mkdocs(done) {
  const PluginError = require("plugin-error");
  const spawnSync = require("child_process").spawnSync;

  const result = spawnSync(
    "mkdocs",
    ["build", "--clean", "--config-file", "mkdocs.yml"],
    {
      cwd: "build",
      stdio: "inherit",
      shell: false
    }
  );
  if (result.status !== 0) {
    throw new PluginError(
      "user-doc",
      `Mkdocs exited with an error. Maybe you didn't install mkdocs and other python dependencies in requirements.txt - see https://docs.terria.io/guide/contributing/development-environment/#documentation?`,
      {
        showStack: false
      }
    );
  }
  done();
}

const renderGuide = gulp.series(copyToBuild, generateMemberPages, mkdocs);
renderGuide.description = "Build user guide documentation.";
renderGuide.displayName = "render-guide";

function copyIndex(done) {
  var fse = require("fs-extra");
  fse.copySync("doc/index-redirect.html", "wwwroot/doc/index.html");
  done();
}
copyIndex.displayName = "copy-index";

const docs = gulp.series(
  gulp.parallel(codeAttribution, buildForDocGeneration),
  renderGuide,
  copyIndex
);
docs.description = "Generate developer- and user-documentation.";

function terriajsServer(done) {
  terriajsServerGulpTask(3002)(done);
}
terriajsServer.description = "Start TerriaJS server.";
terriajsServer.displayName = "terriajs-server";
terriajsServer.flags = {
  "--terriajsServerArg": "Argument to pass to terriaJsServer"
};

const copyCesiumAssets = gulp.series(
  copyCesiumSourceAssets,
  copyCesiumWorkers,
  copyCesiumThirdparty
);
copyCesiumAssets.displayName = "copy-cesium-assets";

const build = gulp.series(copyCesiumAssets, buildSpecs);
build.description = "Build non-minified version of TerriaJS tests.";

const release = gulp.series(copyCesiumAssets, releaseSpecs);
release.description = "Build minified version of TerriaJS tests.";

const watch = gulp.series(copyCesiumAssets, watchSpecs);
watch.description = "Build TerriaJS tests when there are source changes.";

const dev = gulp.parallel(terriajsServer, watch);
dev.description = "Start TerriaJS server and watch for source changes.";

const postNpmInstall = copyCesiumAssets;
postNpmInstall.description = "Copy Cesium assets after installation.";
postNpmInstall.displayName = "post-npm-install";

const lintBuild = gulp.series(lint, build);
lintBuild.description = "Run ESLint followed by build.";

exports.lint = lint;
exports.build = build;
exports.watch = watch;
exports.dev = dev;
exports.terriajsServer = terriajsServer;
exports.docs = docs;
exports.jsdoc = jsdoc;
exports.renderGuide = renderGuide;
exports.codeAttribution = codeAttribution;
exports.test = test;
exports.testFirefox = testFirefox;
exports.testBrowserstack = testBrowserstack;
exports.testSaucelabs = testSaucelabs;
exports.testTravis = testTravis;
exports.release = release;
exports.postNpmInstall = postNpmInstall;
exports.default = lintBuild;

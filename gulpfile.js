/*eslint-env node*/
/*eslint no-sync: 0*/
/* eslint-disable @typescript-eslint/no-require-imports */

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
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(true);

  runWebpack(webpack, webpackConfig, done);
}

function releaseSpecs(done) {
  var runWebpack = require("./buildprocess/runWebpack.js");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(false);

  runWebpack(webpack, webpackConfig, done);
}

function watchSpecs(done) {
  var watchWebpack = require("./buildprocess/watchWebpack");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(true);

  watchWebpack(webpack, webpackConfig, done);
}

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
    "0",
    "--report-unused-disable-directives"
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

async function runJasmineBrowser(browserName) {
  var { runSpecs } = require("jasmine-browser-runner");
  var config = (await import("./test/jasmine-browser.mjs")).default;
  if (browserName) {
    config = Object.assign({}, config, { browser: browserName });
  }
  await runSpecs(config);
}

function testFirefox(done) {
  runJasmineBrowser("headlessFirefox").then(
    function () {
      done();
    },
    function (e) {
      done(e);
    }
  );
}
testFirefox.description = "Run tests with Firefox.";
testFirefox.displayName = "test-firefox";

function test(done) {
  runJasmineBrowser().then(
    function () {
      done();
    },
    function (e) {
      done(e);
    }
  );
}
test.description = "Run tests.";

const attributionTemplate = `---
search:
  exclude: true
---

# Attributions
`;

function codeAttribution(done) {
  var spawnSync = require("child_process").spawnSync;
  const { writeFileSync } = require("node:fs");

  writeFileSync("doc/acknowledgements/attributions.md", attributionTemplate);

  var result = spawnSync(
    "yarn",
    ["licenses generate-disclaimer >> doc/acknowledgements/attributions.md"],
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

const renderGuide = gulp.series(
  function copyToBuild(done) {
    const fs = require("node:fs");
    fs.cpSync("doc", "build/doc", { recursive: true });
    done();
  },
  function generateMemberPages(done) {
    const fs = require("node:fs");
    const PluginError = require("plugin-error");
    const spawnSync = require("child_process").spawnSync;

    fs.mkdirSync("build/doc/connecting-to-data/catalog-type-details", {
      recursive: true
    });

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
  },
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
);
renderGuide.description = "Build user guide documentation.";
renderGuide.displayName = "render-guide";

const docs = gulp.series(
  gulp.parallel(codeAttribution, buildForDocGeneration),
  renderGuide,
  function copyIndex(done) {
    var fs = require("node:fs");
    fs.cpSync("doc/index-redirect.html", "wwwroot/doc/index.html");
    done();
  }
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

const build = gulp.series(copyCesiumAssets, buildSpecs);
build.description = "Build non-minified version of TerriaJS tests.";

const release = gulp.series(copyCesiumAssets, releaseSpecs);
release.description = "Build minified version of TerriaJS tests.";

const watch = gulp.series(copyCesiumAssets, watchSpecs);
watch.description = "Build TerriaJS tests when there are source changes.";

function serveTests(done) {
  import("./test/jasmine-browser.mjs").then(function (mod) {
    var { Server } = require("jasmine-browser-runner");
    var server = new Server(mod.default);
    server.start().then(function () {
      console.log("Jasmine test runner: http://localhost:" + mod.default.port);
    });
  }, done);
}
serveTests.description =
  "Start jasmine-browser-runner server for interactive testing.";
serveTests.displayName = "serve-tests";

const dev = gulp.parallel(terriajsServer, watch, serveTests);
dev.description =
  "Start TerriaJS server, watch for source changes, and serve tests.";

const postNpmInstall = copyCesiumAssets;
postNpmInstall.description = "Copy Cesium assets after installation.";
postNpmInstall.displayName = "post-npm-install";

const lintBuild = gulp.series(lint, build);
lintBuild.description = "Run ESLint followed by build.";

exports.lint = lint;
exports.build = build;
exports.watch = watch;
exports.dev = dev;
exports.serveTests = serveTests;
exports.terriajsServer = terriajsServer;
exports.docs = docs;
exports.jsdoc = jsdoc;
exports.renderGuide = renderGuide;
exports.codeAttribution = codeAttribution;
exports.test = test;
exports.testFirefox = testFirefox;
exports.release = release;
exports.postNpmInstall = postNpmInstall;
exports.default = lintBuild;

/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path");
const fs = require("fs");
/**
 * RegExp pattern used for matching plugin package names for applying various rules.
 *
 * The pattern is a bit permissive, matching any names that begin with
 * "terriajs-" and has the word "plugin" anywhere in it.  It will match
 * "terriajs-plugin-sample", "terriajs-sample-plugin" as well as
 * "terriajs-some-plugin-for-something".
 */
const PluginPackagePattern = /(^@terriajs\/plugin-*|^terriajs-.*plugin)/;

function configureWebpackForPlugins(config) {
  config.module.rules.push(createPluginIconsRule());
  return config;
}

/**
 * Creates a webpack rule for processing svg icons from terriajs plugins using terriajs `svg-sprite-loader`.
 * We check two things to decide whether to include an icon:
 *   1. The icon belongs to assets/icons folder
 *   2. assets/icons/../../package.json has a name field with `terriajs-plugin-` prefix
 *
 * @returns A webpack module rule
 */
function createPluginIconsRule() {
  const packageNames = {};
  return {
    test: /\.svg$/,
    include(svgPath) {
      const dirName = path.dirname(svgPath);
      const isIconDir = dirName.endsWith(path.join("assets", "icons"));
      if (!isIconDir) {
        return false;
      }

      const packageName = readPackageName(
        path.resolve(dirName, "..", "..", "package.json")
      );

      const isTerriaJsPlugin = packageName
        ? PluginPackagePattern.test(packageName)
        : false;

      packageNames[svgPath] = packageName;
      return isTerriaJsPlugin;
    },
    loader: require.resolve("terriajs/buildprocess/svgs/svg-sprite-loader.js"),
    options: {
      namespace: (svgPath) => {
        // Generate a symbolId by concatenating the package name and the icon name
        const packageName = packageNames[svgPath] || "terriajs-plugin";
        return packageName;
      }
    }
  };
}

const packageJsonNames = {};
function readPackageName(packageFile) {
  if (packageJsonNames[packageFile]) {
    return packageJsonNames[packageFile];
  } else {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageFile));
      packageJsonNames[packageFile] = packageJson
        ? packageJson.name
        : undefined;
      return packageJsonNames[packageFile];
    } catch {
      return;
    }
  }
}

module.exports = configureWebpackForPlugins;

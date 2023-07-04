/**
 * TODOs:
 *  - DONE De-duplicate generated css
 *  - Minify generated css
 *  - DONE Figure out a way to extract css (for prod builds)
 *  - Adding sass increases the build time on my machine to ~5 secs. See if we can improve it.
 */

const esbuildSassPlugin = require("esbuild-sass-plugin").default;
const postcss = require("postcss");
const postcssSassPlugin = require("@csstools/postcss-sass");
const postcssScssPlugin = require("postcss-scss");
const postcssModulesPlugin = require("postcss-modules");
const FileSystemLoader =
  require("postcss-modules/build/FileSystemLoader").default;
const PostCssModulesParser = require("postcss-modules/build/Parser").default;

class TerriaSassModuleLoader extends FileSystemLoader {
  constructor(root, plugins) {
    super(root, plugins);
    this.core.load = async function loadSassModule(
      sourceString,
      sourcePath,
      trace,
      pathFetcher
    ) {
      const parser = new PostCssModulesParser(pathFetcher, trace);
      await postcss([...this.plugins, parser.plugin()]).process(sourceString, {
        from: sourcePath,
        syntax: postcssScssPlugin
      });
      return {
        // Don't add the CSS to the injectSource, because that will cause
        // imports to be duplicated in every file.
        injectableSource: "",
        exportTokens: parser.exportTokens
      };
    };
  }
}

/**
 * A scss + css-modules, esbuild plugin for loading terriajs sass modules
 *
 * There is legacy code in Terria that uses a combination of scss +
 * css-modules.  We can use a combination of esbuild-sass-plugin and
 * css-modules plugin to process them.  However, the css-modules plugin trips
 * when it encounters `composes` instructions that import other sass-modules.
 * eg: 'composes: x from "somewhere.scss"'.
 *
 * So we have to setup our own Loader
 * to pre-compile sass imports to css that css-modules plugin understands.
 *
 * Because we don't actually import the CSS from the target of the `composes`
 * (if we did, it would be duplicated many times over and also cause style
 * precedence problems), we need to manually (and really early!) import every
 * scss file that we compose from. This currently happens at the top of
 * TerriaMap's index.js.
 */
const sassModulesPlugin = ({ includePaths }) => {
  return esbuildSassPlugin({
    transform: async function (source, dirname, from) {
      let cssModule;
      const { css } = await postcss([
        postcssSassPlugin({
          includePaths
        }),
        postcssModulesPlugin({
          Loader: TerriaSassModuleLoader,
          localsConvention: "camelCase",
          generateScopedName: "tjs-[name]__[local]",
          getJSON(cssFilename, json) {
            cssModule = JSON.stringify(json, null, 2);
          }
        })
      ]).process(source, { from, map: false, syntax: postcssScssPlugin });
      return {
        contents: css,
        pluginData: { exports: cssModule },
        loader: "js"
      };
    }
  });
};

sassModulesPlugin.TerriaSassModuleLoader = TerriaSassModuleLoader;

module.exports = sassModulesPlugin;

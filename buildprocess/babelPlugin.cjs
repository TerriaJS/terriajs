const babel = require("@babel/core");
const fs = require("fs/promises");
const path = require("path");

const babelPlugin = (options = {}) => ({
  name: "babel",
  setup(build, { transform } = {}) {
    const { filter = /.*/, namespace = "", config = {} } = options;

    const transformContents = ({ args, contents }) => {
      const babelOptions = babel.loadOptions({
        ...config,
        filename: args.path,
        caller: {
          name: "esbuild-plugin-babel",
          supportsStaticESM: true
        }
      });
      if (!babelOptions) return { contents };

      if (babelOptions.sourceMaps) {
        const filename = path.relative(process.cwd(), args.path);
        babelOptions.sourceFileName = filename;
      }

      return new Promise((resolve, reject) => {
        babel.transform(contents, babelOptions, (error, result) => {
          error
            ? reject(error)
            : resolve({ contents: result.code, loader: "default" });
        });
      });
    };

    if (transform) return transformContents(transform);

    build.onLoad({ filter, namespace }, async (args) => {
      const contents = await fs.readFile(args.path, "utf8");
      return transformContents({ args, contents });
    });
  }
});

module.exports = babelPlugin;

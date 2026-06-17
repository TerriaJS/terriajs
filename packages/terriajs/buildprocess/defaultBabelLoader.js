/**
 * Default babel config used by terriajs and terriamap
 */
const defaultBabelLoader = ({ devMode }) => ({
  loader: "babel-loader",
  options: {
    cacheDirectory: true,
    sourceMaps: !!devMode,
    presets: [
      [
        "@babel/preset-env",
        {
          corejs: 3,
          useBuiltIns: "usage",
          // this is a popular browserslist target used by create-react-app
          // npx browserslist "<target>" to see the actual list of target browsers
          targets: ">0.2%, not dead, not op_mini all"

          // Enable debug to print logs including browser targets,
          // polyfills used for individual files etc.
          // debug: true
        }
      ],
      ["@babel/preset-react", { runtime: "automatic" }],
      ["@babel/preset-typescript", { allowNamespaces: true }]
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/transform-class-properties"],
      "babel-plugin-styled-components"
    ],
    assumptions: {
      setPublicClassFields: false
    }
  }
});

module.exports = defaultBabelLoader;

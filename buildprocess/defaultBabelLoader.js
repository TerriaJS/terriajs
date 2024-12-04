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
          useBuiltIns: "usage"
        }
      ],
      ["@babel/preset-react", { runtime: "automatic" }],
      ["@babel/typescript", { allowNamespaces: true }]
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      "babel-plugin-styled-components"
    ],
    assumptions: {
      setPublicClassFields: false
    }
  }
});

module.exports = defaultBabelLoader;

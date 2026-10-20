//@ts-check
import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";

/** @type {import('rollup').RollupOptions[]} */
export default [
  // JavaScript build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "es",
      sourcemap: true
    },
    external: ["react", "react-dom", "react/jsx-runtime"],
    plugins: [
      esbuild({
        target: "es2022",
        jsx: "automatic",
        tsconfig: "./tsconfig.json"
      })
    ]
  },
  // TypeScript declarations
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es"
    },
    external: ["react", "react-dom", "react/jsx-runtime"],
    plugins: [dts()]
  }
];

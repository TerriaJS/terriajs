//@ts-check
import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";

/** @type {import('rollup').RollupOptions[]} */
export default [
  // JavaScript build
  {
    input: { index: "src/index.ts", "sprite/index": "src/sprite/index.ts" },
    // A file per icon, so apps can import one icon by path
    output: {
      dir: "dist",
      format: "es",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src"
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
    input: { index: "src/index.ts", "sprite/index": "src/sprite/index.ts" },
    output: {
      dir: "dist",
      format: "es",
      preserveModules: true,
      preserveModulesRoot: "src"
    },
    external: ["react", "react-dom", "react/jsx-runtime"],
    plugins: [dts()]
  }
];

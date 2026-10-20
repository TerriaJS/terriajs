//@ts-check
import esbuild from "rollup-plugin-esbuild";
import { glob } from "glob";

// Find all index.ts files (main + all component indexes)
const inputFiles = glob.sync("src/**/index.ts");

/** @type {import('rollup').RollupOptions} */
const config = {
  input: [...inputFiles],
  output: {
    dir: "dist",
    format: "es",
    preserveModules: true,
    preserveModulesRoot: "src",
    sourcemap: true
  },
  external: ["react", "react-dom", "react/jsx-runtime"],
  plugins: [
    esbuild({
      target: "es2022",
      jsx: "automatic",
      tsconfig: "./tsconfig.json"
    })
  ],
  watch: {
    include: "src/**",
    exclude: "node_modules/**",
    clearScreen: false
  }
};

export default config;

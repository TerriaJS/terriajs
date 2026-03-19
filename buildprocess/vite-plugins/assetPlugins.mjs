/**
 * Strip moment.js locale imports to save ~500KB.
 * Webpack used IgnorePlugin for this; in Vite we return an empty module.
 *
 * @returns {import("vite").Plugin}
 */
export function momentLocalePlugin() {
  return {
    name: "moment-locale-strip",
    resolveId(source, importer) {
      if (source === "./locale" && importer && importer.includes("moment")) {
        return "\0moment-locale-empty";
      }
    },
    load(id) {
      if (id === "\0moment-locale-empty") {
        return "export default {};";
      }
    }
  };
}

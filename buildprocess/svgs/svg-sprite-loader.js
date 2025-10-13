const path = require("path");
const collector = require("./svg-sprite-collector");

/**
 * SVG Sprite Loader
 * Processes each .svg icon module and registers it in the shared collector
 */
function svgSpriteLoader(content) {
  const resourcePath = this.resourcePath;

  const options = this.getOptions();

  let namespace;
  if (typeof options.namespace === "function") {
    namespace = options.namespace(resourcePath);
  } else {
    namespace = options.namespace ?? "default";
  }

  // Get icon ID from filename
  const iconId = path.basename(resourcePath, ".svg");

  // Register icon in the shared collector
  collector.addIcon(namespace, iconId, {
    path: resourcePath,
    content: content
  });

  // Return module that exports the icon reference
  const moduleCode = `
// SVG Icon: ${iconId}
export default { id: "${namespace}-${iconId}" };
export const id = "${namespace}-${iconId}";
export const name = "${iconId}";
`;

  return moduleCode;
}

module.exports = svgSpriteLoader;

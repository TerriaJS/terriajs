const fse = require("fs-extra");
const path = require("path");
const codeBlock = require("common-tags/lib/codeBlock");

// Add support for requiring TypeScript files and AMD modules.
require("amd-loader");
require("ts-node/register");

const definitionDir = path.resolve(__dirname, "..", "lib", "Definitions");
const files = fse.readdirSync(definitionDir);
const definitionFiles = files.filter(
  (name) => name !== "ModelDefinition.ts" && /Definition\.ts$/.test(name)
);

definitionFiles.forEach((file) => {
  const className = file.substring(0, file.length - "Definition.ts".length);
  generateInterfaces(
    className,
    path.join(definitionDir, file),
    path.join(definitionDir, className + "Interfaces.ts")
  );
});

function generateInterfaces(className, definitionFile, interfaceFile) {
  const definition = require(definitionFile).default;
  const properties = Object.keys(definition.properties).map(
    (key) => definition.properties[key]
  );

  const generated = codeBlock`
        export interface ${className} {
            readonly type: '${definition.type}';
            readonly typeName: '${definition.name}';
            readonly typeDescription: '${definition.description}';

            ${properties.map(generatePropertyDeclaration)}
        }
    `;

  console.log(generated);
  return generated;
}

function generatePropertyDeclaration(property) {
  const generated = codeBlock`
        ${property.id}: ${property.type};
    `;
  return generated;
}

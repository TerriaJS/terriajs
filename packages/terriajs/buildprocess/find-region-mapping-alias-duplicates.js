const fs = require("fs");
const regions = JSON.parse(
  fs.readFileSync("wwwroot/data/regionMapping.json")
).regionWmsMap;

const aliasToType = new Map();
for (const [regType, regDef] of Object.entries(regions)) {
  for (const alias of regDef.aliases ?? []) {
    aliasToType.set(alias, [...(aliasToType.get(alias) ?? []), regType]);
  }
}

let issues = 0;
for (const [alias, regTypes] of aliasToType.entries()) {
  if (regTypes.length > 1) {
    console.error(
      `Alias "${alias}" used in multiple types: ${regTypes.join(", ")}`
    );
    issues++;
  }
}
process.exitCode = issues > 0 ? 1 : 0;

const fse = require("fs-extra");

/** Print list of datasets that have been removed/added between two catalog index
 *
 * Usage:
 * `node diffCatalogIndex.js path-to-old path-to-new`
 */
const [oldPath, newPath] = process.argv.slice(2);

function sortIndex(index) {
  return Object.keys(index)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, currentKey) => {
      acc[currentKey] = index[currentKey];
      return acc;
    }, {});
}

function itemPath(item, index) {
  return (
    (index[item.memberKnownContainerUniqueIds[0]]
      ? itemPath(index[item.memberKnownContainerUniqueIds[0]], index) + "/"
      : "") + item.name
  );
}

// Sorting isn't necessary here - but it makes it easier to compare JSON objects by hand if needed
const oldCatalogIndex = sortIndex(
  JSON.parse(fse.readFileSync(oldPath).toString())
);

const newCatalogIndex = sortIndex(
  JSON.parse(fse.readFileSync(newPath).toString())
);

const oldKeys = new Set(Object.keys(oldCatalogIndex));
const newKeys = new Set(Object.keys(newCatalogIndex));

console.log("Datasets which have been added");

newKeys.forEach((newKey) => {
  if (!oldKeys.has(newKey)) {
    const item = newCatalogIndex[newKey];
    console.log(
      `+ ${newCatalogIndex[newKey].name} (${itemPath(item, newCatalogIndex)})`
    );
  }
});

console.log("\n\nDatasets which have been removed");

oldKeys.forEach((oldKey) => {
  if (!newKeys.has(oldKey)) {
    const item = oldCatalogIndex[oldKey];
    console.log(`- ${item.name} (${itemPath(item, oldCatalogIndex)})`);
  }
});

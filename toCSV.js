const { readFileSync, writeFileSync } = require("fs");
const converter = require("json-2-csv");

const data = require("./catalog-index.json");
const array = Object.entries(data)
  .map(([key, value]) => {
    return {
      ...value,
      id: key
    };
  })
  .sort((a, b) => {
    return a.path.localeCompare(b.path);
  });

const csv = converter.json2csv(array, {
  // unwindArrays: true
});
console.log(csv.length);
writeFileSync("catalog.csv", csv);

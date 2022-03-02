// Install husky only if terriajs is a local editable clone
// Avoids installing on CI & erroring when installed as a
//  git dependency (e.g. "terriajs": "TerriaJS/terriajs#my-branch")
const isCi = process.env.CI !== undefined;
if (!isCi && require("fs").existsSync(".git")) {
  require("husky").install();
}

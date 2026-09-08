import fs from "node:fs";

export default function exists(pathName) {
  try {
    fs.statSync(pathName);
    return true;
  } catch {
    return false;
  }
}

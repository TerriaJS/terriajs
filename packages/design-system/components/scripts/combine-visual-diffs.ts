// Puts each visual test failure's three images side by side, for the PR
// comment the screenshot bot writes: before (the base branch's render) | diff
// | after (the reference, the change's own render). Reads the failures
// Vitest wrote to $VISUAL_SCREENSHOTS/__diffs__ and writes one image each to
// $VISUAL_SCREENSHOTS/__report__, keeping the test file folders
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { PNG } from "pngjs";

const GAP = 16;

const root = process.env["VISUAL_SCREENSHOTS"];
if (!root) throw new Error("Set VISUAL_SCREENSHOTS to the references' folder");
const diffs = join(root, "__diffs__");
const report = join(root, "__report__");

const read = (path: string): PNG => PNG.sync.read(readFileSync(path));

const sideBySide = (images: PNG[]): PNG => {
  const width =
    images.reduce((sum, image) => sum + image.width, 0) +
    GAP * (images.length - 1);
  const height = Math.max(...images.map((image) => image.height));
  // Transparent wherever no image is, so the gaps take the page's colour
  const combined = new PNG({ width, height });
  let x = 0;
  for (const image of images) {
    PNG.bitblt(image, combined, 0, 0, image.width, image.height, x, 0);
    x += image.width + GAP;
  }
  return combined;
};

let count = 0;
for (const entry of readdirSync(diffs, { recursive: true })) {
  const name = String(entry);
  if (!name.endsWith("-diff.png")) continue;
  const base = join(diffs, name.slice(0, -"-diff.png".length));
  const test = relative(diffs, base);
  // The reference stays where it was taken; Vitest writes the rest beside it
  const images = [
    read(`${base}-actual.png`),
    read(`${base}-diff.png`),
    read(join(root, `${test}.png`))
  ];
  const out = join(report, `${test}.png`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, PNG.sync.write(sideBySide(images)));
  count++;
}
process.stdout.write(
  `${String(count)} visual differences combined into ${report}\n`
);

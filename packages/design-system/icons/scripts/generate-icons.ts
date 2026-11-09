// Turns svg/ into src/icons/, a component file per icon and an index of them,
// and src/sprite/, the sprite with every icon as a symbol and the type of
// their names
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import {
  exportName,
  renderIcon,
  renderIndex,
  renderNames,
  renderSprite,
  spriteId
} from "./icon-module.ts";
import type { IconStyle } from "./icons.ts";

const SVG = new URL("../svg/", import.meta.url);
const OUT = new URL("../src/icons/", import.meta.url);
const SPRITE = new URL("../src/sprite/", import.meta.url);

type Source = { file: string; style: IconStyle; svg: string };

const read = async (folder: string, style: IconStyle): Promise<Source[]> => {
  const directory = new URL(folder, SVG);
  const files = (await readdir(directory)).filter((file) =>
    file.endsWith(".svg")
  );
  return Promise.all(
    files.sort().map(async (file) => ({
      file: file.slice(0, -".svg".length),
      style,
      svg: await readFile(new URL(file, directory), "utf8")
    }))
  );
};

const icons = [
  ...(await read("./", "regular")),
  ...(await read("filled/", "filled"))
].map((source) => ({
  ...source,
  name: exportName(source.file, source.style),
  id: spriteId(source.file, source.style)
}));

// Rewritten from scratch, so icons removed from Figma go too
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT);
await Promise.all(
  icons.map(async ({ name, svg }) => {
    await writeFile(
      new URL(`${name}.tsx`, OUT),
      await renderIcon({ name, svg })
    );
  })
);
await writeFile(
  new URL("index.ts", OUT),
  renderIndex(icons.map(({ name }) => name))
);

await writeFile(new URL("sprite.svg", SPRITE), renderSprite(icons));
await writeFile(
  new URL("names.ts", SPRITE),
  renderNames(icons.map(({ id }) => id))
);

process.stdout.write(
  `Generated ${String(icons.length)} icon components and the sprite\n`
);

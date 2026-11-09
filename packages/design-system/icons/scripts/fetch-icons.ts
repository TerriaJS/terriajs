// Downloads the icons from the Figma file into svg/, replacing what's there.
// Needs FIGMA_ACCESS_TOKEN: a Figma personal access token with the
// file_content:read scope, from any account that can view the file. The
// fetch-icons script reads it from the repository's .env
import { mkdir, rm, writeFile } from "node:fs/promises";
import {
  findIcons,
  normalizeSvg,
  resolveIcons,
  type FigmaNode,
  type Icon,
  type IconFile
} from "./icons.ts";

const FILE_KEY = "dsDXz50atuBer9WlJXaflS";
const ICONS_PAGE = "2217:823";
const OUT = new URL("../svg/", import.meta.url);
// Icons left out until they're fixed in Figma, by component node id
const SKIPPED = new Map([
  // The terria-icons/check frame holds a circled check, which clashes with
  // the plain check icon. It belongs with circle-chevron-*, as circle-check
  ["12423:34257", "check (regular): a circled check, to rename circle-check"],
  ["12423:34256", "check (filled): a circled check, to rename circle-check"]
]);

// Ids per image request, and downloads at a time
const BATCH = 100;
const DOWNLOADS = 10;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNode = (value: unknown): value is FigmaNode =>
  isRecord(value) &&
  typeof value["id"] === "string" &&
  typeof value["name"] === "string" &&
  typeof value["type"] === "string" &&
  (value["children"] === undefined ||
    (Array.isArray(value["children"]) && value["children"].every(isNode)));

const chunks = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );

const request = async (url: string, token?: string): Promise<Response> => {
  const response = await fetch(url, {
    headers: token ? { "X-Figma-Token": token } : {}
  });
  if (!response.ok) {
    throw new Error(
      `${url}: ${String(response.status)} ${await response.text()}`
    );
  }
  return response;
};

// The Icons page's node tree
const fetchPage = async (token: string): Promise<FigmaNode> => {
  const body: unknown = await (
    await request(
      `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(ICONS_PAGE)}`,
      token
    )
  ).json();
  const page =
    isRecord(body) && isRecord(body["nodes"])
      ? body["nodes"][ICONS_PAGE]
      : undefined;
  const document = isRecord(page) ? page["document"] : undefined;
  if (!isNode(document)) {
    throw new Error(
      `The Figma API didn't return the Icons page (${ICONS_PAGE})`
    );
  }
  return document;
};

// Temporary download URLs for each icon's SVG export
const fetchExportUrls = async (
  token: string,
  icons: Icon[]
): Promise<Map<string, string>> => {
  const urls = new Map<string, string>();
  for (const batch of chunks(icons, BATCH)) {
    const ids = batch.map((icon) => icon.id).join(",");
    const body: unknown = await (
      await request(
        `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=svg&svg_include_id=false&svg_simplify_stroke=true`,
        token
      )
    ).json();
    const images = isRecord(body) ? body["images"] : undefined;
    for (const icon of batch) {
      const url = isRecord(images) ? images[icon.id] : undefined;
      if (typeof url !== "string") {
        throw new Error(`Figma didn't export ${icon.name} (${icon.id})`);
      }
      urls.set(icon.id, url);
    }
  }
  return urls;
};

const main = async (): Promise<void> => {
  const token = process.env["FIGMA_ACCESS_TOKEN"];
  if (!token) {
    throw new Error(
      "Set FIGMA_ACCESS_TOKEN in .env to a Figma personal access token with the file_content:read scope"
    );
  }

  const icons = findIcons(await fetchPage(token)).filter(
    (icon) => !SKIPPED.has(icon.id)
  );
  if (icons.length === 0) throw new Error("No icons found on the Icons page");
  const urls = await fetchExportUrls(token, icons);

  // Every problem at once, so one run lists everything to fix in Figma
  const problems: string[] = [];
  const files: IconFile[] = [];
  for (const batch of chunks(icons, DOWNLOADS)) {
    const downloads = await Promise.all(
      batch.map(async (icon) => {
        const response = await request(urls.get(icon.id) ?? "");
        return { icon, svg: await response.text() };
      })
    );
    for (const { icon, svg } of downloads) {
      try {
        files.push({
          id: icon.id,
          path:
            icon.style === "filled"
              ? `filled/${icon.name}.svg`
              : `${icon.name}.svg`,
          svg: normalizeSvg(icon.name, svg)
        });
      } catch (error) {
        problems.push(error instanceof Error ? error.message : String(error));
      }
    }
  }

  let resolved: IconFile[] = [];
  try {
    resolved = resolveIcons(files);
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  if (problems.length > 0) {
    throw new Error(`Fix these icons in Figma:\n${problems.join("\n")}`);
  }

  // Replaced whole, so icons deleted in Figma go too
  await rm(OUT, { recursive: true, force: true });
  await mkdir(new URL("filled/", OUT), { recursive: true });
  await Promise.all(
    resolved.map((file) => writeFile(new URL(file.path, OUT), `${file.svg}\n`))
  );
  const filled = resolved.filter((file) =>
    file.path.startsWith("filled/")
  ).length;
  for (const [id, reason] of SKIPPED) {
    console.warn(`Skipped ${id}: ${reason}`);
  }
  process.stdout.write(
    `Wrote ${String(resolved.length)} icons to svg/ (${String(resolved.length - filled)} regular, ${String(filled)} filled)\n`
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

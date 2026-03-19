import fs from "node:fs";
import path from "node:path";

/**
 * Vite plugin that collects SVG icons from configured directories, compiles
 * them into `<symbol>` elements via svg-sprite, and injects them into the HTML.
 *
 * Icons are scanned eagerly at startup so the sprite is ready when
 * `transformIndexHtml` runs (before any JS modules are loaded in dev mode).
 *
 * Individual SVG imports return `{ id: "namespace-iconname" }` matching the
 * shape expected by the Icon component (`<use xlinkHref={"#" + glyph.id} />`).
 *
 * @param {{ dir: string; namespace: string }[]} iconDirs
 * @returns {import("vite").Plugin}
 */
export function svgSpritePlugin(iconDirs) {
  const iconRegistry = new Map();

  function scanIconDirs() {
    for (const { dir, namespace } of iconDirs) {
      if (!fs.existsSync(dir)) continue;

      const icons = new Map();
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".svg")) continue;
        const filePath = path.join(dir, file);
        icons.set(path.basename(file, ".svg"), {
          path: filePath,
          content: fs.readFileSync(filePath, "utf-8")
        });
      }
      iconRegistry.set(namespace, icons);
    }
  }

  async function buildSprites() {
    const SVGSpriter = (await import("svg-sprite")).default;
    const spriteDivs = [];

    for (const [namespace, icons] of iconRegistry.entries()) {
      const spriter = new SVGSpriter({
        mode: {
          symbol: { inline: true, sprite: `sprite-${namespace}`, bust: false }
        },
        svg: { xmlDeclaration: false, doctypeDeclaration: false },
        shape: {
          id: {
            generator: (svg) =>
              `${namespace}-${path.basename(svg.replace(/\s+/g, "_"), ".svg")}`
          },
          transform: [
            {
              svgo: {
                plugins: [{ name: "preset-default" }, "removeXMLNS"]
              }
            }
          ]
        }
      });

      for (const [iconName, data] of icons) {
        spriter.add(data.path, `${iconName}.svg`, data.content);
      }

      const { result } = await spriter.compileAsync();
      const svgContent = result.symbol.sprite.contents.toString();
      const safeNs = namespace.replace(/[^a-zA-Z0-9_]/g, "_");
      spriteDivs.push(
        `<div id="svg-sprite-${safeNs}" style="display:none">${svgContent}</div>`
      );
    }

    return spriteDivs;
  }

  // Pre-compile the sprite once at startup
  let spriteHtmlPromise;

  return {
    name: "svg-sprite",

    buildStart() {
      scanIconDirs();
      spriteHtmlPromise = buildSprites().then((divs) => divs.join(""));
    },

    transform(_code, id) {
      for (const { dir, namespace } of iconDirs) {
        if (!id.endsWith(".svg") || !id.startsWith(dir)) continue;

        const name = path.basename(id, ".svg");
        const symbolId = `${namespace}-${name}`;

        return {
          code: [
            `export default { id: "${symbolId}" };`,
            `export const id = "${symbolId}";`,
            `export const name = "${name}";`
          ].join("\n"),
          map: null
        };
      }
    },

    async transformIndexHtml(html) {
      const spriteHtml = await spriteHtmlPromise;
      if (!spriteHtml) return html;

      return html.replace(
        '<div id="svg-sprites" style="display: none"></div>',
        `<div id="svg-sprites" style="display: none">${spriteHtml}</div>`
      );
    }
  };
}
